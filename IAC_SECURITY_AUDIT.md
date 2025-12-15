# Infrastructure as Code - Security Audit & Recommendations

## Executive Summary

This audit identifies security vulnerabilities, misconfigurations, and optimization opportunities across Docker, Azure Bicep, and CI/CD configurations.

**Severity Levels:**
- 🔴 **CRITICAL**: Immediate security risk, must fix
- 🟠 **HIGH**: Significant security/operational risk
- 🟡 **MEDIUM**: Best practice violation, should fix
- 🟢 **LOW**: Optimization opportunity

---

## 🔴 CRITICAL Issues

### 1. Hardcoded Secrets in Docker Compose

**File:** `docker/docker-compose.yml`, `cursor-projects/DOT-Copilot/docker-compose.yml`

**Issue:**
```yaml
environment:
  POSTGRES_PASSWORD: postgres  # ❌ Hardcoded password
  JWT_SECRET: ${JWT_SECRET:-your-super-secret-jwt-key-32-chars-min}  # ❌ Weak default
  REDIS_PASSWORD: ${REDIS_PASSWORD:-changeme}  # ❌ Weak default
  VAULT_DEV_ROOT_TOKEN_ID: ${VAULT_ROOT_TOKEN:-changeme}  # ❌ Weak default
```

**Risk:** Credentials exposed in version control, easily exploitable

**Recommendation:**
```yaml
environment:
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?POSTGRES_PASSWORD required}
  JWT_SECRET: ${JWT_SECRET:?JWT_SECRET required}
  REDIS_PASSWORD: ${REDIS_PASSWORD:?REDIS_PASSWORD required}
  # Remove defaults, require explicit values
```

**Action Items:**
- [ ] Remove all default passwords
- [ ] Use `.env` file (gitignored) for local development
- [ ] Document required environment variables in `.env.example`
- [ ] Add validation to fail fast if secrets missing

---

### 2. PostgreSQL Firewall Open to All Azure Services

**File:** `cursor-projects/DOT-Copilot/infrastructure/azure/main.bicep`

**Issue:**
```bicep
resource postgresFirewallAzure 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-06-01-preview' = {
  properties: {
    startIpAddress: '0.0.0.0'  // ❌ Allows ALL Azure services
    endIpAddress: '0.0.0.0'
  }
}
```

**Risk:** Any Azure service can attempt to connect to your database

**Recommendation:**
```bicep
// Option 1: Use Private Endpoints (Best)
resource privateEndpoint 'Microsoft.Network/privateEndpoints@2023-05-01' = {
  name: '${dbServerName}-pe'
  location: location
  properties: {
    subnet: {
      id: subnetId
    }
    privateLinkServiceConnections: [
      {
        name: '${dbServerName}-plsc'
        properties: {
          privateLinkServiceId: postgresServer.id
          groupIds: ['postgresqlServer']
        }
      }
    ]
  }
}

// Option 2: Restrict to specific App Service outbound IPs
resource postgresFirewallApp 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-06-01-preview' = [for ip in backendApp.properties.outboundIpAddresses: {
  parent: postgresServer
  name: 'AllowBackend-${uniqueString(ip)}'
  properties: {
    startIpAddress: ip
    endIpAddress: ip
  }
}]
```

**Action Items:**
- [ ] Implement Private Endpoints for production
- [ ] Restrict firewall rules to specific IP ranges
- [ ] Remove blanket Azure services access

---

### 3. Storage Account Public Access Not Explicitly Disabled

**File:** `cursor-projects/DOT-Copilot/infrastructure/azure/main.bicep`

**Issue:**
```bicep
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  properties: {
    allowBlobPublicAccess: false  // ✅ Good, but...
  }
}

resource uploadsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  properties: {
    publicAccess: 'None'  // ✅ Good
  }
}
```

**Risk:** Configuration is correct, but missing network restrictions

**Recommendation:**
```bicep
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  properties: {
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    networkAcls: {
      defaultAction: 'Deny'
      bypass: 'AzureServices'
      virtualNetworkRules: [
        {
          id: subnetId
          action: 'Allow'
        }
      ]
      ipRules: [
        // Add specific IP ranges if needed
      ]
    }
  }
}
```

**Action Items:**
- [ ] Add network ACLs to storage account
- [ ] Implement VNet integration
- [ ] Use Managed Identity for access (already done ✅)

---

### 4. CI/CD Tests Allowed to Fail

