# Azure Cost Management & Alerts

## Overview

Cost management and alerting configuration for Azure infrastructure to prevent budget overruns and optimize spending.

## Cost Budgets by Environment

### Development
- **Monthly Budget:** $50
- **Alert Thresholds:** 50%, 80%, 100%
- **Action:** Email notification

### Staging
- **Monthly Budget:** $75
- **Alert Thresholds:** 50%, 80%, 100%
- **Action:** Email notification

### Production
- **Monthly Budget:** $300
- **Alert Thresholds:** 50%, 75%, 90%, 100%
- **Action:** Email + Slack notification

---

## Azure CLI Cost Alert Setup

### 1. Create Budget

```bash
#!/bin/bash
# scripts/create-cost-budget.sh

ENVIRONMENT="$1"  # dev, staging, prod
RESOURCE_GROUP="rg-dot-copilot-${ENVIRONMENT}"

# Set budget amount based on environment
case "$ENVIRONMENT" in
  "dev")
    BUDGET_AMOUNT=50
    ;;
  "staging")
    BUDGET_AMOUNT=75
    ;;
  "prod")
    BUDGET_AMOUNT=300
    ;;
  *)
    echo "Invalid environment. Use: dev, staging, or prod"
    exit 1
    ;;
esac

# Create budget
az consumption budget create \
  --budget-name "budget-dot-copilot-${ENVIRONMENT}" \
  --amount $BUDGET_AMOUNT \
  --category Cost \
  --time-grain Monthly \
  --start-date $(date +%Y-%m-01) \
  --end-date $(date -d "+1 year" +%Y-%m-01) \
  --resource-group $RESOURCE_GROUP

echo "Budget created: \$${BUDGET_AMOUNT}/month for ${ENVIRONMENT}"
```

### 2. Create Cost Alerts

```bash
#!/bin/bash
# scripts/create-cost-alerts.sh

ENVIRONMENT="$1"
RESOURCE_GROUP="rg-dot-copilot-${ENVIRONMENT}"
EMAIL="alerts@dotcopilot.com"

# Alert thresholds
THRESHOLDS=(50 80 100)

for THRESHOLD in "${THRESHOLDS[@]}"; do
  az consumption budget create \
    --budget-name "alert-${ENVIRONMENT}-${THRESHOLD}pct" \
    --amount $(az consumption budget show --budget-name "budget-dot-copilot-${ENVIRONMENT}" --query amount -o tsv) \
    --category Cost \
    --time-grain Monthly \
    --resource-group $RESOURCE_GROUP \
    --notifications \
      Enabled=true \
      Operator=GreaterThan \
      Threshold=$THRESHOLD \
      ContactEmails="[$EMAIL]" \
      ContactRoles="[Owner,Contributor]"
  
  echo "Alert created: ${THRESHOLD}% threshold"
done
```

---

## Bicep Cost Alert Configuration

### File: `infrastructure/azure/cost-alerts.bicep`

