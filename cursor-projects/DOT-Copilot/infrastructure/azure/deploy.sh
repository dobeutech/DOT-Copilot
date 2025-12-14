#!/bin/bash
# Azure Infrastructure Deployment Script
# Requires: Azure CLI and Bicep CLI

set -e

RESOURCE_GROUP_NAME=${1:-"rg-dot-copilot"}
LOCATION=${2:-"eastus"}
ENVIRONMENT=${3:-"dev"}
DB_ADMIN_USERNAME=${4}
DB_ADMIN_PASSWORD=${5}
JWT_SECRET=${6}
JWT_REFRESH_SECRET=${7}

if [ -z "$DB_ADMIN_USERNAME" ] || [ -z "$DB_ADMIN_PASSWORD" ] || [ -z "$JWT_SECRET" ] || [ -z "$JWT_REFRESH_SECRET" ]; then
    echo "Usage: ./deploy.sh <resource-group> <location> <environment> <db-username> <db-password> <jwt-secret> <jwt-refresh-secret>"
    exit 1
fi

echo "Deploying Azure infrastructure for DOT Copilot..."

# Create resource group if it doesn't exist
echo "Creating resource group: $RESOURCE_GROUP_NAME"
az group create --name "$RESOURCE_GROUP_NAME" --location "$LOCATION"

# Deploy Bicep template
echo "Deploying Bicep template..."
az deployment group create \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --template-file infrastructure/azure/main.bicep \
    --parameters \
        environment="$ENVIRONMENT" \
        dbAdminUsername="$DB_ADMIN_USERNAME" \
        dbAdminPassword="$DB_ADMIN_PASSWORD" \
        jwtSecret="$JWT_SECRET" \
        jwtRefreshSecret="$JWT_REFRESH_SECRET"

echo "Deployment completed!"
echo "Getting deployment outputs..."

# Get outputs
az deployment group show \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --name main \
    --query properties.outputs \
    --output table