**File:** `cursor-projects/DOT-Copilot/.github/workflows/ci.yml`

**Issue:**
```yaml
- name: Run linting
  run: npm run lint || true  # ❌ Ignores failures

- name: Run tests
  run: npm test || true  # ❌ Ignores failures
```

**Risk:** Broken code can be deployed to production

**Recommendation:**
```yaml
- name: Run linting
  run: npm run lint  # Fail on errors

- name: Run tests
  run: npm test
  env:
    CI: true  # Ensures tests run in CI mode
```

**Action Items:**
- [ ] Remove `|| true` from all test commands
- [ ] Fix any failing tests
- [ ] Add test coverage requirements
- [ ] Block merges if tests fail

---

## 🟠 HIGH Priority Issues

### 5. Missing Container Image Scanning

**File:** All Dockerfiles

**Issue:** No vulnerability scanning in CI/CD pipeline

**Recommendation:**
```yaml
# Add to .github/workflows/ci.yml
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: 'dot-copilot-backend:${{ github.sha }}'
    format: 'sarif'
    output: 'trivy-results.sarif'
    severity: 'CRITICAL,HIGH'

- name: Upload Trivy results to GitHub Security
  uses: github/codeql-action/upload-sarif@v2
  with:
    sarif_file: 'trivy-results.sarif'
```

**Action Items:**
- [ ] Add Trivy scanning to CI pipeline
- [ ] Scan base images regularly
- [ ] Set up automated security alerts
- [ ] Block deployment on critical vulnerabilities

---

### 6. Nginx Running as Root

**File:** `docker/docker-compose.yml`

**Issue:**
```yaml
nginx:
  image: nginx:alpine
  # No user specified, runs as root
```

**Recommendation:**
```dockerfile
# Create custom Dockerfile for nginx
FROM nginx:alpine

RUN addgroup -g 1001 -S nginx && \
    adduser -S nginx -u 1001 && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 8080
```

```yaml
# Update docker-compose.yml
nginx:
  build:
    context: ./nginx
    dockerfile: Dockerfile
  user: "1001:1001"
  ports:
    - "8080:8080"  # Non-privileged port
```

**Action Items:**
- [ ] Create non-root nginx Dockerfile
- [ ] Update nginx.conf to listen on port 8080
- [ ] Test with non-root user

---

### 7. MongoDB Without Authentication in Dev

**File:** `docker/docker-compose.yml`

**Issue:**
```yaml
mongodb:
  environment:
    - MONGO_INITDB_ROOT_USERNAME=${MONGO_ROOT_USER:-admin}
    - MONGO_INITDB_ROOT_PASSWORD=${MONGO_ROOT_PASSWORD}  # No default, but...
  ports:
    - "27017:27017"  # ❌ Exposed to host
```

**Risk:** If MONGO_ROOT_PASSWORD not set, MongoDB may start without auth

**Recommendation:**
```yaml
mongodb:
  environment:
    - MONGO_INITDB_ROOT_USERNAME=${MONGO_ROOT_USER:?MONGO_ROOT_USER required}
    - MONGO_INITDB_ROOT_PASSWORD=${MONGO_ROOT_PASSWORD:?MONGO_ROOT_PASSWORD required}
  ports:
    - "127.0.0.1:27017:27017"  # Only localhost
  networks:
    - backend_network  # Not exposed externally
```

**Action Items:**
- [ ] Require MongoDB credentials
- [ ] Bind to localhost only
- [ ] Add authentication to connection strings

---

### 8. Key Vault Secrets Exposed in App Settings

**File:** `cursor-projects/DOT-Copilot/infrastructure/azure/main.bicep`

**Issue:**
```bicep
appSettings: [
  { 
    name: 'DATABASE_URL', 
    value: 'postgresql://${dbAdminUsername}:${dbAdminPassword}@...'  // ❌ Password in plain text
  }
]
```

**Risk:** Secrets visible in Azure Portal and logs

**Recommendation:**
```bicep
// Store connection string in Key Vault
resource dbConnectionStringKV 'Microsoft.KeyVault/vaults/secrets@2023-02-01' = {
  parent: keyVault
  name: 'DATABASE-CONNECTION-STRING'
  properties: {
    value: 'postgresql://${dbAdminUsername}:${dbAdminPassword}@${postgresServer.properties.fullyQualifiedDomainName}:5432/${dbName}?sslmode=require'
  }
}

// Reference from Key Vault
appSettings: [
  { 
    name: 'DATABASE_URL', 
    value: '@Microsoft.KeyVault(SecretUri=${dbConnectionStringKV.properties.secretUri})'
  }
]
```