```bicep
// =============================================================================
// Cost Management & Budgets
// =============================================================================

param environment string
param budgetAmount int
param alertEmail string
param resourceGroupId string

// Budget amounts by environment
var budgetAmounts = {
  dev: 50
  staging: 75
  prod: 300
}

var actualBudget = budgetAmount != 0 ? budgetAmount : budgetAmounts[environment]

// Budget resource
resource budget 'Microsoft.Consumption/budgets@2023-05-01' = {
  name: 'budget-dot-copilot-${environment}'
  properties: {
    category: 'Cost'
    amount: actualBudget
    timeGrain: 'Monthly'
    timePeriod: {
      startDate: '${utcNow('yyyy-MM')}-01'
      endDate: '${dateTimeAdd(utcNow(), 'P1Y', 'yyyy-MM')}-01'
    }
    filter: {
      dimensions: {
        name: 'ResourceGroupName'
        operator: 'In'
        values: [
          last(split(resourceGroupId, '/'))
        ]
      }
    }
    notifications: {
      // 50% threshold
      'notification-50': {
        enabled: true
        operator: 'GreaterThan'
        threshold: 50
        contactEmails: [
          alertEmail
        ]
        contactRoles: [
          'Owner'
          'Contributor'
        ]
        thresholdType: 'Actual'
      }
      // 80% threshold
      'notification-80': {
        enabled: true
        operator: 'GreaterThan'
        threshold: 80
        contactEmails: [
          alertEmail
        ]
        contactRoles: [
          'Owner'
          'Contributor'
        ]
        thresholdType: 'Actual'
      }
      // 100% threshold
      'notification-100': {
        enabled: true
        operator: 'GreaterThan'
        threshold: 100
        contactEmails: [
          alertEmail
        ]
        contactRoles: [
          'Owner'
          'Contributor'
        ]
        thresholdType: 'Actual'
      }
    }
  }
}

// Cost anomaly alert
resource costAnomalyAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'cost-anomaly-${environment}'
  location: 'global'
  properties: {
    description: 'Alert on unusual cost increases'
    severity: 2
    enabled: true
    scopes: [resourceGroupId]
    evaluationFrequency: 'PT1H'
    windowSize: 'PT6H'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.MultipleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'CostIncrease'
          metricName: 'UsageQuantity'
          operator: 'GreaterThan'
          threshold: 150  // 150% of normal
          timeAggregation: 'Total'
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

// Action group for notifications
resource actionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: 'cost-alerts-${environment}'
  location: 'global'
  properties: {
    groupShortName: 'CostAlert'
    enabled: true
    emailReceivers: [
      {
        name: 'AlertEmail'
        emailAddress: alertEmail
        useCommonAlertSchema: true
      }
    ]
  }
}

output budgetId string = budget.id
output budgetAmount int = actualBudget
```

---

## Cost Monitoring Dashboard

### Azure Portal Dashboard

```json
{
  "properties": {
    "lenses": [
      {
        "order": 0,
        "parts": [
          {
            "position": {
              "x": 0,
              "y": 0,
              "colSpan": 6,
              "rowSpan": 4
            },
            "metadata": {
              "type": "Extension/Microsoft_Azure_CostManagement/PartType/CostAnalysisPart"
            }
          },
          {
            "position": {
              "x": 6,
              "y": 0,
              "colSpan": 6,
              "rowSpan": 4
            },
            "metadata": {
              "type": "Extension/Microsoft_Azure_CostManagement/PartType/BudgetsPart"
            }
          },
          {
            "position": {
              "x": 0,
              "y": 4,
              "colSpan": 12,
              "rowSpan": 4
            },
            "metadata": {
              "type": "Extension/Microsoft_Azure_CostManagement/PartType/CostByResourcePart"
            }
          }
        ]
      }
    ]
  }
}
```

---

## Cost Optimization Recommendations

### 1. Right-Size Resources

```bash
# Check resource utilization
az monitor metrics list \
  --resource $RESOURCE_ID \
  --metric "Percentage CPU" \
  --start-time $(date -d "7 days ago" +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date +%Y-%m-%dT%H:%M:%S) \
  --interval PT1H

# If CPU < 30% consistently, consider downsizing
```

### 2. Use Reserved Instances

```bash
# Calculate savings with reserved instances
az consumption reservation recommendation list \
  --resource-group rg-dot-copilot-prod \
  --term P1Y  # 1 year term
```

**Potential Savings:**
- 1-year commitment: 30-40% savings
- 3-year commitment: 50-60% savings

### 3. Auto-Shutdown Dev Resources

```bicep
// Auto-shutdown for dev environment
resource autoShutdown 'Microsoft.DevTestLab/schedules@2018-09-15' = if (environment == 'dev') {
  name: 'shutdown-computevm-${appServicePlan.name}'
  location: location
  properties: {
    status: 'Enabled'
    taskType: 'ComputeVmShutdownTask'
    dailyRecurrence: {
      time: '1900'  // 7 PM
    }
    timeZoneId: 'UTC'
    notificationSettings: {
      status: 'Enabled'
      timeInMinutes: 30
      emailRecipient: alertEmail
    }
    targetResourceId: appServicePlan.id
  }
}
```

### 4. Use Spot Instances (Non-Critical Workloads)

```bicep
// For batch processing or non-critical workloads
resource spotVM 'Microsoft.Compute/virtualMachines@2023-03-01' = {
  name: 'batch-processor'
  properties: {
    priority: 'Spot'
    evictionPolicy: 'Deallocate'
    billingProfile: {
      maxPrice: -1  // Pay up to regular price
    }
  }
}
```

