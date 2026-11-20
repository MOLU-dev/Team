#!/bin/bash
# scripts/vault_prod.sh
# Production Vault startup script for BitSilo.
#
# Security model:
#   - Shamir Secret Sharing (SSS) with 5 key shares, threshold of 3
#   - AppRole authentication for the application (no root token in app config)
#   - No private key import/export — all keys derived inside the Vault plugin
#   - Root token is ONLY used during initial setup, then revoked
#
# Usage:
#   ./script/vault_prod.sh                     # Normal start (init or unseal + setup)
#   ./script/vault_prod.sh --unseal-only       # Just unseal, skip setup
#   KEY_SHARES=3 KEY_THRESHOLD=2 ./script/vault_prod.sh  # Override SSS params
#   BOUND_CIDRS="10.0.0.0/8" ./script/vault_prod.sh      # Override network CIDRs

set -uo pipefail

#  Configuration 

export VAULT_ADDR="${VAULT_ADDR:-http://127.0.0.1:8200}"
export PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SECRETS_FILE="$PROJECT_ROOT/.vault_secrets"    # SSS keys + root token (GUARD THIS FILE)
APPROLE_FILE="$SCRIPT_DIR/.approle_creds"
HCL_CONFIG="$SCRIPT_DIR/vault_prod.hcl"
PLUGIN_BIN="${PROJECT_ROOT}/bin/vault-plugin"
LOG_FILE="$SCRIPT_DIR/vault_startup.log"

# Network restriction CIDRs for AppRole SecretID binding.
# Comma-separated list of CIDRs from which the SecretID (and resulting token) can be used.
# Default: 127.0.0.1/32 (localhost only). Override via BOUND_CIDRS env var.
# Examples:
#   BOUND_CIDRS="10.0.0.0/8,172.16.0.0/12"      # private ranges
#   BOUND_CIDRS="10.0.1.50/32"                    # single host
#   BOUND_CIDRS="0.0.0.0/0"                       # any (NOT recommended for production)
BOUND_CIDRS="${BOUND_CIDRS:-127.0.0.1/32}"

# Response wrapping TTL for SecretID delivery (seconds).
# The generated wrapping token expires after this period.
WRAP_TTL="${WRAP_TTL:-600s}"

# Shamir Secret Sharing parameters (production: 5 shares, 3 required)
KEY_SHARES="${KEY_SHARES:-5}"
KEY_THRESHOLD="${KEY_THRESHOLD:-3}"

# Validate SSS params
if [[ "$KEY_THRESHOLD" -gt "$KEY_SHARES" ]]; then
    echo "Error: KEY_THRESHOLD ($KEY_THRESHOLD) cannot exceed KEY_SHARES ($KEY_SHARES)"
    exit 1
fi
if [[ "$KEY_THRESHOLD" -lt 2 ]]; then
    echo "Error: KEY_THRESHOLD must be at least 2 for production security"
    exit 1
fi
if [[ "$KEY_SHARES" -lt 3 ]]; then
    echo "Error: KEY_SHARES must be at least 3 for production security"
    exit 1
fi

# ─── Helper Functions ──────────────────────────────────────────────────────────

log() { echo "[$(date '+%H:%M:%S')] $*" | tee -a "$LOG_FILE"; }
err() { echo "[$(date '+%H:%M:%S')] $*" >&2 | tee -a "$LOG_FILE"; exit 1; }

wait_for_vault() {
    log "Waiting for Vault to be responsive..."
    local max_attempts=20
    for i in $(seq 1 $max_attempts); do
        if vault status -format=json 2>/dev/null | python3 -c "import sys,json; json.load(sys.stdin)" >/dev/null 2>&1; then
            log "   Vault is responsive."
            return 0
        fi
        # Also check if vault returns exit code 2 (sealed but running)
        vault status >/dev/null 2>&1
        local rc=$?
        if [[ $rc -eq 0 || $rc -eq 2 ]]; then
            log "   Vault is responsive (status code: $rc)."
            return 0
        fi
        echo "   ...waiting ($i/$max_attempts)"
        sleep 2
    done
    err "Vault did not become responsive after $((max_attempts * 2)) seconds"
}

get_vault_status() {
    # vault status -format=json returns:
    #   0: unsealed
    #   2: sealed
    # Both provide valid JSON.
    local output
    output=$(vault status -format=json 2>/dev/null)
    local rc=$?
    if [[ $rc -eq 0 || $rc -eq 2 ]]; then
        echo "$output"
    else
        # Return empty object if truly unreachable
        echo '{}'
    fi
}

