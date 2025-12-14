# DOT Copilot - System Architecture

## Overview

DOT Copilot is a driver training management system built for cost-effective Azure deployment.

## System Architecture Diagram

```mermaid
flowchart TB
    subgraph Users [User Roles]
        Driver[Driver]
        Supervisor[Supervisor]
        Admin[Admin]
    end

    subgraph AzureCDN [Azure CDN - Optional]
        CDN[CDN Endpoint]
    end

    subgraph Frontend [Azure Static Web App - FREE]
        React[React SPA<br/>Vite + TypeScript]
        Assets[Static Assets]
    end

    subgraph Backend [Azure App Service - B1]
        Express[Express.js API]
        Prisma[Prisma ORM]
        Auth[JWT Auth]
    end

    subgraph Database [Azure PostgreSQL Flexible - Burstable]
        Postgres[(PostgreSQL 16)]
    end

    subgraph Storage [Azure Blob Storage - LRS]
        Uploads[Uploads Container]
        Training[Training Materials]
    end

    subgraph Security [Azure Key Vault]
        JWTSecret[JWT Secrets]
        DBCreds[DB Credentials]
        APIKeys[API Keys]
    end

    subgraph Monitoring [Azure Monitor]
        AppInsights[Application Insights]
        Logs[Log Analytics]
        Alerts[Alert Rules]
    end

    Users --> CDN
    CDN --> React
    React --> Express
    Express --> Auth
    Auth --> JWTSecret
    Express --> Prisma
    Prisma --> Postgres
    Express --> Uploads
    Express --> AppInsights
    AppInsights --> Alerts
    AppInsights --> Logs
```

## Data Flow

```mermaid
sequenceDiagram
    participant U as User Browser
    participant SWA as Static Web App
    participant API as App Service
    participant KV as Key Vault
    participant DB as PostgreSQL
    participant Blob as Blob Storage
    participant AI as App Insights

    Note over U,AI: Authentication Flow
    U->>SWA: Load Application
    SWA->>U: React SPA + Assets

    U->>API: POST /api/auth/login
    API->>KV: Get JWT Secret
    API->>DB: Verify Credentials
    DB->>API: User Data
    API->>AI: Track Login Event
    API->>U: JWT Token + Refresh Token

    Note over U,AI: Training Flow
    U->>API: GET /api/assignments
    API->>DB: Query Assignments
    DB->>API: Assignment Data
    API->>AI: Track Request
    API->>U: JSON Response

    U->>API: POST /api/uploads
    API->>Blob: Store File
    Blob->>API: File URL
    API->>DB: Save Reference
    API->>AI: Track Upload
    API->>U: Upload Success

    U->>API: POST /api/quizzes/submit
    API->>DB: Save Responses
    API->>DB: Calculate Score
    API->>AI: Track Quiz Completion
    API->>U: Results
```

## Cost Breakdown

### Development Environment (~$30/month)

| Resource | SKU | Monthly Cost |
|----------|-----|--------------|
| Static Web App | Free | $0 |
| App Service Plan | Basic B1 | $13 |
| PostgreSQL Flexible | Burstable B1ms | $12 |
| Blob Storage | Standard LRS (50GB) | $2 |
| Key Vault | Standard | $0.03 |
| Application Insights | Free tier (5GB) | $0 |
| **Total** | | **~$27** |

### Production Environment (~$250/month)

| Resource | SKU | Monthly Cost |
|----------|-----|--------------|
| Static Web App | Free | $0 |
| App Service Plan | PremiumV2 P1V2 | $73 |
| PostgreSQL Flexible | GP D2s_v3 | $145 |
| Blob Storage | Standard ZRS (100GB) | $4 |
| Key Vault | Standard | $1 |
| Application Insights | Pay-as-you-go | $25 |
| **Total** | | **~$248** |

### Cost Optimization Tips

1. **Use Reserved Instances** (1-3 year commitment)
   - App Service: Up to 40% savings
   - PostgreSQL: Up to 50% savings

2. **Application Insights Sampling**
   - Set 10% sampling in production
   - Full data for errors only

3. **Auto-stop Development**
   - Stop non-production databases overnight
   - Use Azure Automation runbooks

4. **Right-size Resources**
   - Start with Burstable DB, upgrade if needed
   - Monitor actual usage before scaling

## Component Details

### Frontend (Azure Static Web App)

