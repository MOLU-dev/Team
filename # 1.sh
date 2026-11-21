# 1. Generate a 120s TTL wrapped SecretID
WRAPPING_TOKEN=$(vault write -wrap-ttl=120s -field=wrapping_token \
    -f auth/approle/role/bitsilo-role/secret-id)

# 2. Pass it directly as environment variables
docker run -d \
  -e VAULT_ADDRESS="http://vault:8200" \
  -e VAULT_ROLE_ID="f43b30a4-beb5-b9ee-909b-2eaa1f5fb1d9" \
  -e VAULT_SECRET_ID="$WRAPPING_TOKEN" \
  -e VAULT_SECRET_ID_WRAPPED=true \
  -p 8080:8080 bitsilo-app