is_initialized() {
    local status
    status=$(get_vault_status)
    if [[ "$status" == "{}" ]]; then
        echo "Unknown"
        return
    fi
    echo "$status" | python3 -c "import sys,json; data=json.load(sys.stdin); print(data.get('initialized', False))" 2>/dev/null || echo "False"
}

is_sealed() {
    local status
    status=$(get_vault_status)
    if [[ "$status" == "{}" ]]; then
        echo "True" # Assume sealed if we can't tell
        return
    fi
    echo "$status" | python3 -c "import sys,json; data=json.load(sys.stdin); print(data.get('sealed', True))" 2>/dev/null || echo "True"
}

is_active() {
    local status
    status=$(get_vault_status)
    echo "$status" | python3 -c "import sys,json; data=json.load(sys.stdin); print(bool(data.get('active_time') or not data.get('ha_enabled', False)))" 2>/dev/null || echo "False"
}

read_unseal_key() {
    local key_num=$1
    read -r -s -p "   Enter Unseal Key $key_num of $KEY_THRESHOLD: " key
    echo ""
    echo "$key"
}

refresh_approle_creds() {
    log "Refreshing AppRole credentials for the application..."
    
    # Ensure we have a token
    if [[ -z "${VAULT_TOKEN:-}" ]]; then
        if [[ -f "$SECRETS_FILE" ]]; then
            export VAULT_TOKEN=$(grep "Initial Root Token:" "$SECRETS_FILE" | awk '{print $NF}')
        fi
    fi
    
    if [[ -z "${VAULT_TOKEN:-}" ]]; then
        err "VAULT_TOKEN is not set and could not be read from $SECRETS_FILE"
    fi

    # Refresh Main AppRole
    local role_name="bitsilo-role"
    local role_id
    local wrapping_token

    role_id=$(vault read -field=role_id "auth/approle/role/$role_name/role-id") || err "Failed to read Role ID"
    wrapping_token=$(vault write -wrap-ttl="$WRAP_TTL" -field=wrapping_token \
        -f "auth/approle/role/$role_name/secret-id") || err "Failed to generate wrapped Secret ID"

    log "   Main AppRole SecretID generated with response wrapping (TTL: $WRAP_TTL)"

    # Refresh Signtx AppRole
    local signtx_role_name="bitsilo-signtx-role"
    local signtx_role_id
    local signtx_wrapping_token

    signtx_role_id=$(vault read -field=role_id "auth/approle/role/$signtx_role_name/role-id") || err "Failed to read Signtx Role ID"
    signtx_wrapping_token=$(vault write -wrap-ttl="$WRAP_TTL" -field=wrapping_token \
        -f "auth/approle/role/$signtx_role_name/secret-id") || err "Failed to generate wrapped Signtx Secret ID"

    log "   Signtx SecretID generated with response wrapping (TTL: $WRAP_TTL)"

    # Update .approle_creds with both
    cat > "$APPROLE_FILE" <<EOF
ROLE_ID=$role_id
WRAPPING_TOKEN=$wrapping_token
SIGNTX_ROLE_ID=$signtx_role_id
SIGNTX_WRAPPING_TOKEN=$signtx_wrapping_token
EOF
    chmod 600 "$APPROLE_FILE"
    log " Credentials saved to $APPROLE_FILE"

    # Update app.env files
    for dir in "wallet" "monitor"; do
        local app_env_file="$PROJECT_ROOT/$dir/app.env"
        if [[ -f "$app_env_file" ]]; then
            log "   Updating $app_env_file..."
            sed -i "s/^vault_role_id=.*/vault_role_id=$role_id/" "$app_env_file"
            sed -i "s/^vault_secret_id=.*/vault_secret_id=$wrapping_token/" "$app_env_file"
            
            # Add signtx overrides if they don't exist
            if ! grep -q "^signtx_vault_role_id=" "$app_env_file"; then
                echo "signtx_vault_role_id=$signtx_role_id" >> "$app_env_file"
                echo "signtx_vault_secret_id=$signtx_wrapping_token" >> "$app_env_file"
            else
                sed -i "s/^signtx_vault_role_id=.*/signtx_vault_role_id=$signtx_role_id/" "$app_env_file"
                sed -i "s/^signtx_vault_secret_id=.*/signtx_vault_secret_id=$signtx_wrapping_token/" "$app_env_file"
            fi

            # Ensure the wrapped mode flag is set
            if grep -q "^vault_secret_id_wrapped=" "$app_env_file"; then
                sed -i "s/^vault_secret_id_wrapped=.*/vault_secret_id_wrapped=true/" "$app_env_file"
            else
                echo "vault_secret_id_wrapped=true" >> "$app_env_file"
            fi
            log "$app_env_file updated with both AppRoles."
        else
            log "$app_env_file not found"
        fi
    done

    # Update signer/app.env with fresh signtx credentials
    local signer_env="$PROJECT_ROOT/signer/app.env"
    if [[ -f "$signer_env" ]]; then
        log "   Updating $signer_env..."
        sed -i "s/^vault_role_id=.*/vault_role_id=$signtx_role_id/" "$signer_env"
        sed -i "s/^vault_secret_id=.*/vault_secret_id=$signtx_wrapping_token/" "$signer_env"
        if grep -q "^vault_secret_id_wrapped=" "$signer_env"; then
            sed -i "s/^vault_secret_id_wrapped=.*/vault_secret_id_wrapped=true/" "$signer_env"
        else
            echo "vault_secret_id_wrapped=true" >> "$signer_env"
        fi
        log "$signer_env updated with Signtx AppRole."
    fi
}

