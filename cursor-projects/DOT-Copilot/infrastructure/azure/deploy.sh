#!/bin/bash
#
# DOT Copilot - Azure Infrastructure Deployment Script
#
# Usage:
#   ./deploy.sh [environment] [resource-group] [location]
#
# Examples:
#   ./deploy.sh dev
#   ./deploy.sh prod rg-dot-copilot-prod eastus
#

set -e

# =============================================================================
# Configuration
# =============================================================================

ENVIRONMENT="${1:-dev}"
APP_NAME="dot-copilot"
RESOURCE_GROUP="${2:-rg-${APP_NAME}-${ENVIRONMENT}}"
LOCATION="${3:-eastus}"
DB_ADMIN_USERNAME="dotcopilotadmin"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# =============================================================================
# Helper Functions
# =============================================================================

header() {
    echo -e "\n${CYAN}========================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}========================================${NC}\n"
}

step() {
    echo -e "${YELLOW}[*] $1${NC}"
}

success() {
    echo -e "${GREEN}[+] $1${NC}"
}

error() {
    echo -e "${RED}[-] $1${NC}"
    exit 1
}

generate_password() {
    openssl rand -base64 24 | tr -dc 'a-zA-Z0-9!@#$%^&*' | head -c 24
}

generate_jwt_secret() {
    openssl rand -base64 48 | tr -dc 'a-zA-Z0-9' | head -c 64
}

# =============================================================================
# Validation
# =============================================================================

validate_prerequisites() {
    header "Validating Prerequisites"
    
    # Check Azure CLI
    step "Checking Azure CLI..."
    if ! command -v az &> /dev/null; then
        error "Azure CLI is not installed. Install from: https://docs.microsoft.com/cli/azure/install-azure-cli"
    fi
    AZ_VERSION=$(az version --query '"azure-cli"' -o tsv)
    success "Azure CLI v${AZ_VERSION} installed"
    
    # Check Bicep
    step "Checking Bicep CLI..."
    if ! az bicep version &> /dev/null; then
        step "Installing Bicep CLI..."
        az bicep install
    fi
    success "Bicep CLI installed"
    
    # Check Azure login
    step "Checking Azure login status..."
    if ! az account show &> /dev/null; then
        error "Not logged in to Azure. Run 'az login' first."
    fi
    ACCOUNT_NAME=$(az account show --query 'name' -o tsv)
    USER_NAME=$(az account show --query 'user.name' -o tsv)
    success "Logged in as: ${USER_NAME}"
    success "Subscription: ${ACCOUNT_NAME}"
    
    # Check Node.js
    step "Checking Node.js..."
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
    fi
    NODE_VERSION=$(node --version)
    success "Node.js ${NODE_VERSION} installed"
    
    # Check openssl
    step "Checking OpenSSL..."
    if ! command -v openssl &> /dev/null; then
        error "OpenSSL is not installed (required for secret generation)"
    fi
    success "OpenSSL installed"
    
    success "All prerequisites satisfied!"
}

# =============================================================================
# Main Deployment
# =============================================================================

header "DOT Copilot Azure Deployment"
echo "Environment:     ${ENVIRONMENT}"
echo "Resource Group:  ${RESOURCE_GROUP}"
echo "Location:        ${LOCATION}"

# Validate environment
if [[ ! "${ENVIRONMENT}" =~ ^(dev|staging|prod)$ ]]; then
    error "Invalid environment. Must be: dev, staging, or prod"
fi

# Validate prerequisites
validate_prerequisites

# Generate secrets
header "Generating Secrets"

DB_PASSWORD=$(generate_password)
JWT_SECRET=$(generate_jwt_secret)
JWT_REFRESH_SECRET=$(generate_jwt_secret)

success "Database password generated"
success "JWT secrets generated"

# Save secrets to local file
SECRETS_FILE=".azure-secrets-${ENVIRONMENT}.json"
cat > "${SECRETS_FILE}" << EOF
{
  "environment": "${ENVIRONMENT}",
  "dbAdminUsername": "${DB_ADMIN_USERNAME}",
  "dbAdminPassword": "${DB_PASSWORD}",
  "jwtSecret": "${JWT_SECRET}",
  "jwtRefreshSecret": "${JWT_REFRESH_SECRET}",
  "generatedAt": "$(date '+%Y-%m-%d %H:%M:%S')"
}
EOF
chmod 600 "${SECRETS_FILE}"
success "Secrets saved to ${SECRETS_FILE} (keep this secure!)"