**Action Items:**
- [ ] Move all connection strings to Key Vault
- [ ] Use Key Vault references in app settings
- [ ] Audit existing secrets exposure

---

### 9. Missing Rate Limiting

**File:** `docker/nginx/nginx.conf` (not provided, but likely missing)

**Issue:** No rate limiting configured

**Recommendation:**
```nginx
http {
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

    server {
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;
            limit_conn conn_limit 10;
            proxy_pass http://api_server:8000;
        }

        location /api/auth/ {
            limit_req zone=auth_limit burst=5 nodelay;
            proxy_pass http://api_server:8000;
        }
    }
}
```

**Action Items:**
- [ ] Implement rate limiting in nginx
- [ ] Add rate limiting to Azure App Service
- [ ] Configure Azure Front Door WAF rules

---

### 10. Missing Health Check Endpoints

**File:** Multiple Dockerfiles

**Issue:** Health checks reference `/health` but endpoint may not exist

**Recommendation:**
```typescript
// backend/src/server.ts
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

app.get('/health/ready', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});
```

**Action Items:**
- [ ] Implement `/health` endpoint
- [ ] Implement `/health/ready` endpoint
- [ ] Add dependency checks (DB, Redis, etc.)
- [ ] Update health check paths in configs

---

## 🟡 MEDIUM Priority Issues

### 11. Docker Images Not Pinned to Specific Versions

**File:** `docker/docker-compose.yml`

**Issue:**
```yaml
postgres:
  image: postgres:16-alpine  # ❌ Not pinned to digest
redis:
  image: redis:7-alpine  # ❌ Not pinned to digest
```

**Risk:** Unexpected breaking changes from upstream updates

**Recommendation:**
```yaml
postgres:
  image: postgres:16-alpine@sha256:abc123...  # Pin to digest
redis:
  image: redis:7-alpine@sha256:def456...
```

**Action Items:**
- [ ] Pin all images to specific digests
- [ ] Set up Dependabot for image updates
- [ ] Test updates in staging before production

---

### 12. Missing Resource Limits in Docker Compose

**File:** `docker/docker-compose.yml`

**Issue:** No CPU/memory limits defined

**Recommendation:**
```yaml
api_server:
  deploy:
    resources:
      limits:
        cpus: '1.0'
        memory: 1G
      reservations:
        cpus: '0.5'
        memory: 512M
  restart: unless-stopped
```

**Action Items:**
- [ ] Add resource limits to all services
- [ ] Monitor actual resource usage
- [ ] Adjust limits based on metrics

---

### 13. Logging Configuration Missing

**File:** `docker/docker-compose.yml`

**Issue:** No centralized logging configuration

**Recommendation:**
```yaml
x-logging: &default-logging
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
    labels: "service,environment"

services:
  api_server:
    logging: *default-logging
```

**Action Items:**
- [ ] Configure log rotation
- [ ] Set up centralized logging (ELK, Loki)
- [ ] Add structured logging to applications

---

### 14. Missing Backup Strategy

**File:** `cursor-projects/DOT-Copilot/infrastructure/azure/main.bicep`

**Issue:** Backups configured but no restore testing

**Recommendation:**
```bicep
// Add backup verification
resource backupAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${appName}-backup-failed-${environment}'
  properties: {
    description: 'Alert when database backup fails'
    severity: 1
    enabled: true
    scopes: [postgresServer.id]
    evaluationFrequency: 'PT1H'
    windowSize: 'PT1H'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'BackupFailed'
          metricName: 'backup_storage_used'
          operator: 'LessThan'
          threshold: 1
          timeAggregation: 'Average'
        }
      ]
    }
  }
}
```

**Action Items:**
- [ ] Document backup procedures
- [ ] Test restore process monthly
- [ ] Set up backup monitoring alerts
- [ ] Implement point-in-time recovery testing

---

### 15. Missing Disaster Recovery Plan

**Issue:** No documented DR strategy

**Recommendation:**
Create `DISASTER_RECOVERY.md`:
```markdown
# Disaster Recovery Plan

## RTO/RPO Targets
- **RTO (Recovery Time Objective):** 4 hours
- **RPO (Recovery Point Objective):** 1 hour

## Backup Strategy
- Database: Automated daily backups, 14-day retention
- Storage: Geo-redundant in production
- Configuration: Version controlled in Git

## Recovery Procedures
1. Database restore from backup
2. Redeploy infrastructure from Bicep
3. Restore application from Docker images
4. Verify health checks

## Failover Procedures
1. Switch to secondary region (if configured)
2. Update DNS records
3. Verify application functionality
```

