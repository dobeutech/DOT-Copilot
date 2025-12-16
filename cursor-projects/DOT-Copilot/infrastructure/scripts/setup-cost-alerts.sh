#!/bin/bash
# =============================================================================
# DOT Copilot - Azure Cost Alerts Setup Script
# Creates budget alerts and cost monitoring for Azure resources
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
APP_NAME="${APP_NAME:-dot-copilot}"
ENVIRONMENT="${ENVIRONMENT:-prod}"
RESOURCE_GROUP="${RESOURCE_GROUP:-}"
MONTHLY_BUDGET="${MONTHLY_BUDGET:-100}"
ALERT_EMAILS="${ALERT_EMAILS:-}"

# =============================================================================
# Helper Functions
# =============================================================================

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI is not installed"
        exit 1
    fi
    
    if [ -z "$RESOURCE_GROUP" ]; then
        log_error "RESOURCE_GROUP environment variable is required"
        exit 1
    fi
    
    if [ -z "$ALERT_EMAILS" ]; then
        log_error "ALERT_EMAILS environment variable is required"
        exit 1
    fi
    
    # Check if logged in to Azure
    if ! az account show &> /dev/null; then
        log_error "Not logged in to Azure. Run 'az login' first"
        exit 1
    fi
    
    log_info "Prerequisites check passed"
}

get_resource_group_id() {
    log_info "Getting resource group ID..."
    
    RG_ID=$(az group show \
        --name "$RESOURCE_GROUP" \
        --query id \
        --output tsv)
    
    if [ -z "$RG_ID" ]; then
        log_error "Failed to get resource group ID"
        exit 1
    fi
    
    log_info "Resource Group ID: $RG_ID"
}

create_budget() {
    log_info "Creating budget: ${APP_NAME}-budget-${ENVIRONMENT}"
    
    # Calculate dates
    START_DATE=$(date +%Y-%m-01)
    END_DATE=$(date -d "+1 year" +%Y-%m-01)
    
    # Convert email list to JSON array
    EMAIL_ARRAY=$(echo "$ALERT_EMAILS" | tr ',' '\n' | jq -R . | jq -s .)
    
    # Create budget with multiple thresholds
    az consumption budget create \
        --budget-name "${APP_NAME}-budget-${ENVIRONMENT}" \
        --amount "$MONTHLY_BUDGET" \
        --time-grain Monthly \
        --start-date "$START_DATE" \
        --end-date "$END_DATE" \
        --resource-group "$RESOURCE_GROUP" \
        --notifications \
            Actual_GreaterThan_50_Percent="{
                \"enabled\": true,
                \"operator\": \"GreaterThan\",
                \"threshold\": 50,
                \"contactEmails\": $EMAIL_ARRAY,
                \"contactRoles\": [\"Owner\", \"Contributor\"],
                \"thresholdType\": \"Actual\"
            }" \
            Actual_GreaterThan_75_Percent="{
                \"enabled\": true,
                \"operator\": \"GreaterThan\",
                \"threshold\": 75,
                \"contactEmails\": $EMAIL_ARRAY,
                \"contactRoles\": [\"Owner\", \"Contributor\"],
                \"thresholdType\": \"Actual\"
            }" \
            Actual_GreaterThan_90_Percent="{
                \"enabled\": true,
                \"operator\": \"GreaterThan\",
                \"threshold\": 90,
                \"contactEmails\": $EMAIL_ARRAY,
                \"contactRoles\": [\"Owner\", \"Contributor\"],
                \"thresholdType\": \"Actual\"
            }" \
            Forecasted_GreaterThan_100_Percent="{
                \"enabled\": true,
                \"operator\": \"GreaterThan\",
                \"threshold\": 100,
                \"contactEmails\": $EMAIL_ARRAY,
                \"contactRoles\": [\"Owner\", \"Contributor\"],
                \"thresholdType\": \"Forecasted\"
            }"
    
    if [ $? -eq 0 ]; then
        log_info "Budget created successfully"
    else
        log_error "Failed to create budget"
        exit 1
    fi
}

enable_cost_analysis() {
    log_info "Enabling Azure Cost Management features..."
    
    # Enable cost analysis exports (optional)
    log_info "Cost analysis is available in Azure Portal:"
    log_info "  https://portal.azure.com/#blade/Microsoft_Azure_CostManagement/Menu/costanalysis"
    
    # Enable Azure Advisor cost recommendations
    log_info "Azure Advisor recommendations available at:"
    log_info "  https://portal.azure.com/#blade/Microsoft_Azure_Expert/AdvisorMenuBlade/Cost"
}

display_summary() {
    log_info "==================================================================="
    log_info "Cost Alert Configuration Summary"
    log_info "==================================================================="
    log_info "Budget Name: ${APP_NAME}-budget-${ENVIRONMENT}"
    log_info "Monthly Budget: \$$MONTHLY_BUDGET USD"
    log_info "Resource Group: $RESOURCE_GROUP"
    log_info "Alert Emails: $ALERT_EMAILS"
    log_info ""
    log_info "Alert Thresholds:"
    log_info "  - 50% of budget: Warning notification"
    log_info "  - 75% of budget: High priority notification"
    log_info "  - 90% of budget: Critical notification"
    log_info "  - 100% of budget (forecasted): Budget exceeded warning"
    log_info ""
    log_info "View budget in Azure Portal:"
    log_info "  https://portal.azure.com/#blade/Microsoft_Azure_CostManagement/Menu/budgets"
    log_info "==================================================================="
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    log_info "Starting Azure Cost Alerts Setup"
    log_info "Environment: $ENVIRONMENT"
    
    check_prerequisites
    get_resource_group_id
    create_budget
    enable_cost_analysis
    display_summary
    
    log_info "Cost alerts setup completed successfully!"
}

# Run main function
main "$@"