# Create resource group
header "Creating Resource Group"
step "Creating resource group: ${RESOURCE_GROUP}..."

az group create \
    --name "${RESOURCE_GROUP}" \
    --location "${LOCATION}" \
    --output none

success "Resource group created"

# Deploy Bicep template
header "Deploying Infrastructure"
step "This may take 5-10 minutes..."

DEPLOYMENT_NAME="dot-copilot-${ENVIRONMENT}-$(date '+%Y%m%d%H%M%S')"

DEPLOYMENT_OUTPUT=$(az deployment group create \
    --resource-group "${RESOURCE_GROUP}" \
    --name "${DEPLOYMENT_NAME}" \
    --template-file "main.bicep" \
    --parameters \
        environment="${ENVIRONMENT}" \
        appName="${APP_NAME}" \
        location="${LOCATION}" \
        dbAdminUsername="${DB_ADMIN_USERNAME}" \
        dbAdminPassword="${DB_PASSWORD}" \
        jwtSecret="${JWT_SECRET}" \
        jwtRefreshSecret="${JWT_REFRESH_SECRET}" \
    --output json)

if [ $? -ne 0 ]; then
    error "Deployment failed!"
fi

success "Infrastructure deployed successfully!"

# Get outputs
header "Deployment Outputs"

BACKEND_URL=$(echo "${DEPLOYMENT_OUTPUT}" | jq -r '.properties.outputs.backendUrl.value')
FRONTEND_URL=$(echo "${DEPLOYMENT_OUTPUT}" | jq -r '.properties.outputs.frontendUrl.value')
DB_SERVER=$(echo "${DEPLOYMENT_OUTPUT}" | jq -r '.properties.outputs.databaseServer.value')
STORAGE_ACCOUNT=$(echo "${DEPLOYMENT_OUTPUT}" | jq -r '.properties.outputs.storageAccountName.value')
KEY_VAULT=$(echo "${DEPLOYMENT_OUTPUT}" | jq -r '.properties.outputs.keyVaultName.value')
APP_INSIGHTS=$(echo "${DEPLOYMENT_OUTPUT}" | jq -r '.properties.outputs.appInsightsName.value')
STAGING_URL=$(echo "${DEPLOYMENT_OUTPUT}" | jq -r '.properties.outputs.stagingBackendUrl.value // empty')
ESTIMATED_COST=$(echo "${DEPLOYMENT_OUTPUT}" | jq -r '.properties.outputs.estimatedMonthlyCost.value')

echo "Backend URL:      ${BACKEND_URL}"
echo "Frontend URL:     ${FRONTEND_URL}"
echo "Database Server:  ${DB_SERVER}"
echo "Storage Account:  ${STORAGE_ACCOUNT}"
echo "Key Vault:        ${KEY_VAULT}"
echo "App Insights:     ${APP_INSIGHTS}"
if [ -n "${STAGING_URL}" ]; then
    echo "Staging URL:      ${STAGING_URL}"
fi
echo ""
echo -e "${YELLOW}Estimated Cost:   ${ESTIMATED_COST}${NC}"

# Next steps
header "Next Steps"

cat << EOF
1. Configure GitHub Secrets:
   - AZURE_CREDENTIALS: Service principal credentials
   - AZURE_STATIC_WEB_APPS_API_TOKEN: Static Web App token
   - DATABASE_URL: postgresql://${DB_ADMIN_USERNAME}:***@${DB_SERVER}:5432/dot_copilot?sslmode=require
   - BACKEND_URL: ${BACKEND_URL}
   - FRONTEND_URL: ${FRONTEND_URL}

2. Run database migrations:
   cd backend
   DATABASE_URL="postgresql://${DB_ADMIN_USERNAME}:${DB_PASSWORD}@${DB_SERVER}:5432/dot_copilot?sslmode=require" npx prisma migrate deploy

3. Deploy application code:
   - Push to GitHub to trigger CI/CD
   - Or deploy manually using Azure CLI

4. Verify deployment:
   - Backend health: ${BACKEND_URL}/health
   - Frontend: ${FRONTEND_URL}

5. Optional: Configure custom domain
   az webapp config hostname add --webapp-name dot-copilot-backend-${ENVIRONMENT} ...

EOF

success "Deployment complete!"
