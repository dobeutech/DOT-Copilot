// =============================================================================
// DOT Copilot - Azure Infrastructure
// Cost-optimized deployment using Static Web Apps for frontend
// =============================================================================

@description('The location for all resources')
param location string = resourceGroup().location

@description('Environment name (dev, staging, prod)')
@allowed(['dev', 'staging', 'prod'])
param environment string = 'dev'

@description('Application name')
param appName string = 'dot-copilot'

@description('Database administrator username')
@secure()
param dbAdminUsername string

@description('Database administrator password')
@secure()
param dbAdminPassword string

@description('JWT secret for authentication')
@secure()
param jwtSecret string

@description('JWT refresh secret')
@secure()
param jwtRefreshSecret string

@description('GitHub repository URL for Static Web App')
param repositoryUrl string = ''

@description('GitHub repository branch')
param repositoryBranch string = 'main'

@description('Enable staging slot for backend')
param enableStagingSlot bool = environment == 'prod'

// =============================================================================
// Variables
// =============================================================================

var appServicePlanName = 'asp-${appName}-${environment}'
var backendAppName = '${appName}-backend-${environment}'
var staticWebAppName = '${appName}-frontend-${environment}'
var dbServerName = '${appName}-db-${environment}'
var dbName = 'dot_copilot'
var storageAccountName = take('${replace(appName, '-', '')}${environment}${uniqueString(resourceGroup().id)}', 24)
var keyVaultName = take('${replace(appName, '-', '')}kv${environment}', 24)
var appInsightsName = '${appName}-insights-${environment}'
var logAnalyticsName = '${appName}-logs-${environment}'

// SKU configurations by environment
var appServiceSku = {
  dev: { name: 'B1', tier: 'Basic' }
  staging: { name: 'B1', tier: 'Basic' }
  prod: { name: 'P1V2', tier: 'PremiumV2' }
}

var postgresSku = {
  dev: { name: 'Standard_B1ms', tier: 'Burstable' }
  staging: { name: 'Standard_B1ms', tier: 'Burstable' }
  prod: { name: 'Standard_D2s_v3', tier: 'GeneralPurpose' }
}

var storageRedundancy = {
  dev: 'Standard_LRS'
  staging: 'Standard_LRS'
  prod: 'Standard_ZRS'
}

// =============================================================================
// Log Analytics Workspace (required for App Insights)
// =============================================================================

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logAnalyticsName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// =============================================================================
// Application Insights
// =============================================================================

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    Request_Source: 'rest'
    // Enable sampling to reduce costs
    SamplingPercentage: environment == 'prod' ? 10 : 100
  }
}

// =============================================================================
// Key Vault
// =============================================================================

resource keyVault 'Microsoft.KeyVault/vaults@2023-02-01' = {
  name: keyVaultName
  location: location
  properties: {
    tenantId: subscription().tenantId
    sku: {
      family: 'A'
      name: 'standard'
    }
    accessPolicies: []
    enabledForDeployment: true
    enabledForTemplateDeployment: true
    enabledForDiskEncryption: false
    enableRbacAuthorization: true
  }
}

// Key Vault Secrets
resource jwtSecretKV 'Microsoft.KeyVault/vaults/secrets@2023-02-01' = {
  parent: keyVault
  name: 'JWT-SECRET'
  properties: {
    value: jwtSecret
  }
}

resource jwtRefreshSecretKV 'Microsoft.KeyVault/vaults/secrets@2023-02-01' = {
  parent: keyVault
  name: 'JWT-REFRESH-SECRET'
  properties: {
    value: jwtRefreshSecret
  }
}

resource dbPasswordKV 'Microsoft.KeyVault/vaults/secrets@2023-02-01' = {
  parent: keyVault
  name: 'DB-PASSWORD'
  properties: {
    value: dbAdminPassword
  }
}

// =============================================================================
// Azure Database for PostgreSQL Flexible Server
// =============================================================================

resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-06-01-preview' = {
  name: dbServerName
  location: location
  sku: postgresSku[environment]
  properties: {
    administratorLogin: dbAdminUsername
    administratorLoginPassword: dbAdminPassword
    version: '16'
    storage: {
      storageSizeGB: environment == 'prod' ? 128 : 32
    }
    backup: {
      backupRetentionDays: environment == 'prod' ? 14 : 7
      geoRedundantBackup: environment == 'prod' ? 'Enabled' : 'Disabled'
    }
    highAvailability: {
      mode: environment == 'prod' ? 'ZoneRedundant' : 'Disabled'
    }
  }
}

resource postgresDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-06-01-preview' = {
  parent: postgresServer
  name: dbName
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

// Allow Azure Services
resource postgresFirewallAzure 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-06-01-preview' = {
  parent: postgresServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// =============================================================================
// Storage Account for File Uploads
// =============================================================================

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  kind: 'StorageV2'
  sku: {
    name: storageRedundancy[environment]
  }
  properties: {
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    accessTier: 'Hot'
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    deleteRetentionPolicy: {
      enabled: true
      days: 7
    }
  }
}

resource uploadsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'uploads'
  properties: {
    publicAccess: 'None'
  }
}

// =============================================================================
// App Service Plan (Backend Only)
// =============================================================================

resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: appServicePlanName
  location: location
  kind: 'linux'
  sku: appServiceSku[environment]
  properties: {
    reserved: true
  }
}

// =============================================================================
// Backend App Service
// =============================================================================

resource backendApp 'Microsoft.Web/sites@2023-01-01' = {
  name: backendAppName
  location: location
  kind: 'app,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|20-lts'
      alwaysOn: environment != 'dev'
      http20Enabled: true
      minTlsVersion: '1.2'
      healthCheckPath: '/health'
      appSettings: [
        { name: 'NODE_ENV', value: environment == 'prod' ? 'production' : 'development' }
        { name: 'PORT', value: '3001' }
        { name: 'DATABASE_URL', value: 'postgresql://${dbAdminUsername}:${dbAdminPassword}@${postgresServer.properties.fullyQualifiedDomainName}:5432/${dbName}?sslmode=require' }
        { name: 'JWT_SECRET', value: '@Microsoft.KeyVault(SecretUri=${jwtSecretKV.properties.secretUri})' }
        { name: 'JWT_REFRESH_SECRET', value: '@Microsoft.KeyVault(SecretUri=${jwtRefreshSecretKV.properties.secretUri})' }
        { name: 'FRONTEND_URL', value: 'https://${staticWebAppName}.azurestaticapps.net' }
        { name: 'AZURE_STORAGE_CONNECTION_STRING', value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccountName};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=${az.environment().suffixes.storage}' }
        { name: 'AZURE_STORAGE_CONTAINER', value: 'uploads' }
        { name: 'APPINSIGHTS_INSTRUMENTATIONKEY', value: appInsights.properties.InstrumentationKey }
        { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsights.properties.ConnectionString }
        { name: 'ENABLE_DOCS', value: environment != 'prod' ? 'true' : 'false' }
      ]
    }
  }
}

// Key Vault RBAC Role Assignment for Backend (Key Vault Secrets User)
// Required because enableRbacAuthorization is true - access policies are ignored
resource backendKeyVaultRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, backendApp.id, '4633458b-17de-408a-b874-0445c86b69e6')
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6') // Key Vault Secrets User
    principalId: backendApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// =============================================================================
// Backend Staging Slot (Production Only)
// =============================================================================