**Savings:** Up to 90% compared to regular VMs

---

## Cost Analysis Queries

### PowerShell Queries

```powershell
# Get cost by resource
Get-AzConsumptionUsageDetail `
  -StartDate (Get-Date).AddDays(-30) `
  -EndDate (Get-Date) `
  | Group-Object InstanceName `
  | Select-Object Name, @{N='Cost';E={($_.Group | Measure-Object -Property PretaxCost -Sum).Sum}} `
  | Sort-Object Cost -Descending

# Get cost by service
Get-AzConsumptionUsageDetail `
  -StartDate (Get-Date).AddDays(-30) `
  -EndDate (Get-Date) `
  | Group-Object ConsumedService `
  | Select-Object Name, @{N='Cost';E={($_.Group | Measure-Object -Property PretaxCost -Sum).Sum}} `
  | Sort-Object Cost -Descending
```

### Azure CLI Queries

```bash
# Cost by resource group
az consumption usage list \
  --start-date $(date -d "30 days ago" +%Y-%m-%d) \
  --end-date $(date +%Y-%m-%d) \
  | jq -r '.[] | "\(.instanceName): $\(.pretaxCost)"' \
  | sort -t$ -k2 -rn

# Daily cost trend
az consumption usage list \
  --start-date $(date -d "30 days ago" +%Y-%m-%d) \
  --end-date $(date +%Y-%m-%d) \
  | jq -r '.[] | "\(.usageStart): $\(.pretaxCost)"' \
  | awk -F: '{sum[$1]+=$2} END {for (date in sum) print date": $"sum[date]}' \
  | sort
```

---

## Cost Breakdown by Service

### Expected Monthly Costs

#### Development Environment (~$50/month)

| Service | SKU | Cost |
|---------|-----|------|
| App Service Plan | B1 | $13 |
| PostgreSQL | B1ms | $12 |
| Storage Account | LRS | $2 |
| Application Insights | Basic | $0 (free tier) |
| Static Web App | Free | $0 |
| **Total** | | **~$27** |

#### Staging Environment (~$75/month)

| Service | SKU | Cost |
|---------|-----|------|
| App Service Plan | B1 | $13 |
| PostgreSQL | B1ms | $12 |
| Storage Account | LRS | $2 |
| Application Insights | Basic | $5 |
| Static Web App | Free | $0 |
| **Total** | | **~$32** |

#### Production Environment (~$300/month)

| Service | SKU | Cost |
|---------|-----|------|
| App Service Plan | P1V2 | $73 |
| PostgreSQL | D2s_v3 | $140 |
| Storage Account | ZRS | $10 |
| Application Insights | Standard | $25 |
| Static Web App | Standard | $9 |
| Key Vault | Standard | $3 |
| Backup Storage | | $10 |
| **Total** | | **~$270** |

---

## Automated Cost Reports

### Daily Cost Report Script

```bash
#!/bin/bash
# scripts/daily-cost-report.sh

ENVIRONMENT="$1"
RESOURCE_GROUP="rg-dot-copilot-${ENVIRONMENT}"
REPORT_DATE=$(date +%Y-%m-%d)

# Get yesterday's cost
YESTERDAY_COST=$(az consumption usage list \
  --start-date $(date -d "yesterday" +%Y-%m-%d) \
  --end-date $(date +%Y-%m-%d) \
  --query "[?resourceGroup=='$RESOURCE_GROUP'].pretaxCost" \
  -o tsv \
  | awk '{sum+=$1} END {print sum}')

# Get month-to-date cost
MTD_COST=$(az consumption usage list \
  --start-date $(date +%Y-%m-01) \
  --end-date $(date +%Y-%m-%d) \
  --query "[?resourceGroup=='$RESOURCE_GROUP'].pretaxCost" \
  -o tsv \
  | awk '{sum+=$1} END {print sum}')

# Get budget
BUDGET=$(az consumption budget show \
  --budget-name "budget-dot-copilot-${ENVIRONMENT}" \
  --query amount \
  -o tsv)

# Calculate percentage
PERCENTAGE=$(echo "scale=2; ($MTD_COST / $BUDGET) * 100" | bc)

# Generate report
cat << EOF
Daily Cost Report - ${ENVIRONMENT}
Date: ${REPORT_DATE}

Yesterday's Cost: \$${YESTERDAY_COST}
Month-to-Date: \$${MTD_COST}
Monthly Budget: \$${BUDGET}
Budget Used: ${PERCENTAGE}%

Top 5 Resources by Cost:
$(az consumption usage list \
  --start-date $(date +%Y-%m-01) \
  --end-date $(date +%Y-%m-%d) \
  --query "[?resourceGroup=='$RESOURCE_GROUP']" \
  | jq -r '.[] | "\(.instanceName): $\(.pretaxCost)"' \
  | sort -t$ -k2 -rn \
  | head -5)
EOF
```

