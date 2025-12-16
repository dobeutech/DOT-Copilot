// =============================================================================
// DOT Copilot - Azure Cost Management Alerts
// Budget alerts and cost monitoring configuration
// =============================================================================

@description('Application name')
param appName string = 'dot-copilot'

@description('Environment')
param environment string = 'prod'

@description('Monthly budget amount in USD')
param monthlyBudget int = 100

@description('Email addresses for cost alerts')
param costAlertEmails array = []

@description('Resource Group ID for budget scope')
param resourceGroupId string = resourceGroup().id

// =============================================================================
// Budget Configuration
// =============================================================================

// Note: Azure Budgets are created via ARM template, not Bicep
// This file documents the configuration for manual setup or ARM deployment

/*
Budget Alert Thresholds:
- 50% of budget: Warning notification
- 75% of budget: High priority notification  
- 90% of budget: Critical notification
- 100% of budget: Budget exceeded notification

To deploy budgets, use Azure CLI or Portal:

az consumption budget create \
  --budget-name "${appName}-budget-${environment}" \
  --amount ${monthlyBudget} \
  --time-grain Monthly \
  --start-date $(date +%Y-%m-01) \
  --end-date $(date -d "+1 year" +%Y-%m-01) \
  --resource-group <resource-group-name> \
  --notifications \
    Actual_GreaterThan_50_Percent='{
      "enabled": true,
      "operator": "GreaterThan",
      "threshold": 50,
      "contactEmails": ["email@example.com"],
      "contactRoles": ["Owner", "Contributor"],
      "thresholdType": "Actual"
    }' \
    Actual_GreaterThan_75_Percent='{
      "enabled": true,
      "operator": "GreaterThan",
      "threshold": 75,
      "contactEmails": ["email@example.com"],
      "contactRoles": ["Owner", "Contributor"],
      "thresholdType": "Actual"
    }' \
    Actual_GreaterThan_90_Percent='{
      "enabled": true,
      "operator": "GreaterThan",
      "threshold": 90,
      "contactEmails": ["email@example.com"],
      "contactRoles": ["Owner", "Contributor"],
      "thresholdType": "Actual"
    }' \
    Forecasted_GreaterThan_100_Percent='{
      "enabled": true,
      "operator": "GreaterThan",
      "threshold": 100,
      "contactEmails": ["email@example.com"],
      "contactRoles": ["Owner", "Contributor"],
      "thresholdType": "Forecasted"
    }'
*/

// =============================================================================
// Cost Optimization Recommendations
// =============================================================================

/*
Recommended Cost Controls:

1. App Service Plans:
   - Use B1 (Basic) for dev/staging: ~$13/month
   - Use S1 (Standard) for production: ~$70/month
   - Enable auto-scaling with min/max instances

2. Azure Database for PostgreSQL:
   - Use Burstable B1ms for dev: ~$12/month
   - Use General Purpose D2s_v3 for prod: ~$140/month
   - Enable auto-grow storage
   - Set backup retention to 7 days (dev) or 35 days (prod)

3. Application Insights:
   - Enable sampling (90% for dev, 50% for prod)
   - Set daily cap: 1GB (dev), 5GB (prod)
   - Retention: 30 days (dev), 90 days (prod)

4. Storage Accounts:
   - Use Standard LRS for dev
   - Use Standard GRS for prod
   - Enable lifecycle management to archive old data

5. Azure Monitor:
   - Limit log retention to 30 days
   - Use basic metrics only
   - Disable verbose logging in production

6. Networking:
   - Use Azure CDN for static content
   - Enable compression
   - Minimize cross-region traffic

Estimated Monthly Costs by Environment:
- Development: $30-50
- Staging: $50-80
- Production: $250-350
*/

// =============================================================================
// Cost Monitoring Queries
// =============================================================================

/*
Azure Resource Graph Queries for Cost Analysis:

1. Top 5 Most Expensive Resources:
Resources
| where resourceGroup =~ '<resource-group-name>'
| project name, type, location, tags
| join kind=inner (
    CostManagement
    | where TimeGenerated >= ago(30d)
    | summarize TotalCost = sum(Cost) by ResourceId
    | top 5 by TotalCost desc
) on $left.id == $right.ResourceId
| project name, type, TotalCost

2. Daily Cost Trend (Last 30 Days):
CostManagement
| where TimeGenerated >= ago(30d)
| where ResourceGroup =~ '<resource-group-name>'
| summarize DailyCost = sum(Cost) by bin(TimeGenerated, 1d)
| render timechart

3. Cost by Service:
CostManagement
| where TimeGenerated >= ago(30d)
| where ResourceGroup =~ '<resource-group-name>'
| summarize TotalCost = sum(Cost) by ServiceName
| order by TotalCost desc
*/

// =============================================================================
// Outputs
// =============================================================================

output budgetConfiguration object = {
  monthlyBudget: monthlyBudget
  alertThresholds: [50, 75, 90, 100]
  scope: resourceGroupId
  contactEmails: costAlertEmails
}

output costOptimizationTips array = [
  'Enable Application Insights sampling to reduce ingestion costs'
  'Use auto-scaling to match capacity with demand'
  'Set appropriate backup retention periods'
  'Enable storage lifecycle management'
  'Review and remove unused resources monthly'
  'Use reserved instances for predictable workloads'
  'Enable Azure Advisor cost recommendations'
]
