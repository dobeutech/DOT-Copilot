# Azure Deployment Guide

This guide covers deploying DOT Copilot to Microsoft Azure.

## Prerequisites

- Azure subscription
- Azure CLI installed and configured
- Bicep CLI installed (`az bicep install`)
- Node.js 20+ installed locally
- Git repository access

## Quick Start

### 1. Install Prerequisites

```bash
# Install Azure CLI
# Windows: https://aka.ms/installazurecliwindows
# macOS: brew install azure-cli
# Linux: curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login to Azure
az login

# Install Bicep
az bicep install
```

### 2. Create Resource Group

```bash
az group create \
  --name rg-dot-copilot-prod \
  --location eastus
```

### 3. Deploy Infrastructure

#### Using PowerShell:

```powershell
.\infrastructure\azure\deploy.ps1 `
  -ResourceGroupName "rg-dot-copilot-prod" `
  -Location "eastus" `
  -Environment "prod" `
  -DbAdminUsername "postgresadmin" `
  -DbAdminPassword (ConvertTo-SecureString "YourSecurePassword123!" -AsPlainText -Force) `
  -JwtSecret (ConvertTo-SecureString "your-32-character-jwt-secret-minimum" -AsPlainText -Force) `
  -JwtRefreshSecret (ConvertTo-SecureString "your-32-character-refresh-secret" -AsPlainText -Force)
```

#### Using Bash:

```bash
chmod +x infrastructure/azure/deploy.sh
./infrastructure/azure/deploy.sh \
  rg-dot-copilot-prod \
  eastus \
  prod \
  postgresadmin \
  "YourSecurePassword123!" \
  "your-32-character-jwt-secret-minimum" \
  "your-32-character-refresh-secret"