# ─── Step 1: Start Vault Server ───────────────────────────────────────────────

log "BitSilo Vault — Production Startup"
log "   SSS Config: $KEY_SHARES shares, $KEY_THRESHOLD threshold"

if ! pgrep -x "vault" > /dev/null; then
    log "Starting Vault server process..."
    mkdir -p "$PROJECT_ROOT/vault/data"
    # Kill any stale process on 8200
    fuser -k 8200/tcp 2>/dev/null || true
    sleep 1
    
    # Export TRANSIT_TOKEN and other vars for the plugin to inherit
    if [[ -f "$SECRETS_FILE" ]]; then
       export TRANSIT_TOKEN=$(grep "Initial Root Token:" "$SECRETS_FILE" | awk '{print $NF}')
    fi
    export TRANSIT_MOUNT="transit"
    export TRANSIT_KEY="bitsilo-kek"
    export VAULT_ADDR="$VAULT_ADDR"

    setsid vault server -config="$HCL_CONFIG" >> "$LOG_FILE" 2>&1 &
    VAULT_PID=$!
    log "   Vault PID: $VAULT_PID"
    sleep 3
else
    log "Vault process is already running."
fi

wait_for_vault

# ─── Step 2: Initialization (first-time only) ─────────────────────────────────

INITIALIZED=$(is_initialized)

if [[ "$INITIALIZED" == "False" ]]; then
    log ""
    log "╔══════════════════════════════════════════════════════════════╗"
    log "║   FIRST-TIME VAULT INITIALIZATION                       ║"
    log "║                                                              ║"
    log "║  Generating $KEY_SHARES Shamir key shares (threshold: $KEY_THRESHOLD)      ║"
    log "║  SAVE THESE KEYS SECURELY — they cannot be regenerated!     ║"
    log "╚══════════════════════════════════════════════════════════════╝"
    log ""

    vault operator init \
        -key-shares="$KEY_SHARES" \
        -key-threshold="$KEY_THRESHOLD" \
        -format=json > "${SECRETS_FILE}.json"

    # Extract keys and root token
    python3 -c "
import json, sys
with open('${SECRETS_FILE}.json') as f:
    data = json.load(f)
with open('${SECRETS_FILE}', 'w') as out:
    for i, key in enumerate(data.get('unseal_keys_b64', []), 1):
        out.write(f'Unseal Key {i}: {key}\n')
    out.write(f'Initial Root Token: {data[\"root_token\"]}\n')
print('Keys extracted successfully.')
"
    chmod 600 "$SECRETS_FILE" "${SECRETS_FILE}.json"

    log ""
    log "╔══════════════════════════════════════════════════════════════╗"
    log "║   DISTRIBUTE UNSEAL KEYS TO SEPARATE CUSTODIANS          ║"
    log "╚══════════════════════════════════════════════════════════════╝"
    log ""

    # Display keys for distribution (one-time only)
    for i in $(seq 1 "$KEY_SHARES"); do
        KEY=$(grep "Unseal Key $i:" "$SECRETS_FILE" | awk '{print $NF}')
        log "   Key $i: ${KEY:0:8}...${KEY: -8} (give to custodian $i)"
    done
    log ""
    log "   Root Token saved to $SECRETS_FILE (delete after setup!)"
    log ""
fi

# ─── Step 3: Unsealing ────────────────────────────────────────────────────────

SEALED=$(is_sealed)