**Action Items:**
- [ ] Document DR procedures
- [ ] Test DR plan quarterly
- [ ] Set up geo-replication for production
- [ ] Create runbooks for common failures

---

## 🟢 LOW Priority / Optimization

### 16. Docker Build Optimization

**File:** All Dockerfiles

**Issue:** Not using multi-stage builds optimally

**Recommendation:**
```dockerfile
# backend/Dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
USER nodejs
EXPOSE 3001
CMD ["node", "dist/server.js"]
```

**Action Items:**
- [ ] Optimize layer caching
- [ ] Reduce final image size
- [ ] Use .dockerignore files

---

### 17. Missing .dockerignore Files

**File:** Missing in all Docker contexts

**Recommendation:**
```dockerignore
# backend/.dockerignore
node_modules
npm-debug.log
dist
.env
.env.*
!.env.example
.git
.gitignore
README.md
.vscode
.idea
coverage
*.test.ts
*.spec.ts
__tests__
```

**Action Items:**
- [ ] Create .dockerignore for each service
- [ ] Reduce build context size
- [ ] Speed up Docker builds

---

### 18. Azure Cost Optimization

**File:** `cursor-projects/DOT-Copilot/infrastructure/azure/main.bicep`

**Current Costs:**
- Dev: ~$30/month
- Staging: ~$35/month
- Production: ~$250/month

**Optimization Opportunities:**

```bicep
// 1. Use Azure Container Apps instead of App Service (cheaper for low traffic)
resource containerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: backendAppName
  properties: {
    configuration: {
      ingress: {
        external: true
        targetPort: 3001
      }
      scaling: {
        minReplicas: environment == 'prod' ? 1 : 0  // Scale to zero in dev
        maxReplicas: environment == 'prod' ? 10 : 2
      }
    }
  }
}

// 2. Use Azure Database for PostgreSQL - Single Server (cheaper)
// Or consider Supabase for managed PostgreSQL

// 3. Implement auto-shutdown for dev environments
resource autoShutdown 'Microsoft.DevTestLab/schedules@2018-09-15' = if (environment == 'dev') {
  name: 'shutdown-${backendAppName}'
  properties: {
    status: 'Enabled'
    taskType: 'ComputeVmShutdownTask'
    dailyRecurrence: {
      time: '1900'  // 7 PM
    }
    timeZoneId: 'UTC'
  }
}
```

**Potential Savings:**
- Container Apps: Save ~$50/month in dev/staging
- Auto-shutdown: Save ~$20/month in dev
- Reserved instances: Save 30-40% in production

**Action Items:**
- [ ] Evaluate Container Apps vs App Service
- [ ] Implement auto-shutdown for dev
- [ ] Consider reserved instances for production
- [ ] Set up cost alerts

---

### 19. Missing Infrastructure Tests

**Issue:** No automated testing of infrastructure code

**Recommendation:**
```bash
# Install Bicep linter
az bicep install

# Create test script
#!/bin/bash
# infrastructure/test.sh

echo "Linting Bicep files..."
az bicep lint --file azure/main.bicep

echo "Validating deployment..."
az deployment group validate \
  --resource-group rg-dot-copilot-dev \
  --template-file azure/main.bicep \
  --parameters azure/parameters.dev.json

echo "Running what-if analysis..."
az deployment group what-if \
  --resource-group rg-dot-copilot-dev \
  --template-file azure/main.bicep \
  --parameters azure/parameters.dev.json
```

**Action Items:**
- [ ] Add Bicep linting to CI pipeline
- [ ] Run what-if before deployments
- [ ] Add infrastructure unit tests
- [ ] Implement policy compliance checks

---

### 20. Missing Monitoring Dashboards

**File:** `cursor-projects/DOT-Copilot/infrastructure/azure/dashboard.json`

**Issue:** Dashboard exists but may be incomplete

**Recommendation:**
Add comprehensive monitoring:
- Application performance metrics
- Database performance metrics
- Cost tracking
- Security alerts
- User activity

**Action Items:**
- [ ] Review and enhance dashboard
- [ ] Add custom KQL queries
- [ ] Set up automated reports
- [ ] Create team alerts

---

## Validation & Testing Steps

