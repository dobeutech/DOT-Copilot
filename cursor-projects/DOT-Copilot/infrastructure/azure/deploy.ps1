# Azure Infrastructure Deployment Script
# Requires: Azure CLI, Azure PowerShell, and Bicep CLI

param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroupName = "rg-dot-copilot",
    
    [Parameter(Mandatory=$true)]
    [string]$Location = "eastus",
    
    [Parameter(Mandatory=$true)]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment = "dev",
    
    [Parameter(Mandatory=$true)]
    [string]$DbAdminUsername,
    
    [Parameter(Mandatory=$true)]
    [SecureString]$DbAdminPassword,
    
    [Parameter(Mandatory=$true)]
    [SecureString]$JwtSecret,
    
    [Parameter(Mandatory=$true)]
    [SecureString]$JwtRefreshSecret
)

Write-Host "Deploying Azure infrastructure for DOT Copilot..." -ForegroundColor Green

# Convert SecureString to plain text for Bicep (will be secured in Key Vault)
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($DbAdminPassword)
$DbAdminPasswordPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($JwtSecret)
$JwtSecretPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($JwtRefreshSecret)
$JwtRefreshSecretPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Create resource group if it doesn't exist
Write-Host "Creating resource group: $ResourceGroupName" -ForegroundColor Yellow
az group create --name $ResourceGroupName --location $Location

# Deploy Bicep template
Write-Host "Deploying Bicep template..." -ForegroundColor Yellow
az deployment group create `
    --resource-group $ResourceGroupName `
    --template-file infrastructure/azure/main.bicep `
    --parameters `
        environment=$Environment `
        dbAdminUsername=$DbAdminUsername `
        dbAdminPassword=$DbAdminPasswordPlain `
        jwtSecret=$JwtSecretPlain `
        jwtRefreshSecret=$JwtRefreshSecretPlain

Write-Host "Deployment completed!" -ForegroundColor Green
Write-Host "Getting deployment outputs..." -ForegroundColor Yellow

# Get outputs
$outputs = az deployment group show `
    --resource-group $ResourceGroupName `
    --name main `
    --query properties.outputs `
    | ConvertFrom-Json

Write-Host "`nDeployment Outputs:" -ForegroundColor Cyan
Write-Host "Backend URL: $($outputs.backendUrl.value)" -ForegroundColor White
Write-Host "Frontend URL: $($outputs.frontendUrl.value)" -ForegroundColor White
Write-Host "Database Server: $($outputs.databaseServerName.value)" -ForegroundColor White
Write-Host "Storage Account: $($outputs.storageAccountName.value)" -ForegroundColor White
Write-Host "Key Vault: $($outputs.keyVaultName.value)" -ForegroundColor White