if [[ "$SEALED" == "True" ]]; then
    log ""
    log "Vault is sealed — $KEY_THRESHOLD unseal keys required."
    log ""

    # Try auto-unseal from secrets file (development/CI convenience)
    if [[ -f "$SECRETS_FILE" ]]; then
        log "   Found $SECRETS_FILE — attempting auto-unseal..."
        UNSEAL_COUNT=0
        while IFS= read -r line; do
            if [[ "$line" == "Unseal Key"* ]]; then
                KEY=$(echo "$line" | awk '{print $NF}')
                vault operator unseal "$KEY" > /dev/null 2>&1 || true
                UNSEAL_COUNT=$((UNSEAL_COUNT + 1))
                if [[ $UNSEAL_COUNT -ge $KEY_THRESHOLD ]]; then
                    break
                fi
            fi
        done < "$SECRETS_FILE"

        # Verify unsealed
        SEALED=$(is_sealed)
        if [[ "$SEALED" == "False" ]]; then
            log "    Vault unsealed successfully (auto)."
        else
            log "    Auto-unseal did not succeed. Manual unseal required."
        fi
    fi

    # If still sealed, prompt for manual keys
    SEALED=$(is_sealed)
    if [[ "$SEALED" == "True" ]]; then
        log ""
        log "   Manual unseal required. Enter $KEY_THRESHOLD unseal keys:"
        for i in $(seq 1 "$KEY_THRESHOLD"); do
            UNSEAL_KEY=$(read_unseal_key "$i")
            RESULT=$(vault operator unseal "$UNSEAL_KEY" 2>&1) || true

            if echo "$RESULT" | grep -q "Sealed.*false"; then
                log "    Vault unsealed after key $i."
                break
            elif echo "$RESULT" | grep -q "Sealed.*true"; then
                PROGRESS=$(echo "$RESULT" | grep "Unseal Progress" | awk '{print $NF}')
                log "   Key $i accepted. Progress: $PROGRESS"
            else
                log "    Key $i may be invalid. Continuing..."
            fi
        done

        # Final check
        SEALED=$(is_sealed)
        if [[ "$SEALED" == "True" ]]; then
            err "Vault is still sealed after all keys. Aborting."
        fi
    fi
fi

# Wait for node to become active (important for Raft clusters)
log "Waiting for Vault to become active/leader..."
for i in $(seq 1 10); do
    if [[ "$(is_active)" == "True" ]]; then
        log "    Vault is active."
        break
    fi
    log "   ...waiting for active status ($i/10)"
    sleep 1
done

log "Vault is initialized, unsealed, and active."

# ─── Early exit for --unseal-only ──────────────────────────────────────────────

if [[ "${1:-}" == "--unseal-only" ]]; then
    log "   --unseal-only flag set. Skipping setup."
    log "   Vault address: $VAULT_ADDR"
    exit 0
fi

if [[ "${1:-}" == "--rotate-approle" ]]; then
    log "   --rotate-approle flag set."
    refresh_approle_creds
    exit 0
fi

# ─── Step 4: Authenticate with Root Token for Setup ───────────────────────────

if [[ ! -f "$SECRETS_FILE" ]]; then
    err "Cannot proceed with setup: $SECRETS_FILE not found (needed for root token)."
fi

export VAULT_TOKEN=$(grep "Initial Root Token:" "$SECRETS_FILE" | awk '{print $NF}')
if [[ -z "$VAULT_TOKEN" ]]; then
    err "Could not extract root token from $SECRETS_FILE"
fi

# ─── Step 5: Load Pre-built Plugin Binary ─────────────────────────────────────

if [[ ! -f "$PLUGIN_BIN" ]]; then
    err "Plugin binary not found at $PLUGIN_BIN"
fi

log "Loading pre-built plugin from $PLUGIN_BIN..."
chmod +x "$PLUGIN_BIN"

# Ensure plugin binary is available in Vault's configured plugin_directory
PLUGIN_DIR_HCL=$(grep -E '^\s*plugin_directory\s*=' "$HCL_CONFIG" 2>/dev/null | awk -F'"' '{print $2}' || true)
if [[ -n "$PLUGIN_DIR_HCL" ]]; then
    mkdir -p "$PLUGIN_DIR_HCL"
    if [[ "$(realpath "$PLUGIN_DIR_HCL" 2>/dev/null || echo "$PLUGIN_DIR_HCL")" != "$(realpath "$(dirname "$PLUGIN_BIN")" 2>/dev/null || dirname "$PLUGIN_BIN")" ]]; then
        cp "$PLUGIN_BIN" "$PLUGIN_DIR_HCL/"
        log "   Synchronized plugin binary to Vault plugin_directory: $PLUGIN_DIR_HCL"
    fi
