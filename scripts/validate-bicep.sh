#!/bin/bash
# =============================================================================
# Bicep Infrastructure Validation Script
# =============================================================================
# Validates Azure Bicep infrastructure files
# Usage: ./validate-bicep.sh [environment]
# =============================================================================

set -e

# Configuration
ENVIRONMENT="${1:-dev}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BICEP_DIR="$PROJECT_ROOT/cursor-projects/DOT-Copilot/infrastructure/azure"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Header
echo ""
echo "========================================="
echo "Bicep Infrastructure Validation"
echo "Environment: $ENVIRONMENT"
echo "========================================="
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    log_error "Azure CLI is not installed"
    echo "Install: curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash"
    exit 1
fi

log_success "Azure CLI is installed"

# Check if authenticated
if ! az account show &> /dev/null; then
    log_error "Not authenticated with Azure"
    echo "Run: az login"
    exit 1
fi

log_success "Authenticated with Azure"

# Check if Bicep is installed
if ! az bicep version &> /dev/null; then
    log_warning "Bicep not installed, installing..."
    az bicep install
fi

BICEP_VERSION=$(az bicep version | grep -oP '\d+\.\d+\.\d+')
log_success "Bicep version: $BICEP_VERSION"

echo ""

# =============================================================================
# 1. File Validation
# =============================================================================
log_info "Checking Bicep files..."

if [ ! -f "$BICEP_DIR/main.bicep" ]; then
    log_error "main.bicep not found"
    exit 1
fi

log_success "main.bicep exists"

# Check parameter files
PARAM_FILE="$BICEP_DIR/parameters.${ENVIRONMENT}.json"
if [ ! -f "$PARAM_FILE" ]; then
    log_error "Parameter file not found: parameters.${ENVIRONMENT}.json"
    exit 1
fi

log_success "Parameter file exists: parameters.${ENVIRONMENT}.json"

echo ""

# =============================================================================
# 2. Bicep Linting
# =============================================================================
log_info "Running Bicep linter..."

cd "$BICEP_DIR"

if az bicep lint --file main.bicep 2>&1 | grep -q "Error"; then
    log_error "Bicep linting failed"
    az bicep lint --file main.bicep
    exit 1
else
    log_success "Bicep linting passed"
fi

echo ""

# =============================================================================
# 3. Bicep Build
# =============================================================================
log_info "Building Bicep template..."

if az bicep build --file main.bicep --outfile main.json; then
    log_success "Bicep build successful"
    
    # Check generated ARM template size
    TEMPLATE_SIZE=$(du -h main.json | cut -f1)
    log_info "Generated ARM template size: $TEMPLATE_SIZE"
    
    # Clean up generated file
    rm -f main.json
else
    log_error "Bicep build failed"
    exit 1
fi

echo ""

# =============================================================================
# 4. Parameter Validation
# =============================================================================
log_info "Validating parameters..."

# Check if parameters file is valid JSON
if jq empty "$PARAM_FILE" 2>/dev/null; then
    log_success "Parameters file is valid JSON"
else
    log_error "Parameters file is not valid JSON"
    exit 1
fi

# Check required parameters
REQUIRED_PARAMS=("environment" "location" "appName")

for param in "${REQUIRED_PARAMS[@]}"; do
    if jq -e ".parameters.$param" "$PARAM_FILE" > /dev/null 2>&1; then
        VALUE=$(jq -r ".parameters.$param.value" "$PARAM_FILE")
        log_success "Parameter '$param' is set: $VALUE"
    else
        log_error "Required parameter '$param' is missing"
    fi
done

echo ""

# =============================================================================
# 5. Deployment Validation
# =============================================================================
log_info "Validating deployment (what-if)..."

# Get resource group name from parameters
RESOURCE_GROUP=$(jq -r '.parameters.appName.value' "$PARAM_FILE")
RESOURCE_GROUP="rg-${RESOURCE_GROUP}-${ENVIRONMENT}"

log_info "Resource Group: $RESOURCE_GROUP"