- **Framework**: React 18 + TypeScript
- **Build**: Vite
- **State Management**: Zustand
- **Styling**: CSS Modules
- **Testing**: Vitest + React Testing Library

Benefits of Static Web App:
- Free tier with global CDN
- Automatic SSL certificates
- Preview environments for PRs
- Built-in authentication options

### Backend (Azure App Service)

- **Framework**: Express.js + TypeScript
- **ORM**: Prisma
- **Authentication**: JWT with refresh tokens
- **Validation**: Zod schemas
- **Documentation**: Swagger/OpenAPI

### Database (PostgreSQL Flexible Server)

- **Version**: PostgreSQL 16
- **Features**:
  - Automatic backups (7-14 days)
  - Point-in-time restore
  - SSL enforcement
  - Connection pooling (PgBouncer)

### Storage (Azure Blob Storage)

- **Structure**:
  - `/uploads` - User file uploads
  - `/training` - Training materials (PDFs, videos)
  - `/exports` - Generated reports

### Security (Key Vault)

- **Secrets Stored**:
  - JWT signing secrets
  - Database credentials
  - API keys for external services
  - SMTP credentials

### Monitoring (Application Insights)

- **Tracked Metrics**:
  - Request rates and response times
  - Error rates (4xx, 5xx)
  - Database query performance
  - Custom business metrics

- **Alerts Configured**:
  - High response time (>2s)
  - Server errors (>10 in 15min)
  - Database CPU (>80%)
  - Health check failures

## Deployment Architecture

```mermaid
flowchart LR
    subgraph GitHub [GitHub Repository]
        Main[main branch]
        Staging[staging branch]
        Develop[develop branch]
    end

    subgraph CICD [GitHub Actions]
        Build[Build & Test]
        DeployDev[Deploy Dev]
        DeployStaging[Deploy Staging]
        DeployProd[Deploy Prod]
    end

    subgraph Azure [Azure Environments]
        Dev[Dev Environment]
        Stage[Staging Environment]
        Prod[Production Environment]
    end

    Develop --> Build
    Build --> DeployDev
    DeployDev --> Dev

    Staging --> Build
    Build --> DeployStaging
    DeployStaging --> Stage

    Main --> Build
    Build --> DeployProd
    DeployProd --> Prod
```

## Security Architecture

```mermaid
flowchart TB
    subgraph Internet [Internet]
        User[User]
    end

    subgraph WAF [Azure CDN/WAF - Optional]
        DDoS[DDoS Protection]
        Rules[WAF Rules]
    end

    subgraph App [Application Layer]
        SWA[Static Web App<br/>HTTPS Only]
        API[App Service<br/>HTTPS Only]
    end

    subgraph Auth [Authentication]
        JWT[JWT Tokens]
        RBAC[Role-Based Access]
    end

    subgraph Data [Data Layer]
        KV[Key Vault<br/>Managed Identity]
        DB[PostgreSQL<br/>SSL + Firewall]
        Blob[Blob Storage<br/>Private Access]
    end

    User --> DDoS
    DDoS --> Rules
    Rules --> SWA
    SWA --> API
    API --> JWT
    JWT --> RBAC
    RBAC --> KV
    RBAC --> DB
    RBAC --> Blob
```

## Scaling Strategy

### Horizontal Scaling

1. **App Service Scale-out**
   - Configure auto-scale rules based on CPU/memory
   - Min: 1 instance, Max: 10 instances
   - Scale at 70% CPU for 5 minutes

2. **Database Read Replicas**
   - Add read replicas for reporting queries
   - Route read traffic to replicas

### Vertical Scaling

1. **App Service**
   - B1 → B2 → B3 → P1V2 → P2V2
   
2. **PostgreSQL**
   - B1ms → B2s → D2s_v3 → D4s_v3

## Disaster Recovery

- **RTO (Recovery Time Objective)**: 4 hours
- **RPO (Recovery Point Objective)**: 1 hour

### Backup Strategy

1. **Database**: 
   - Automatic daily backups (14 days retention in prod)
   - Point-in-time restore capability
   - Geo-redundant backups in production

2. **Blob Storage**:
   - Soft delete enabled (7 days)
   - Versioning enabled
   - ZRS redundancy in production

3. **Configuration**:
   - Infrastructure as Code (Bicep)
   - All secrets in Key Vault
   - GitHub Actions for reproducible deployments

