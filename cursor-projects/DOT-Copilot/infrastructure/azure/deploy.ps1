<#
.SYNOPSIS
    DOT Copilot - Azure Infrastructure Deployment Script
    
.DESCRIPTION
    One-click deployment script for DOT Copilot to Azure.
    Validates prerequisites, generates secrets, and deploys infrastructure.
    
.PARAMETER Environment
    Target environment: dev, staging, or prod
    
.PARAMETER ResourceGroupName
    Name of the Azure resource group
    
.PARAMETER Location
    Azure region for deployment
    
.PARAMETER SkipValidation
    Skip prerequisite validation checks
    
.EXAMPLE
    .\deploy.ps1 -Environment dev
    
.EXAMPLE
    .\deploy.ps1 -Environment prod -ResourceGroupName rg-dot-copilot-prod -Location eastus
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment = "dev",
    
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroupName = "",
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "eastus",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipValidation,
    
    [Parameter(Mandatory=$false)]
    [string]$DbAdminUsername = "dotcopilotadmin"
)

# =============================================================================
# Configuration
# =============================================================================

$ErrorActionPreference = "Stop"
$AppName = "dot-copilot"

if ([string]::IsNullOrEmpty($ResourceGroupName)) {
    $ResourceGroupName = "rg-${AppName}-${Environment}"
}

# =============================================================================
# Helper Functions
# =============================================================================

function Write-Header {
    param([string]$Message)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
}

function Write-Step {
    param([string]$Message)
    Write-Host "[*] $Message" -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Message)
    Write-Host "[+] $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "[-] $Message" -ForegroundColor Red
}

function Generate-SecurePassword {
    param([int]$Length = 32)
    $chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    $password = -join ((1..$Length) | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] })
    return $password
}

function Generate-JwtSecret {
    param([int]$Length = 64)
    $chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    $secret = -join ((1..$Length) | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] })
    return $secret
}

# =============================================================================
# Validation
# =============================================================================

function Test-Prerequisites {
    Write-Header "Validating Prerequisites"
    
    $errors = @()
    
    # Check Azure CLI
    Write-Step "Checking Azure CLI..."
    try {
        $azVersion = az version 2>$null | ConvertFrom-Json
        Write-Success "Azure CLI v$($azVersion.'azure-cli') installed"
    } catch {
        $errors += "Azure CLI is not installed. Install from: https://aka.ms/installazurecliwindows"
    }
    
    # Check Bicep
    Write-Step "Checking Bicep CLI..."
    try {
        $bicepVersion = az bicep version 2>&1
        if ($bicepVersion -match "Bicep CLI version") {
            Write-Success "Bicep CLI installed"
        } else {
            az bicep install
            Write-Success "Bicep CLI installed"
        }
    } catch {
        $errors += "Failed to install Bicep CLI"
    }
    
    # Check Azure login
    Write-Step "Checking Azure login status..."
    try {
        $account = az account show 2>$null | ConvertFrom-Json
        Write-Success "Logged in as: $($account.user.name)"
        Write-Success "Subscription: $($account.name)"
    } catch {
        $errors += "Not logged in to Azure. Run 'az login' first."
    }
    
    # Check Node.js
    Write-Step "Checking Node.js..."
    try {
        $nodeVersion = node --version 2>$null
        Write-Success "Node.js $nodeVersion installed"
    } catch {
        $errors += "Node.js is not installed"
    }
    
    if ($errors.Count -gt 0) {
        Write-Host "`nPrerequisite Errors:" -ForegroundColor Red
        $errors | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
        exit 1
    }
    
    Write-Success "All prerequisites satisfied!"
}

# =============================================================================
# Main Deployment
# =============================================================================

Write-Header "DOT Copilot Azure Deployment"
Write-Host "Environment: $Environment"
Write-Host "Resource Group: $ResourceGroupName"
Write-Host "Location: $Location"

# Validate prerequisites
if (-not $SkipValidation) {
    Test-Prerequisites
}