### Schedule with Cron

```bash
# Add to crontab
0 8 * * * /path/to/scripts/daily-cost-report.sh prod | mail -s "Daily Cost Report" team@dotcopilot.com
```

---

## Cost Alerts Integration

### Slack Webhook Integration

```bash
#!/bin/bash
# scripts/send-cost-alert-slack.sh

WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
ENVIRONMENT="$1"
COST="$2"
BUDGET="$3"
PERCENTAGE="$4"

curl -X POST $WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d "{
    \"text\": \"💰 Cost Alert - ${ENVIRONMENT}\",
    \"attachments\": [{
      \"color\": \"warning\",
      \"fields\": [
        {\"title\": \"Current Cost\", \"value\": \"\$${COST}\", \"short\": true},
        {\"title\": \"Budget\", \"value\": \"\$${BUDGET}\", \"short\": true},
        {\"title\": \"Percentage\", \"value\": \"${PERCENTAGE}%\", \"short\": true}
      ]
    }]
  }"
```

---

## Best Practices

### 1. Tag All Resources

```bicep
var commonTags = {
  Environment: environment
  Application: 'dot-copilot'
  CostCenter: 'engineering'
  Owner: 'infrastructure-team'
  ManagedBy: 'bicep'
}

resource appService 'Microsoft.Web/sites@2022-09-01' = {
  name: appServiceName
  tags: commonTags
  // ...
}
```

### 2. Review Costs Weekly

```bash
# Weekly cost review
./scripts/weekly-cost-review.sh prod
```

### 3. Set Up Anomaly Detection

```bash
# Enable cost anomaly detection
az consumption budget create \
  --budget-name "anomaly-detection-prod" \
  --amount 300 \
  --category Cost \
  --time-grain Monthly \
  --notifications \
    Enabled=true \
    Operator=GreaterThan \
    Threshold=120 \
    ContactEmails="[alerts@dotcopilot.com]"
```

### 4. Use Cost Analysis

- Review Azure Cost Analysis weekly
- Identify cost trends
- Optimize high-cost resources
- Consider reserved instances

---

## Troubleshooting

### Budget Not Triggering Alerts

**Check:**
1. Budget is enabled
2. Email addresses are correct
3. Threshold is set correctly
4. Resource group filter is correct

```bash
# Verify budget
az consumption budget show \
  --budget-name "budget-dot-copilot-prod"
```

### Cost Higher Than Expected

**Investigate:**
1. Check for unexpected resources
2. Review resource SKUs
3. Check for data transfer costs
4. Review backup storage costs

```bash
# List all resources and costs
az consumption usage list \
  --start-date $(date -d "7 days ago" +%Y-%m-%d) \
  --end-date $(date +%Y-%m-%d) \
  | jq -r '.[] | "\(.instanceName): $\(.pretaxCost)"' \
  | sort -t$ -k2 -rn
```

---

## References

- [Azure Cost Management](https://docs.microsoft.com/en-us/azure/cost-management-billing/)
- [Azure Budgets](https://docs.microsoft.com/en-us/azure/cost-management-billing/costs/tutorial-acm-create-budgets)
- [Cost Optimization](https://docs.microsoft.com/en-us/azure/architecture/framework/cost/)

---

**Status:** Configuration Guide  
**Last Updated:** 2025-12-15  
**Action Required:** Set up budgets and alerts for each environment