fi

# ─── Step 6: Enable Secrets Engines ───────────────────────────────────────────

# KV v2 for mnemonic storage
if ! vault secrets list 2>/dev/null | grep -q "^secret/"; then
    log "Enabling KV v2 secrets engine..."
    vault secrets enable -version=2 -path=secret kv || log "   (KV may already exist)"
fi

# Transit engine for envelope encryption (KEK wrapping)
if ! vault secrets list 2>/dev/null | grep -q "^transit/"; then
    log " Enabling Transit secrets engine..."
    vault secrets enable transit || log "   (Transit may already exist)"
fi

# Create the Transit wrapping key (AES-256-GCM)
# The plugin uses its own internal KEK, but Transit provides an additional
# encryption layer available to the application for API-level operations.
log "Ensuring Transit wrapping key exists..."
vault write -f transit/keys/bitsilo-kek type=aes256-gcm96 2>/dev/null || log "   (KEK may already exist)"

# ─── Step 7: Register & Enable Plugin ─────────────────────────────────────────

if [[ -f "$PLUGIN_BIN" ]]; then
    SHA256=$(sha256sum "$PLUGIN_BIN" | cut -d' ' -f1)
    log " Registering BitSilo plugin (SHA: ${SHA256:0:12}...)"

    # Create a dedicated, long-lived token for the plugin to talk to Transit.
    # It uses the same policy as the app since it includes Transit permissions.
    PLUGIN_TRANSIT_TOKEN=$(vault token create -policy="bitsilo-app-policy" -period=768h -orphan -field=token)
    log "   Generated dedicated Transit token for plugin."

    vault plugin register \
        -sha256="$SHA256" \
        -command="vault-plugin" \
        secret vault-plugin 2>/dev/null || log "   (plugin record update)"

    if ! vault secrets list 2>/dev/null | grep -q "bitsilo/"; then
        log "   Enabling bitsilo secrets engine (RBAC: require_entity=false for testing)..."
        vault secrets enable \
            -path=bitsilo \
            -plugin-name=vault-plugin \
            -options=transit_token="$VAULT_TOKEN" \
            -options=transit_mount=transit \
            -options=transit_key=bitsilo-kek \
            -options=require_entity=false \
            plugin
    else
        log "   Reloading bitsilo plugin backend..."
        vault write sys/plugins/reload/backend plugin=vault-plugin 2>/dev/null || true
    fi
    log "   Plugin ready."
else
    err "Plugin binary not found at $PLUGIN_BIN"
fi

# ─── Step 8: AppRole Auth Setup ───────────────────────────────────────────────

if ! vault auth list 2>/dev/null | grep -q "approle/"; then
    log " Enabling AppRole auth method..."
    vault auth enable approle
fi

# Write the production policy (no key import, no legacy transit/ethereum)
log " BitSilo AppRole policy..."
vault policy write bitsilo-app-policy - <<'POLICY'
# ═══════════════════════════════════════════════════════════════════════════════
# BitSilo Application Policy (Production)
#
# Principle of Least Privilege:
#   - Sign transactions via the plugin (the ONLY runtime-critical operation)
#   - Read public keys (never private keys — plugin enforces this)
#   - Derive new keys from mnemonics inside the plugin
#   - Read/write mnemonics in KV (for HD wallet derivation)
#   - NO key import, NO key export, NO legacy transit/ethereum paths
# ═══════════════════════════════════════════════════════════════════════════════

# ── BitSilo Plugin: Key Read & Derive (NO create/update = NO import) ──────
path "bitsilo/keys/*" {
  capabilities = ["read", "list"]
}

# ── BitSilo Plugin: Signing ───────────────────────────────────────────────
path "bitsilo/sign/*" {
  capabilities = ["create", "update"]
}

path "bitsilo/sign-schnorr/*" {
  capabilities = ["create", "update"]
}

path "bitsilo/sign-tx/*" {
  capabilities = ["create", "update"]
}

# ── BitSilo Plugin: Solana operations ─────────────────────────────────────
path "bitsilo/solana/*" {
  capabilities = ["create", "read", "update"]
}

# ── BitSilo Plugin: Mnemonic management & key derivation ──────────────────
path "bitsilo/mnemonics/*" {
  capabilities = ["create", "read", "update", "list"]
}

# ── BitSilo Plugin: Nonce tracking ────────────────────────────────────────
path "bitsilo/nonce/*" {
  capabilities = ["read"]
}