resource backendStagingSlot 'Microsoft.Web/sites/slots@2023-01-01' = if (enableStagingSlot) {
  parent: backendApp
  name: 'staging'
  location: location
  kind: 'app,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|20-lts'
      alwaysOn: false
      http20Enabled: true
      minTlsVersion: '1.2'
      healthCheckPath: '/health'
      appSettings: [
        { name: 'NODE_ENV', value: 'staging' }
        { name: 'PORT', value: '3001' }
        { name: 'DATABASE_URL', value: 'postgresql://${dbAdminUsername}:${dbAdminPassword}@${postgresServer.properties.fullyQualifiedDomainName}:5432/${dbName}?sslmode=require' }
        { name: 'JWT_SECRET', value: '@Microsoft.KeyVault(SecretUri=${jwtSecretKV.properties.secretUri})' }
        { name: 'JWT_REFRESH_SECRET', value: '@Microsoft.KeyVault(SecretUri=${jwtRefreshSecretKV.properties.secretUri})' }
        { name: 'FRONTEND_URL', value: 'https://${staticWebAppName}.azurestaticapps.net' }
        { name: 'AZURE_STORAGE_CONNECTION_STRING', value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccountName};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=${az.environment().suffixes.storage}' }
        { name: 'AZURE_STORAGE_CONTAINER', value: 'uploads' }
        { name: 'APPINSIGHTS_INSTRUMENTATIONKEY', value: appInsights.properties.InstrumentationKey }
        { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsights.properties.ConnectionString }
        { name: 'ENABLE_DOCS', value: 'true' }
      ]
    }
  }
}

// Key Vault RBAC Role Assignment for Staging Slot
resource stagingKeyVaultRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (enableStagingSlot) {
  name: guid(keyVault.id, backendStagingSlot.id, '4633458b-17de-408a-b874-0445c86b69e6')
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6') // Key Vault Secrets User
    principalId: backendStagingSlot.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// =============================================================================
// Azure Static Web App (Frontend - FREE TIER)
// =============================================================================

resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: staticWebAppName
  location: 'eastus2' // Static Web Apps have limited regions
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    repositoryUrl: repositoryUrl
    branch: repositoryBranch
    buildProperties: {
      appLocation: '/frontend'
      outputLocation: 'dist'
      appBuildCommand: 'npm run build'
    }
  }
}

// Static Web App Configuration
resource staticWebAppConfig 'Microsoft.Web/staticSites/config@2023-01-01' = {
  parent: staticWebApp
  name: 'appsettings'
  properties: {
    VITE_API_BASE_URL: 'https://${backendAppName}.azurewebsites.net/api'
  }
}

// =============================================================================
// Monitoring Alerts
// =============================================================================

// Alert: High Error Rate
resource errorRateAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = if (environment == 'prod') {
  name: '${appName}-high-error-rate-${environment}'
  location: 'global'
  properties: {
    description: 'Alert when error rate exceeds 5%'
    severity: 2
    enabled: true
    scopes: [backendApp.id]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'HighErrorRate'
          metricName: 'Http5xx'
          operator: 'GreaterThan'
          threshold: 10
          timeAggregation: 'Total'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
  }
}

// Alert: High Response Time
resource responseTimeAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = if (environment == 'prod') {
  name: '${appName}-high-response-time-${environment}'
  location: 'global'
  properties: {
    description: 'Alert when average response time exceeds 2 seconds'
    severity: 3
    enabled: true
    scopes: [backendApp.id]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'HighResponseTime'
          metricName: 'HttpResponseTime'
          operator: 'GreaterThan'
          threshold: 2
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
  }
}

// Alert: Database CPU High
resource dbCpuAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = if (environment == 'prod') {
  name: '${appName}-db-high-cpu-${environment}'
  location: 'global'
  properties: {
    description: 'Alert when database CPU exceeds 80%'
    severity: 2
    enabled: true
    scopes: [postgresServer.id]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'HighCPU'
          metricName: 'cpu_percent'
          operator: 'GreaterThan'
          threshold: 80
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
  }
}

// =============================================================================
// Outputs
// =============================================================================

output backendUrl string = 'https://${backendAppName}.azurewebsites.net'
output frontendUrl string = 'https://${staticWebApp.properties.defaultHostname}'
output stagingBackendUrl string = enableStagingSlot ? 'https://${backendAppName}-staging.azurewebsites.net' : ''
output databaseServer string = postgresServer.properties.fullyQualifiedDomainName
output databaseName string = dbName
output storageAccountName string = storageAccountName
output keyVaultName string = keyVaultName
output appInsightsName string = appInsightsName
output staticWebAppName string = staticWebAppName

// Cost estimation output
output estimatedMonthlyCost string = environment == 'dev' ? '~$30/month (Dev tier)' : environment == 'staging' ? '~$35/month (Staging tier)' : '~$250/month (Production tier)'