```

### 4. Configure Application Settings

After deployment, configure additional settings in Azure Portal:

1. **Backend App Service** → Configuration → Application settings:
   - `SMTP_HOST` - Your email server
   - `SMTP_PORT` - Email server port
   - `SMTP_USER` - Email username
   - `SMTP_PASS` - Email password (stored in Key Vault)
   - `EMAIL_FROM` - Sender email address
   - `SENTRY_DSN` - Sentry error tracking (optional)

2. **Key Vault** - Store sensitive values:
   - Add secrets for SMTP credentials
   - Reference in App Service: `@Microsoft.KeyVault(SecretUri=https://your-kv.vault.azure.net/secrets/SECRET-NAME/)`

### 5. Deploy Application Code

#### Option A: Using GitHub Actions (Recommended)

1. Set up Azure Service Principal:
```bash
az ad sp create-for-rbac \
  --name "dot-copilot-deploy" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/rg-dot-copilot-prod \
  --sdk-auth
```

2. Add to GitHub Secrets:
   - `AZURE_CREDENTIALS` - Output from above command
   - `DATABASE_URL` - PostgreSQL connection string
   - `API_BASE_URL` - Backend API URL

3. Push to main branch or trigger workflow manually

#### Option B: Using Azure CLI

```bash
# Backend
cd backend
az webapp up \
  --name dot-copilot-backend-prod \
  --resource-group rg-dot-copilot-prod \
  --runtime "NODE:20-lts" \
  --startup-file "npm start"

# Frontend
cd ../frontend
npm run build
az webapp up \
  --name dot-copilot-frontend-prod \
  --resource-group rg-dot-copilot-prod \
  --runtime "NODE:20-lts" \
  --startup-file "npx serve -s dist -l 80"
```

#### Option C: Using VS Code Azure Extension

1. Install "Azure App Service" extension
2. Right-click on `backend` folder → Deploy to Web App
3. Right-click on `frontend/dist` folder → Deploy to Web App

### 6. Run Database Migrations

```bash
# Connect to backend App Service
az webapp ssh --name dot-copilot-backend-prod --resource-group rg-dot-copilot-prod

# Inside the container
cd /home/site/wwwroot
npx prisma migrate deploy
npx prisma db seed  # Optional: seed initial data
```

### 7. Configure Custom Domain (Optional)

```bash
# Add custom domain
az webapp config hostname add \
  --webapp-name dot-copilot-frontend-prod \
  --resource-group rg-dot-copilot-prod \
  --hostname app.yourdomain.com

# Configure SSL
az webapp config ssl bind \
  --name dot-copilot-frontend-prod \
  --resource-group rg-dot-copilot-prod \
  --certificate-thumbprint {thumbprint} \
  --ssl-type SNI
```

## Infrastructure Components

### App Service Plan
- **Dev/Staging**: Basic B1 (1 core, 1.75GB RAM)
- **Production**: PremiumV2 P1V2 (2 cores, 3.5GB RAM)

### Azure Database for PostgreSQL
- **Dev/Staging**: Burstable B1ms (1 vCore, 2GB RAM, 32GB storage)
- **Production**: General Purpose D2s_v3 (2 vCores, 8GB RAM, 128GB storage)
- **Backup**: 7-day retention, geo-redundant in production

### Azure Blob Storage
- **Dev/Staging**: Standard LRS
- **Production**: Standard ZRS (zone-redundant)

### Azure Key Vault
- Stores sensitive configuration (JWT secrets, database passwords)
- Integrated with App Service for secure secret retrieval

### Application Insights
- Performance monitoring
- Error tracking
- Request analytics
- Custom metrics

## Environment Variables

### Backend App Service

| Variable | Source | Description |
|----------|--------|-------------|
| `NODE_ENV` | Bicep | Environment (production/development) |
| `DATABASE_URL` | Bicep | PostgreSQL connection string |
| `JWT_SECRET` | Key Vault | JWT signing secret |
| `JWT_REFRESH_SECRET` | Key Vault | Refresh token secret |
| `FRONTEND_URL` | Bicep | Frontend application URL |
| `AZURE_STORAGE_CONNECTION_STRING` | Bicep | Blob storage connection |
| `AZURE_STORAGE_CONTAINER` | Bicep | Storage container name |
| `APPINSIGHTS_INSTRUMENTATIONKEY` | Bicep | Application Insights key |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | Bicep | App Insights connection |

### Frontend App Service

| Variable | Source | Description |
|----------|--------|-------------|
| `VITE_API_BASE_URL` | Bicep | Backend API URL |

## Monitoring

### Application Insights

Access Application Insights in Azure Portal:
- **Metrics**: Response times, request rates, error rates
- **Failures**: Exception tracking and stack traces
- **Performance**: Slow requests and dependencies
- **Live Metrics**: Real-time application health

### Health Checks

Configure App Service health checks:
```bash
az webapp config set \
  --name dot-copilot-backend-prod \
  --resource-group rg-dot-copilot-prod \
  --generic-configurations '{"healthCheckPath": "/health/ready"}'
```

### Log Streaming

```bash
# Stream application logs
az webapp log tail \
  --name dot-copilot-backend-prod \
  --resource-group rg-dot-copilot-prod
```

## Scaling

### Manual Scaling

```bash
# Scale App Service Plan
az appservice plan update \
  --name asp-dot-copilot-prod \
  --resource-group rg-dot-copilot-prod \
  --sku P2V2  # 4 cores, 7GB RAM
```

### Auto-scaling

Configure in Azure Portal:
1. App Service Plan → Scale out
2. Enable auto-scale
3. Set min/max instances
4. Configure scale rules (CPU, memory, HTTP queue length)

## Backup and Recovery

### Database Backups

- Automatic daily backups (7-day retention)
- Point-in-time restore available
- Geo-redundant backups in production

### Application Backups

```bash
# Enable backup
az webapp config backup update \
  --name dot-copilot-backend-prod \
  --resource-group rg-dot-copilot-prod \
  --backup-name daily-backup \
  --frequency 1d \
  --retention 30 \
  --storage-account-url https://yourstorageaccount.blob.core.windows.net/backups
```

## Cost Optimization

### Development/Staging
- Use Basic tier App Service Plan
- Burstable database tier
- Standard LRS storage
- Disable geo-redundant backups

### Production
- Start with PremiumV2 P1V2, scale as needed
- Use reserved instances for 1-3 year savings
- Enable auto-scaling to reduce costs during low traffic
- Use Application Insights sampling (10% in production)

## Troubleshooting

### Application Won't Start

1. Check logs:
```bash
az webapp log tail --name dot-copilot-backend-prod --resource-group rg-dot-copilot-prod
```

2. Check Application Insights for errors
3. Verify environment variables are set correctly
4. Check database connectivity

### Database Connection Issues

1. Verify firewall rules allow Azure services
2. Check connection string format
3. Verify SSL mode is set to `require`
4. Test connection from App Service SSH

### File Upload Issues

1. Verify Azure Storage connection string
2. Check container exists and has correct permissions
3. Verify CORS settings if accessing from frontend
4. Check storage account quota

## Security Best Practices

1. **Enable HTTPS only** (configured in Bicep)
2. **Use Key Vault** for all secrets
3. **Enable managed identity** for App Service
4. **Configure firewall rules** for database
5. **Enable Application Insights** for security monitoring
6. **Regular security updates** via Azure Update Management
7. **Enable DDoS protection** for production
8. **Use Private Endpoints** for database (production)

## Next Steps

- [ ] Set up custom domain and SSL
- [ ] Configure auto-scaling rules
- [ ] Set up alerting in Application Insights
- [ ] Configure backup retention policies
- [ ] Set up staging environment
- [ ] Configure CI/CD pipeline
- [ ] Enable Application Insights profiling
- [ ] Set up Azure Monitor dashboards