# Check if resource group exists
if az group show --name "$RESOURCE_GROUP" &> /dev/null; then
    log_success "Resource group exists"
    
    # Run what-if analysis
    log_info "Running what-if analysis (this may take a minute)..."
    
    if az deployment group what-if \
        --resource-group "$RESOURCE_GROUP" \
        --template-file main.bicep \
        --parameters "$PARAM_FILE" \
        --no-pretty-print > /tmp/whatif-output.txt 2>&1; then
        
        log_success "What-if analysis completed"
        
        # Show summary
        if grep -q "Resource changes:" /tmp/whatif-output.txt; then
            echo ""
            log_info "What-if summary:"
            grep -A 10 "Resource changes:" /tmp/whatif-output.txt || true
        fi
    else
        log_warning "What-if analysis failed (resource group may not exist yet)"
    fi
else
    log_warning "Resource group does not exist (will be created on deployment)"
fi

echo ""

# =============================================================================
# 6. Deployment Validation (Dry Run)
# =============================================================================
log_info "Validating deployment template..."

if az deployment group validate \
    --resource-group "$RESOURCE_GROUP" \
    --template-file main.bicep \
    --parameters "$PARAM_FILE" > /dev/null 2>&1; then
    log_success "Deployment validation passed"
else
    log_error "Deployment validation failed"
    az deployment group validate \
        --resource-group "$RESOURCE_GROUP" \
        --template-file main.bicep \
        --parameters "$PARAM_FILE"
    exit 1
fi

echo ""

# =============================================================================
# 7. Security Validation
# =============================================================================
log_info "Checking security configuration..."

# Check for hardcoded secrets
if grep -r "password.*:" main.bicep | grep -v "@secure" | grep -v "//" > /dev/null; then
    log_warning "Potential hardcoded passwords found (ensure @secure() is used)"
else
    log_success "No hardcoded passwords detected"
fi

# Check for secure parameters
if grep -q "@secure()" main.bicep; then
    log_success "Secure parameters are used"
else
    log_warning "No @secure() parameters found"
fi

# Check for Key Vault integration
if grep -q "Microsoft.KeyVault" main.bicep; then
    log_success "Key Vault integration detected"
else
    log_warning "No Key Vault integration found"
fi

echo ""

# =============================================================================
# 8. Cost Estimation
# =============================================================================
log_info "Estimating costs..."

# Extract SKUs from parameters
DB_SKU=$(jq -r '.parameters.databaseSku.value // "B_Standard_B1ms"' "$PARAM_FILE")
APP_SKU=$(jq -r '.parameters.appServicePlanSku.value // "B1"' "$PARAM_FILE")

log_info "Database SKU: $DB_SKU"
log_info "App Service SKU: $APP_SKU"

# Rough cost estimates (USD/month)
case "$ENVIRONMENT" in
    "dev")
        log_info "Estimated monthly cost: ~\$30-50"
        ;;
    "staging")
        log_info "Estimated monthly cost: ~\$35-60"
        ;;
    "prod")
        log_info "Estimated monthly cost: ~\$200-300"
        ;;
esac

echo ""

# =============================================================================
# 9. Best Practices Check
# =============================================================================
log_info "Checking best practices..."

# Check for tags
if grep -q "tags:" main.bicep; then
    log_success "Resource tagging is implemented"
else
    log_warning "No resource tagging found"
fi

# Check for diagnostic settings
if grep -q "diagnosticSettings" main.bicep; then
    log_success "Diagnostic settings configured"
else
    log_warning "No diagnostic settings found"
fi

# Check for managed identity
if grep -q "identity:" main.bicep; then
    log_success "Managed identity is used"
else
    log_warning "No managed identity found"
fi

echo ""

# =============================================================================
# Summary
# =============================================================================
echo "========================================="
echo "Validation Complete"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Review what-if output above"
echo "2. Deploy with: ./deploy.sh $ENVIRONMENT"
echo "3. Verify deployment: az deployment group show"
echo ""

cd "$PROJECT_ROOT"
exit 0