# Generate secrets
Write-Header "Generating Secrets"

$DbPassword = Generate-SecurePassword -Length 24
$JwtSecret = Generate-JwtSecret -Length 64
$JwtRefreshSecret = Generate-JwtSecret -Length 64

Write-Success "Database password generated"
Write-Success "JWT secrets generated"

# Save secrets to local file (for reference - gitignored)
$secretsFile = ".azure-secrets-$Environment.json"
$secrets = @{
    environment = $Environment
    dbAdminUsername = $DbAdminUsername
    dbAdminPassword = $DbPassword
    jwtSecret = $JwtSecret
    jwtRefreshSecret = $JwtRefreshSecret
    generatedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
}
$secrets | ConvertTo-Json | Out-File -FilePath $secretsFile -Encoding UTF8
Write-Success "Secrets saved to $secretsFile (keep this secure!)"

# Create resource group
Write-Header "Creating Resource Group"
Write-Step "Creating resource group: $ResourceGroupName..."

az group create `
    --name $ResourceGroupName `
    --location $Location `
    --output none

Write-Success "Resource group created"

# Deploy Bicep template
Write-Header "Deploying Infrastructure"
Write-Step "This may take 5-10 minutes..."

$deploymentName = "dot-copilot-$Environment-$(Get-Date -Format 'yyyyMMddHHmmss')"

$deploymentResult = az deployment group create `
    --resource-group $ResourceGroupName `
    --name $deploymentName `
    --template-file "main.bicep" `
    --parameters `
        environment=$Environment `
        appName=$AppName `
        location=$Location `
        dbAdminUsername=$DbAdminUsername `
        dbAdminPassword=$DbPassword `
        jwtSecret=$JwtSecret `
        jwtRefreshSecret=$JwtRefreshSecret `
    --output json | ConvertFrom-Json

if ($LASTEXITCODE -ne 0) {
    Write-Error "Deployment failed!"
    exit 1
}

Write-Success "Infrastructure deployed successfully!"

# Get outputs
Write-Header "Deployment Outputs"

$outputs = $deploymentResult.properties.outputs

Write-Host "Backend URL:      $($outputs.backendUrl.value)" -ForegroundColor White
Write-Host "Frontend URL:     $($outputs.frontendUrl.value)" -ForegroundColor White
Write-Host "Database Server:  $($outputs.databaseServer.value)" -ForegroundColor White
Write-Host "Storage Account:  $($outputs.storageAccountName.value)" -ForegroundColor White
Write-Host "Key Vault:        $($outputs.keyVaultName.value)" -ForegroundColor White
Write-Host "App Insights:     $($outputs.appInsightsName.value)" -ForegroundColor White
if ($outputs.stagingBackendUrl.value) {
    Write-Host "Staging URL:      $($outputs.stagingBackendUrl.value)" -ForegroundColor White
}
Write-Host ""
Write-Host "Estimated Cost:   $($outputs.estimatedMonthlyCost.value)" -ForegroundColor Yellow

# Next steps
Write-Header "Next Steps"

Write-Host @"
1. Configure GitHub Secrets:
   - AZURE_CREDENTIALS: Service principal credentials
   - AZURE_STATIC_WEB_APPS_API_TOKEN: Static Web App token
   - DATABASE_URL: $($outputs.databaseServer.value)
   - BACKEND_URL: $($outputs.backendUrl.value)
   - FRONTEND_URL: $($outputs.frontendUrl.value)

2. Run database migrations:
   cd backend
   npx prisma migrate deploy

3. Deploy application code:
   - Push to GitHub to trigger CI/CD
   - Or deploy manually using Azure CLI

4. Verify deployment:
   - Backend health: $($outputs.backendUrl.value)/health
   - Frontend: $($outputs.frontendUrl.value)

5. Optional: Configure custom domain
   az webapp config hostname add --webapp-name dot-copilot-backend-$Environment ...

"@ -ForegroundColor Gray

Write-Success "Deployment complete!"
