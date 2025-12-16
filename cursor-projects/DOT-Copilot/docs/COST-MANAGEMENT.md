# Azure Cost Management Guide

Configuration and monitoring for Azure infrastructure costs.

## Budget Configuration

### Monthly Budget Limits

| Environment | Budget | Alert Thresholds |
|------------|--------|------------------|
| Development | $50 | 50%, 75%, 90%, 100% |
| Staging | $80 | 50%, 75%, 90%, 100% |
| Production | $350 | 50%, 75%, 90%, 100% |

### Setup Cost Alerts

```bash
# Set environment variables
export RESOURCE_GROUP="dot-copilot-prod-rg"
export MONTHLY_BUDGET=350
export ALERT_EMAILS="admin@example.com,devops@example.com"
export ENVIRONMENT="prod"

# Run setup script
./infrastructure/scripts/setup-cost-alerts.sh
```

## Cost Breakdown by Service

### Development Environment (~$30-50/month)

- **App Service Plan (B1)**: $13/month
- **PostgreSQL (Burstable B1ms)**: $12/month
- **Application Insights**: $5/month (1GB daily cap)
- **Storage Account**: $5/month
- **Networking**: $5/month

### Production Environment (~$250-350/month)

- **App Service Plan (S1)**: $70/month
- **PostgreSQL (General Purpose D2s_v3)**: $140/month
- **Application Insights**: $50/month (5GB daily cap)
- **Storage Account**: $20/month
- **Azure CDN**: $30/month
- **Networking**: $40/month

## Cost Optimization

### Application Insights

Reduce telemetry ingestion costs:

```typescript
// backend/src/config/appInsights.ts
export const appInsightsConfig = {
  samplingPercentage: 50, // Sample 50% of telemetry
  maxBatchSize: 100,
  maxBatchIntervalMs: 15000,
  disableAjaxTracking: false,
  disableFetchTracking: false,
  enableAutoRouteTracking: true
};
```

### Database Optimization

- Enable connection pooling (max 20 connections)
- Set appropriate backup retention (7 days dev, 35 days prod)
- Use read replicas only when needed
- Enable auto-grow storage with limits

### Storage Optimization

Enable lifecycle management:

```bash
az storage account management-policy create \
  --account-name dotcopilotprod \
  --policy @storage-lifecycle-policy.json
```

### Auto-Scaling Configuration

```bicep
resource autoScaleSettings 'Microsoft.Insights/autoscalesettings@2022-10-01' = {
  name: '${appName}-autoscale-${environment}'
  properties: {
    enabled: true
    targetResourceUri: appServicePlan.id
    profiles: [{
      name: 'Auto scale based on CPU'
      capacity: {
        minimum: '1'
        maximum: '3'
        default: '1'
      }
      rules: [{
        metricTrigger: {
          metricName: 'CpuPercentage'
          operator: 'GreaterThan'
          threshold: 70
          timeAggregation: 'Average'
          timeWindow: 'PT5M'
        }
        scaleAction: {
          direction: 'Increase'
          type: 'ChangeCount'
          value: '1'
          cooldown: 'PT5M'
        }
      }]
    }]
  }
}
```

## Cost Monitoring

### Azure CLI Queries

View current month costs:

```bash
az consumption usage list \
  --start-date $(date -d "$(date +%Y-%m-01)" +%Y-%m-%d) \
  --end-date $(date +%Y-%m-%d) \
  --query "[].{Service:meterCategory, Cost:pretaxCost}" \
  --output table
```

View budget status:

```bash
az consumption budget list \
  --resource-group dot-copilot-prod-rg \
  --output table
```

### Azure Portal Links

- **Cost Analysis**: https://portal.azure.com/#blade/Microsoft_Azure_CostManagement/Menu/costanalysis
- **Budgets**: https://portal.azure.com/#blade/Microsoft_Azure_CostManagement/Menu/budgets
- **Advisor Recommendations**: https://portal.azure.com/#blade/Microsoft_Azure_Expert/AdvisorMenuBlade/Cost

### Cost Anomaly Detection

Azure automatically detects cost anomalies. Configure notifications:

```bash
az monitor metrics alert create \
  --name cost-anomaly-alert \
  --resource-group dot-copilot-prod-rg \
  --scopes /subscriptions/{subscription-id}/resourceGroups/dot-copilot-prod-rg \
  --condition "total cost > dynamic threshold" \
  --window-size 1d \
  --evaluation-frequency 1h
```

## Cost Reduction Checklist

### Monthly Review

- [ ] Review top 5 most expensive resources
- [ ] Check for unused resources (stopped VMs, orphaned disks)
- [ ] Verify auto-scaling is working correctly
- [ ] Review Application Insights sampling rate
- [ ] Check database connection pool utilization
- [ ] Review storage account lifecycle policies
- [ ] Verify backup retention periods are appropriate
- [ ] Check for idle App Service Plans

### Quarterly Review

- [ ] Evaluate reserved instance opportunities
- [ ] Review and optimize database SKU
- [ ] Assess CDN usage and caching effectiveness
- [ ] Review cross-region data transfer costs
- [ ] Evaluate Azure Advisor recommendations
- [ ] Consider spot instances for non-critical workloads

## Alert Configuration

### Budget Alert Thresholds

Alerts are sent when costs exceed:

1. **50% of budget** (Warning)
   - Review current spending trends
   - Identify any unexpected cost increases

2. **75% of budget** (High Priority)
   - Investigate cost drivers
   - Consider temporary cost reduction measures

3. **90% of budget** (Critical)
   - Implement immediate cost controls
   - Notify stakeholders
   - Review and adjust budget if needed

4. **100% of budget** (Forecasted)
   - Projected to exceed budget by month end
   - Take preventive action

### Email Notifications

Configure multiple recipients:

```bash
export ALERT_EMAILS="admin@example.com,finance@example.com,devops@example.com"
```

## Cost Allocation Tags

Tag resources for cost tracking:

```bicep
tags: {
  Environment: environment
  Application: appName
  CostCenter: 'Engineering'
  Owner: 'DevOps Team'
  Project: 'DOT-Copilot'
}
```

Query costs by tag:

```bash
az consumption usage list \
  --start-date $(date -d "$(date +%Y-%m-01)" +%Y-%m-%d) \
  --end-date $(date +%Y-%m-%d) \
  --query "[?tags.Project=='DOT-Copilot'].{Service:meterCategory, Cost:pretaxCost}" \
  --output table
```

## Troubleshooting

### High Application Insights Costs

1. Check sampling rate: Should be 50% for production
2. Review daily cap: Set to 5GB for production
3. Disable verbose logging
4. Reduce custom event tracking

### High Database Costs

1. Verify SKU is appropriate for workload
2. Check backup retention period
3. Review connection pool settings
4. Consider read replicas only if needed

### High Storage Costs

1. Enable lifecycle management
2. Move old data to cool/archive tiers
3. Delete unused snapshots and backups
4. Review blob access patterns

### Unexpected Cost Spikes

1. Check Azure Cost Management for anomalies
2. Review recent deployments or configuration changes
3. Verify auto-scaling is not over-provisioning
4. Check for DDoS attacks or unusual traffic patterns

## References

- [Azure Cost Management Documentation](https://docs.microsoft.com/azure/cost-management-billing/)
- [Azure Pricing Calculator](https://azure.microsoft.com/pricing/calculator/)
- [Azure Advisor](https://docs.microsoft.com/azure/advisor/)
- [Cost Optimization Best Practices](https://docs.microsoft.com/azure/architecture/framework/cost/)