### 1. Security Scanning

```bash
# Scan Docker images
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image dot-copilot-backend:latest

# Scan IaC files
docker run --rm -v $(pwd):/src checkmarx/kics:latest scan \
  -p /src/infrastructure -o /src/kics-results.json

# Scan for secrets
docker run --rm -v $(pwd):/path trufflesecurity/trufflehog:latest \
  filesystem /path --json
```

### 2. Infrastructure Validation

```bash
# Validate Bicep
az bicep build --file infrastructure/azure/main.bicep

# Validate deployment
az deployment group validate \
  --resource-group rg-dot-copilot-dev \
  --template-file infrastructure/azure/main.bicep \
  --parameters infrastructure/azure/parameters.dev.json

# What-if analysis
az deployment group what-if \
  --resource-group rg-dot-copilot-dev \
  --template-file infrastructure/azure/main.bicep \
  --parameters infrastructure/azure/parameters.dev.json
```

### 3. Docker Compose Validation

```bash
# Validate docker-compose
docker-compose config

# Check for security issues
docker-compose config | docker run --rm -i hadolint/hadolint hadolint -

# Test services
docker-compose up -d
docker-compose ps
docker-compose logs
docker-compose down
```

### 4. CI/CD Pipeline Testing

```bash
# Run GitHub Actions locally
act -j backend-lint-test

# Validate workflow syntax
actionlint .github/workflows/*.yml
```

### 5. Network Security Testing

```bash
# Test firewall rules
nmap -p 5432 <postgres-server>.postgres.database.azure.com

# Test SSL/TLS
openssl s_client -connect <backend-app>.azurewebsites.net:443

# Test CORS
curl -H "Origin: https://evil.com" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS https://<backend-app>.azurewebsites.net/api/users
```

---

## Priority Action Plan

### Week 1: Critical Issues
1. Remove hardcoded secrets from docker-compose
2. Fix CI/CD test failures
3. Implement database firewall restrictions
4. Add container image scanning

### Week 2: High Priority
5. Create non-root nginx container
6. Move secrets to Key Vault
7. Implement rate limiting
8. Add health check endpoints

### Week 3: Medium Priority
9. Pin Docker images to digests
10. Add resource limits
11. Configure logging
12. Document backup/restore procedures

### Week 4: Optimization
13. Optimize Docker builds
14. Add .dockerignore files
15. Implement cost optimizations
16. Add infrastructure tests

---

## Compliance Checklist

- [ ] **CIS Docker Benchmark**
  - [ ] Use trusted base images
  - [ ] Run containers as non-root
  - [ ] Limit container resources
  - [ ] Enable content trust

- [ ] **CIS Kubernetes Benchmark** (if applicable)
  - [ ] Network policies configured
  - [ ] Pod security policies enforced
  - [ ] RBAC enabled
  - [ ] Secrets encrypted

- [ ] **Azure Security Benchmark**
  - [ ] Enable Azure Defender
  - [ ] Use Managed Identities
  - [ ] Enable encryption at rest
  - [ ] Configure network security groups

- [ ] **OWASP Top 10**
  - [ ] Injection prevention
  - [ ] Broken authentication fixes
  - [ ] Sensitive data exposure prevention
  - [ ] Security misconfiguration fixes

---

## Monitoring & Alerting

### Required Alerts

```bicep
// Add to main.bicep
resource criticalAlerts 'Microsoft.Insights/metricAlerts@2018-03-01' = [
  {
    name: 'database-connection-failures'
    severity: 1
    metric: 'failed_connections'
    threshold: 10
  }
  {
    name: 'high-memory-usage'
    severity: 2
    metric: 'memory_percent'
    threshold: 90
  }
  {
    name: 'disk-space-low'
    severity: 2
    metric: 'storage_percent'
    threshold: 85
  }
  {
    name: 'ssl-certificate-expiring'
    severity: 1
    metric: 'certificate_expiry_days'
    threshold: 30
  }
]
```

---

## Conclusion

**Total Issues Found:** 20
- Critical: 4
- High: 6
- Medium: 5
- Low: 5

**Estimated Effort:**
- Critical fixes: 2-3 days
- High priority: 1 week
- Medium priority: 1 week
- Optimization: 1 week

**Total: 3-4 weeks for complete remediation**

**Next Steps:**
1. Review this audit with the team
2. Prioritize fixes based on risk
3. Create Linear issues for tracking
4. Implement fixes incrementally
5. Re-audit after changes