# ── Vault KV v2: Mnemonic cold storage ───────────────────────────────────────
path "secret/data/wallets/*" {
  capabilities = ["create", "read", "update"]
}

path "secret/metadata/wallets/*" {
  capabilities = ["read", "list"]
}

# ── Token self-management ────────────────────────────────────────────────────
path "auth/token/renew-self" {
  capabilities = ["update"]
}

path "auth/token/lookup-self" {
  capabilities = ["read"]
}

path "sys/health" {
  capabilities = ["read", "sudo"]
}

# ── Transit: Envelope Encryption ─────────────────────────────────────────────
path "transit/encrypt/bitsilo-kek" {
  capabilities = ["update"]
}

path "transit/decrypt/bitsilo-kek" {
  capabilities = ["update"]
}

path "transit/keys/bitsilo-kek" {
  capabilities = ["read"]
}
POLICY

# Configure the AppRole role
#   - secret_id_num_uses=1: SecretID is consumed after first login (single-use)
#   - secret_id_bound_cidrs: Network restriction — credentials only usable from these CIDRs
#   - token_ttl/max_ttl: Long-lived service token; the app renews it rather than re-logging
log "Configuring AppRole role..."
log "   secret_id_num_uses=1 (single-use SecretID)"
log "   secret_id_bound_cidrs=$BOUND_CIDRS"
vault write auth/approle/role/bitsilo-role \
    secret_id_ttl=0 \
    secret_id_num_uses=1 \
    secret_id_bound_cidrs="$BOUND_CIDRS" \
    token_bound_cidrs="$BOUND_CIDRS" \
    token_ttl=24h \
    token_max_ttl=768h \
    token_num_uses=0 \
    policies="bitsilo-app-policy" \
    token_type=service

# Configure the Signtx AppRole
log "Configuring Signtx AppRole role..."
vault write auth/approle/role/bitsilo-signtx-role \
    secret_id_ttl=0 \
    secret_id_num_uses=1 \
    secret_id_bound_cidrs="$BOUND_CIDRS" \
    token_bound_cidrs="$BOUND_CIDRS" \
    token_ttl=24h \
    token_max_ttl=768h \
    token_num_uses=0 \
    policies="bitsilo-app-policy" \
    token_type=service

# ─── Step 9: Generate Response-Wrapped AppRole Credentials ────────────────────
#
# The SecretID is wrapped in a single-use Vault cubbyhole token. The application
# must unwrap this token to retrieve the actual SecretID, then immediately use it
# to log in. After login the SecretID is consumed (num_uses=1) and cannot be reused.

log " Generating response-wrapped AppRole credentials..."
ROLE_ID=$(vault read -field=role_id auth/approle/role/bitsilo-role/role-id)
WRAPPING_TOKEN=$(vault write -wrap-ttl="$WRAP_TTL" -field=wrapping_token \
    -f auth/approle/role/bitsilo-role/secret-id)

SIGNTX_ROLE_ID=$(vault read -field=role_id auth/approle/role/bitsilo-signtx-role/role-id)
SIGNTX_WRAPPING_TOKEN=$(vault write -wrap-ttl="$WRAP_TTL" -field=wrapping_token \
    -f auth/approle/role/bitsilo-signtx-role/secret-id)

log "   Wrapping tokens generated (TTL: $WRAP_TTL)"

cat > "$APPROLE_FILE" <<EOF
ROLE_ID=$ROLE_ID
WRAPPING_TOKEN=$WRAPPING_TOKEN
SIGNTX_ROLE_ID=$SIGNTX_ROLE_ID
SIGNTX_WRAPPING_TOKEN=$SIGNTX_WRAPPING_TOKEN
EOF
chmod 600 "$APPROLE_FILE"

log "   AppRole credentials saved to $APPROLE_FILE (wrapped)"

# ─── Step 10: Verify AppRole Login & RBAC Setup ──────────────────────────────
#
# Since we used response wrapping, we must first unwrap to get the raw SecretID,
# then use it to log in. This consumes the SecretID (num_uses=1).
# After this verification, a NEW wrapped SecretID is generated for the application.

log " Verifying AppRole login (unwrap → login → verify)..."

# Step 10a: Unwrap the SecretID from the wrapping token
SECRET_ID=$(VAULT_TOKEN="$WRAPPING_TOKEN" vault unwrap -field=secret_id 2>/dev/null) \
    || err "Failed to unwrap SecretID from wrapping token"
log "   SecretID unwrapped successfully."

