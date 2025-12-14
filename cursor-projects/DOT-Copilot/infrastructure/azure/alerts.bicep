// =============================================================================
// DOT Copilot - Azure Monitor Alerts
// Standalone module for Application Insights alerts and action groups
// =============================================================================

@description('Application name')
param appName string = 'dot-copilot'

@description('Environment')
param environment string = 'prod'

@description('Location')
param location string = resourceGroup().location

@description('Application Insights resource ID')
param appInsightsId string

@description('Backend App Service resource ID')
param backendAppId string

@description('PostgreSQL Server resource ID')
param postgresServerId string

@description('Email addresses for alerts')
param alertEmailAddresses array = []

@description('Enable alerts')
param enableAlerts bool = true

// =============================================================================
// Action Group for Notifications
// =============================================================================

resource actionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = if (enableAlerts) {
  name: '${appName}-alerts-${environment}'
  location: 'global'
  properties: {
    groupShortName: 'DOTAlerts'
    enabled: true
    emailReceivers: [for email in alertEmailAddresses: {
      name: 'Email-${email}'
      emailAddress: email
      useCommonAlertSchema: true
    }]
  }
}

// =============================================================================
// Application Performance Alerts
// =============================================================================

// Alert: High Server Response Time
resource responseTimeAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = if (enableAlerts) {
  name: '${appName}-response-time-${environment}'
  location: 'global'
  properties: {
    description: 'Average response time exceeds 2 seconds'
    severity: 2
    enabled: true
    scopes: [backendAppId]
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
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// Alert: High Error Rate (5xx errors)
resource serverErrorAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = if (enableAlerts) {
  name: '${appName}-server-errors-${environment}'
  location: 'global'
  properties: {
    description: 'More than 10 server errors (5xx) in 15 minutes'
    severity: 1
    enabled: true
    scopes: [backendAppId]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'ServerErrors'
          metricName: 'Http5xx'
          operator: 'GreaterThan'
          threshold: 10
          timeAggregation: 'Total'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// Alert: High 4xx Error Rate
resource clientErrorAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = if (enableAlerts) {
  name: '${appName}-client-errors-${environment}'
  location: 'global'
  properties: {
    description: 'More than 50 client errors (4xx) in 15 minutes'
    severity: 3
    enabled: true
    scopes: [backendAppId]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'ClientErrors'
          metricName: 'Http4xx'
          operator: 'GreaterThan'
          threshold: 50
          timeAggregation: 'Total'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// Alert: App Service Down
resource availabilityAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = if (enableAlerts) {
  name: '${appName}-availability-${environment}'
  location: 'global'
  properties: {
    description: 'Backend app service is not responding'
    severity: 0
    enabled: true
    scopes: [backendAppId]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'HealthCheckFailed'
          metricName: 'HealthCheckStatus'
          operator: 'LessThan'
          threshold: 100
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// =============================================================================
// Database Alerts
// =============================================================================

// Alert: Database High CPU
resource dbCpuAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = if (enableAlerts) {
  name: '${appName}-db-cpu-${environment}'
  location: 'global'
  properties: {
    description: 'Database CPU usage exceeds 80%'
    severity: 2
    enabled: true
    scopes: [postgresServerId]
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
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// Alert: Database High Memory
resource dbMemoryAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = if (enableAlerts) {
  name: '${appName}-db-memory-${environment}'
  location: 'global'
  properties: {
    description: 'Database memory usage exceeds 80%'
    severity: 2
    enabled: true
    scopes: [postgresServerId]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'HighMemory'
          metricName: 'memory_percent'
          operator: 'GreaterThan'
          threshold: 80
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// Alert: Database Storage High
resource dbStorageAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = if (enableAlerts) {
  name: '${appName}-db-storage-${environment}'
  location: 'global'
  properties: {
    description: 'Database storage usage exceeds 80%'
    severity: 2
    enabled: true
    scopes: [postgresServerId]
    evaluationFrequency: 'PT15M'
    windowSize: 'PT1H'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'HighStorage'
          metricName: 'storage_percent'
          operator: 'GreaterThan'
          threshold: 80
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// Alert: Database Connection Failed
resource dbConnectionAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = if (enableAlerts) {
  name: '${appName}-db-connections-${environment}'
  location: 'global'
  properties: {
    description: 'Database connection count dropped to zero'
    severity: 1
    enabled: true
    scopes: [postgresServerId]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'NoConnections'
          metricName: 'active_connections'
          operator: 'LessThan'
          threshold: 1
          timeAggregation: 'Maximum'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// =============================================================================
// Outputs
// =============================================================================

output actionGroupId string = enableAlerts ? actionGroup.id : ''
output alertsEnabled bool = enableAlerts

