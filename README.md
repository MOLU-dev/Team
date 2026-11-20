# Team

## Prerequisites & Dependencies

To run the project and its local services (such as the production-mode HashiCorp Vault server and plugin), you need:

- **HashiCorp Vault** (CLI & Server)
- **Python 3** (used by startup and unseal scripts)
- Standard Unix utilities (`curl`, `gpg`, `sha256sum`, `jq`)

---

## Installing HashiCorp Vault on a New Machine

Choose the installation method corresponding to your operating system:

### 1. Ubuntu / Debian

```bash
# 1. Install prerequisites
sudo apt-get update && sudo apt-get install -y wget gpg coreutils

# 2. Download HashiCorp GPG key
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg

# 3. Add the official HashiCorp repository
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list

# 4. Update and install Vault
sudo apt-get update && sudo apt-get install -y vault
```

---

### 2. Fedora / RHEL / CentOS / Amazon Linux

```bash
# 1. Install yum-utils or dnf-plugins-core
sudo dnf install -y dnf-plugins-core

# 2. Add HashiCorp repository
sudo dnf config-manager --add-repo https://rpm.releases.hashicorp.com/fedora/hashicorp.repo

# 3. Install Vault
sudo dnf install -y vault
```

---

### 3. macOS (Homebrew)

```bash
# 1. Tap HashiCorp repository
brew tap hashicorp/tap

# 2. Install Vault
brew install hashicorp/tap/vault
```

---

### 4. Manual Binary Installation (Any Linux Distribution)

If you do not want to use a package manager or need a specific release:

```bash
# Set desired version and architecture (e.g., amd64 or arm64)
VAULT_VERSION="1.18.2"
ARCH="amd64" # or "arm64"

# Download archive
curl -fsSLO "https://releases.hashicorp.com/vault/${VAULT_VERSION}/vault_${VAULT_VERSION}_linux_${ARCH}.zip"

# Unzip and move to PATH
unzip "vault_${VAULT_VERSION}_linux_${ARCH}.zip"
sudo mv vault /usr/local/bin/
rm "vault_${VAULT_VERSION}_linux_${ARCH}.zip"
```

---

### 5. Verify Installation

Check that Vault is installed and available in your `PATH`:

```bash
vault --version
```

---

## Running Vault with This Repository

1. **Clone the repository** (if not already done):
   ```bash
   git clone github.com:MOLU-dev/Team.git
   cd team
   ```

2. **Verify Plugin Binary**:
   Ensure the pre-built plugin executable exists in `bin/` and is executable:
   ```bash
   chmod +x bin/vault-plugin
   ```

3. **Start and Initialize Vault**:
   The provided script initializes Vault, configures Shamir Secret Sharing (SSS), mounts secrets engines, and registers the pre-built plugin from `bin/vault-plugin`:
   ```bash
   chmod +x script/vault_prod.sh
   ./script/vault_prod.sh
   ```

   > [!IMPORTANT]
   > The startup script generates `.vault_secrets` containing the Shamir unseal keys and the initial root token. Keep this file secure and never commit it to source control.

---

## Starting the Frontend

The web dashboard is built with **Next.js 16**, **React 19**, and **Tailwind CSS**.

### 1. Prerequisites
- **Node.js**: v20 or higher (v22 LTS recommended)
- **Yarn**: v4 (Berry) or npm / pnpm

### 2. Configure Environment Variables
From the repository root, enter the `frontend` folder and create your local environment file:

```bash
cd frontend
cp .env.local.example .env.local
```

If your backend API runs on a custom host or port, adjust `NEXT_PUBLIC_API_URL` inside `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

### 3. Install Dependencies
```bash
yarn install
# or if using npm:
# npm install
```

### 4. Start the Development Server
```bash
yarn dev
# or with Turbopack:
# yarn dev:turbo
```

The application will start on `http://localhost:3000` (or `http://0.0.0.0:3000`).

### 5. Production Build (Optional)
To test or deploy a production build:

```bash
yarn build
yarn start
```