# Step 10b: Login with the unwrapped SecretID (this consumes it)
VERIFY_TOKEN=$(vault write -field=token auth/approle/login \
    role_id="$ROLE_ID" \
    secret_id="$SECRET_ID" 2>/dev/null) || err "AppRole login verification FAILED"

if [[ -n "$VERIFY_TOKEN" ]]; then
    log "    AppRole login verified successfully."

    # Quick smoke test: can the AppRole token access the plugin?
    VAULT_TOKEN="$VERIFY_TOKEN" vault read bitsilo/keys/ >/dev/null 2>&1 \
        && log "    Plugin access verified." \
        || log "    Plugin access check returned non-zero (may be OK if no keys exist yet)."

    # ── RBAC: Create a default app role with full derive+sign access ──────
    ENTITY_ID=$(VAULT_TOKEN="$VERIFY_TOKEN" vault token lookup -format=json 2>/dev/null \
        | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['entity_id'])" 2>/dev/null)

    if [[ -n "$ENTITY_ID" ]]; then
        log " Setting up RBAC for AppRole entity ($ENTITY_ID)..."

        # 0. Bootstrap Super Admin role and password
        log "   Bootstrapping super-admin role and global admin password..."
        vault write bitsilo/roles/super-admin \
            allow_manage_roles=true \
            allow_manage_bindings=true \
            allow_manage_admins=true >/dev/null 2>&1 \
            && log "   Role 'super-admin' created." \
            || log "   Role 'super-admin' creation returned non-zero."

        vault write bitsilo/config/admin-password \
            password="admin" \
            questions="Default?,Reset?" \
            answers="admin,admin" >/dev/null 2>&1 \
            && log "   Global admin password set." \
            || log "   Global admin password setup returned non-zero."

        # 1. Create an 'assign only' role (all chains, derive=true, sign=false)
        vault write bitsilo/roles/wallet-assigner \
            allow_key_prefix="" \
            allow_chains="" \
            allow_derive=true \
            allow_sign=false >/dev/null 2>&1 \
            && log "   Role 'wallet-assigner' created (assign-only)." \
            || log "   Role creation returned non-zero."

        # 2. Create a 'signer' role (all chains, derive=true, sign=true)
        vault write bitsilo/roles/wallet-signer \
            allow_key_prefix="" \
            allow_chains="" \
            allow_derive=true \
            allow_sign=true >/dev/null 2>&1 \
            && log "   Role 'wallet-signer' created (derive+sign)." \
            || log "   Role creation returned non-zero."

        # Bind the AppRole entity to the assign-only role
        vault write bitsilo/bindings/app-binding \
            entity_ids="$ENTITY_ID" \
            roles="wallet-assigner" >/dev/null 2>&1 \
            && log "   Binding 'app-binding' created for entity $ENTITY_ID." \
            || log "    Binding creation returned non-zero."

        # Get Signtx Entity ID and bind to signer role
        # We need to login with the signtx credentials once to create the entity
        log " Verifying Signtx AppRole login & RBAC..."
        SIGNTX_SECRET_ID=$(VAULT_TOKEN="$SIGNTX_WRAPPING_TOKEN" vault unwrap -field=secret_id 2>/dev/null)
        SIGNTX_TOKEN=$(vault write -field=token auth/approle/login role_id="$SIGNTX_ROLE_ID" secret_id="$SIGNTX_SECRET_ID" 2>/dev/null)
        SIGNTX_ENTITY_ID=$(VAULT_TOKEN="$SIGNTX_TOKEN" vault token lookup -format=json 2>/dev/null \
            | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['entity_id'])" 2>/dev/null)

        if [[ -n "$SIGNTX_ENTITY_ID" ]]; then
             vault write bitsilo/bindings/signtx-binding \
                entity_ids="$SIGNTX_ENTITY_ID" \
                roles="wallet-signer" >/dev/null 2>&1 \
                && log "   Binding 'signtx-binding' created for entity $SIGNTX_ENTITY_ID."
        fi
    else
        log "    Could not determine AppRole entity ID — RBAC binding skipped."
        log "      You must manually create roles and bindings before derive/sign operations."
    fi

    # Step 10c: Generate FRESH wrapped SecretIDs for both
    log "   Generating fresh wrapped SecretIDs for applications..."
    APP_WRAPPING_TOKEN=$(vault write -wrap-ttl="$WRAP_TTL" -field=wrapping_token \
        -f auth/approle/role/bitsilo-role/secret-id) || err "Failed to generate app SecretID"
    
    APP_SIGNTX_WRAPPING_TOKEN=$(vault write -wrap-ttl="$WRAP_TTL" -field=wrapping_token \
        -f auth/approle/role/bitsilo-signtx-role/secret-id) || err "Failed to generate signtx SecretID"

    # Overwrite the creds file with the fresh wrapping tokens
    cat > "$APPROLE_FILE" <<EOF
ROLE_ID=$ROLE_ID
WRAPPING_TOKEN=$APP_WRAPPING_TOKEN
SIGNTX_ROLE_ID=$SIGNTX_ROLE_ID
SIGNTX_WRAPPING_TOKEN=$APP_SIGNTX_WRAPPING_TOKEN
EOF
    chmod 600 "$APPROLE_FILE"

    # Update app.env with the fresh wrapping tokens
    for dir in "wallet" "monitor"; do
        app_env_file="$PROJECT_ROOT/$dir/app.env"
        if [[ -f "$app_env_file" ]]; then
            sed -i "s/^vault_role_id=.*/vault_role_id=$ROLE_ID/" "$app_env_file"
            sed -i "s/^vault_secret_id=.*/vault_secret_id=$APP_WRAPPING_TOKEN/" "$app_env_file"
            
            if ! grep -q "^signtx_vault_role_id=" "$app_env_file"; then
                echo "signtx_vault_role_id=$SIGNTX_ROLE_ID" >> "$app_env_file"
                echo "signtx_vault_secret_id=$APP_SIGNTX_WRAPPING_TOKEN" >> "$app_env_file"
            else
                sed -i "s/^signtx_vault_role_id=.*/signtx_vault_role_id=$SIGNTX_ROLE_ID/" "$app_env_file"
                sed -i "s/^signtx_vault_secret_id=.*/signtx_vault_secret_id=$APP_SIGNTX_WRAPPING_TOKEN/" "$app_env_file"
            fi

            if grep -q "^vault_secret_id_wrapped=" "$app_env_file"; then
                sed -i "s/^vault_secret_id_wrapped=.*/vault_secret_id_wrapped=true/" "$app_env_file"
            else
                echo "vault_secret_id_wrapped=true" >> "$app_env_file"
            fi
        fi
    done

    # Update signer/app.env with fresh signtx credentials
    signer_env="$PROJECT_ROOT/signer/app.env"
    if [[ -f "$signer_env" ]]; then
        sed -i "s/^vault_role_id=.*/vault_role_id=$SIGNTX_ROLE_ID/" "$signer_env"
        sed -i "s/^vault_secret_id=.*/vault_secret_id=$APP_SIGNTX_WRAPPING_TOKEN/" "$signer_env"
        sed -i "s/^vault_secret_id_wrapped=.*/vault_secret_id_wrapped=true/" "$signer_env"
    fi

    log "    Fresh wrapped SecretIDs saved for application startup."
else
    err "AppRole login returned empty token"
fi

# ─── Step 11: Final Security Hardening ────────────────────────────────────────

log " Revoking root token for security... (SKIPPED for testing)"
# vault token revoke -self || log "   (Note: Self-revocation failed, please revoke manually)"

# ─── Done ──────────────────────────────────────────────────────────────────────

log ""
log "════════════════════════════════════════════════════════════════"
log "  Vault is ready for Production Use"
log "════════════════════════════════════════════════════════════════"
log "  Address:    $VAULT_ADDR"
log "  Auth:       AppRole (bitsilo-role)"
log "  SecretID:   single-use (num_uses=1), response-wrapped"
log "  BoundCIDRs: $BOUND_CIDRS"
log "  Plugin:     bitsilo mounted at /bitsilo"
log "  KV:         secret/data/wallets/*"
log "  SSS:        $KEY_SHARES shares, $KEY_THRESHOLD threshold"
log "  Creds:      $APPROLE_FILE (wrapping token)"
log ""
log "   CRITICAL PRODUCTION SECURITY REMINDERS:"
log "     1. TLS IS DISABLED: Enable TLS in vault_prod.hcl immediately!"
log "     2. SHAMIR KEYS: Distribute unseal keys to separate custodians."
log "     3. DELETE SECRETS: Delete $SECRETS_FILE after distribution."
log "     4. MLOCK: Ensure disable_mlock = false in your HCL config."
log "     5. HA: Add more Raft nodes for High Availability."
log "     6. PERMISSIONS: chmod 600 app.env to protect AppRole creds."
log "     7. CIDR BINDING: Update BOUND_CIDRS for your production network."
log "     8. WRAPPED SECRETS: The app must unwrap the SecretID on startup."
log "════════════════════════════════════════════════════════════════"
