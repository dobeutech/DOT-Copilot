# DOT-Copilot Infrastructure Architecture

## System Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        USER[User Browser]
    end

    subgraph "Azure Cloud - Frontend"
        SWA[Azure Static Web App<br/>React Frontend<br/>FREE Tier]
    end

    subgraph "Azure Cloud - Backend"
        APPGW[Azure App Service<br/>Node.js Backend<br/>B1/P1V2]
        STAGING[Staging Slot<br/>Production Only]
    end

    subgraph "Azure Cloud - Data Layer"
        POSTGRES[(PostgreSQL 16<br/>Flexible Server<br/>B1ms/D2s_v3)]
        STORAGE[Azure Blob Storage<br/>File Uploads<br/>LRS/ZRS]
        KV[Azure Key Vault<br/>Secrets Management]
    end

    subgraph "Azure Cloud - Monitoring"
        LOGS[Log Analytics<br/>Workspace]
        INSIGHTS[Application Insights<br/>Telemetry]
        ALERTS[Metric Alerts<br/>Error/Performance]
    end

    subgraph "Docker Compose Stack - Local/Dev"
        NGINX[Nginx Gateway<br/>:80/:443]
        API[FastAPI Server<br/>:8000]
        MCP[MCP Gateway<br/>:8000]
        GITHUB_MCP[GitHub MCP Server]
        PG[(PostgreSQL 16)]
        REDIS[(Redis Cache)]
        MONGO[(MongoDB 7)]
        PROM[Prometheus<br/>:9090]
        GRAF[Grafana<br/>:3000]
        VAULT[Vault Dev<br/>:8200]
    end

    subgraph "CI/CD Pipeline"
        GHA[GitHub Actions]
        BUILD[Build & Test]
        DEPLOY[Deploy]
        HEALTH[Health Check]
    end

    USER --> SWA
    SWA --> APPGW
    APPGW --> POSTGRES
    APPGW --> STORAGE
    APPGW --> KV
    APPGW --> INSIGHTS
    STAGING -.-> APPGW
    INSIGHTS --> LOGS
    ALERTS --> INSIGHTS
    
    GHA --> BUILD
    BUILD --> DEPLOY
    DEPLOY --> APPGW
    DEPLOY --> SWA
    DEPLOY --> HEALTH

    NGINX --> API
    NGINX --> MCP
    API --> PG
    API --> REDIS
    API --> MONGO
    MCP --> GITHUB_MCP
    MCP --> REDIS
    API --> PROM
    GRAF --> PROM
```

## Docker Compose Architecture (Development)

```mermaid
graph LR
    subgraph "Frontend Network"
        NGINX[Nginx<br/>API Gateway]
    end

    subgraph "Backend Network"
        API[API Server<br/>FastAPI]
        MCP[MCP Gateway]
        PG[(PostgreSQL)]
        REDIS[(Redis)]
        MONGO[(MongoDB)]
        VAULT[Vault]
    end

    subgraph "MCP Network"
        GITHUB[GitHub MCP]
    end

    subgraph "Monitoring Network"
        PROM[Prometheus]
        GRAF[Grafana]
    end

    NGINX --> API
    NGINX --> MCP
    API --> PG
    API --> REDIS
    API --> MONGO
    MCP --> GITHUB
    MCP --> REDIS
    GRAF --> PROM
```

## Azure Infrastructure Components

```mermaid
graph TB
    subgraph "Resource Group"
        subgraph "Compute"
            ASP[App Service Plan<br/>Linux]
            BACKEND[Backend App Service<br/>Node 20 LTS]
            SLOT[Staging Slot<br/>Prod Only]
        end

        subgraph "Data"
            DB[(PostgreSQL Flexible<br/>Server 16)]
            DBDB[(Database: dot_copilot)]
            BLOB[Storage Account<br/>Blob Container: uploads]
        end

        subgraph "Security"
            KV[Key Vault<br/>RBAC Enabled]
            SECRETS[Secrets:<br/>JWT, DB Password]
            MSI[Managed Identity]
        end

        subgraph "Monitoring"
            LAW[Log Analytics]
            AI[Application Insights]
            ALERT1[Error Rate Alert]
            ALERT2[Response Time Alert]
            ALERT3[DB CPU Alert]
        end

        subgraph "Frontend"
            SWA[Static Web App<br/>Free Tier]
        end
    end

    ASP --> BACKEND
    BACKEND --> SLOT
    BACKEND --> DB
    BACKEND --> BLOB
    BACKEND --> KV
    BACKEND --> AI
    MSI --> KV
    AI --> LAW
    ALERT1 --> AI
    ALERT2 --> AI
    ALERT3 --> DB
    SWA -.API Calls.-> BACKEND
```

## CI/CD Pipeline Flow

```mermaid
graph LR
    subgraph "Trigger"
        PUSH[Push to Branch]
        PR[Pull Request]
        MANUAL[Manual Dispatch]
    end

    subgraph "Environment Selection"
        ENV{Branch?}
        DEV[dev]
        STAGING[staging]
        PROD[main]
    end

    subgraph "Build & Test"
        BACKEND_BUILD[Backend Build]
        FRONTEND_BUILD[Frontend Build]
        BACKEND_TEST[Backend Tests]
        FRONTEND_TEST[Frontend Tests]
        PRISMA[Prisma Generate]
        DOCKER[Docker Build]
    end

    subgraph "Deploy"
        BACKEND_DEPLOY[Deploy Backend<br/>App Service]
        FRONTEND_DEPLOY[Deploy Frontend<br/>Static Web App]
        MIGRATE[Run Migrations]
        SLOT_SWAP[Swap Slots<br/>Prod Only]
    end

    subgraph "Verify"
        HEALTH_BE[Backend Health]
        HEALTH_FE[Frontend Health]
    end

    PUSH --> ENV
    PR --> ENV
    MANUAL --> ENV
    ENV --> DEV
    ENV --> STAGING
    ENV --> PROD

    DEV --> BACKEND_BUILD
    STAGING --> BACKEND_BUILD
    PROD --> BACKEND_BUILD

    BACKEND_BUILD --> PRISMA
    PRISMA --> BACKEND_TEST
    BACKEND_TEST --> DOCKER
    FRONTEND_BUILD --> FRONTEND_TEST
    FRONTEND_TEST --> DOCKER

    DOCKER --> MIGRATE
    MIGRATE --> BACKEND_DEPLOY
    DOCKER --> FRONTEND_DEPLOY
    BACKEND_DEPLOY --> SLOT_SWAP
    SLOT_SWAP --> HEALTH_BE
    FRONTEND_DEPLOY --> HEALTH_FE
```

## Network Architecture

```mermaid
graph TB
    subgraph "Internet"
        CLIENT[Client]
    end

    subgraph "Azure Frontend"
        CDN[Azure CDN<br/>Static Web App]
    end

    subgraph "Azure Backend"
        APPGW[App Service<br/>HTTPS Only]
        VNET[Virtual Network<br/>Optional]
    end

    subgraph "Data Layer"
        DB[(PostgreSQL<br/>SSL Required)]
        STORAGE[Blob Storage<br/>Private Access]
    end

    subgraph "Security"
        KV[Key Vault<br/>RBAC]
        FW[Firewall Rules]
    end

    CLIENT -->|HTTPS| CDN
    CDN -->|HTTPS| APPGW
    APPGW -->|SSL/TLS| DB
    APPGW -->|HTTPS| STORAGE
    APPGW -->|RBAC| KV
    FW --> DB
    FW --> STORAGE
```

## Data Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database
    participant Storage
    participant KeyVault
    participant Monitoring

    User->>Frontend: Access Application
    Frontend->>Backend: API Request (JWT)
    Backend->>KeyVault: Retrieve Secrets
    KeyVault-->>Backend: JWT Secret
    Backend->>Backend: Validate Token
    Backend->>Database: Query Data
    Database-->>Backend: Return Data
    Backend->>Storage: Upload File
    Storage-->>Backend: File URL
    Backend->>Monitoring: Log Metrics
    Backend-->>Frontend: JSON Response
    Frontend-->>User: Render UI
```

## Environment Tiers

| Component | Dev | Staging | Production |
|-----------|-----|---------|------------|
| **App Service Plan** | B1 Basic | B1 Basic | P1V2 Premium |
| **PostgreSQL** | B1ms Burstable | B1ms Burstable | D2s_v3 General Purpose |
| **Storage** | LRS | LRS | ZRS |
| **High Availability** | Disabled | Disabled | Zone Redundant |
| **Backup Retention** | 7 days | 7 days | 14 days |
| **Geo Redundancy** | Disabled | Disabled | Enabled |
| **Staging Slot** | No | No | Yes |
| **Always On** | No | No | Yes |
| **Estimated Cost** | ~$30/mo | ~$35/mo | ~$250/mo |

## Security Architecture

```mermaid
graph TB
    subgraph "Identity & Access"
        MSI[Managed Service Identity]
        RBAC[RBAC Roles]
        KV[Key Vault]
    end

    subgraph "Network Security"
        HTTPS[HTTPS Only]
        TLS[TLS 1.2+]
        FW[Firewall Rules]
        PRIVATE[Private Endpoints]
    end

    subgraph "Data Security"
        ENCRYPT[Encryption at Rest]
        SSL[SSL in Transit]
        BACKUP[Encrypted Backups]
    end

    subgraph "Application Security"
        JWT[JWT Authentication]
        CORS[CORS Policy]
        SECRETS[Secret Management]
    end

    MSI --> RBAC
    RBAC --> KV
    HTTPS --> TLS
    TLS --> SSL
    FW --> PRIVATE
    ENCRYPT --> BACKUP
    JWT --> SECRETS
    SECRETS --> KV
```

## Monitoring & Observability

```mermaid
graph LR
    subgraph "Data Collection"
        APP[Application]
        LOGS[Logs]
        METRICS[Metrics]
        TRACES[Traces]
    end

    subgraph "Processing"
        AI[Application Insights]
        LAW[Log Analytics]
    end

    subgraph "Alerting"
        ERROR[Error Rate Alert]
        PERF[Performance Alert]
        DB[Database Alert]
    end

    subgraph "Visualization"
        DASH[Azure Dashboard]
        QUERY[KQL Queries]
    end

    APP --> LOGS
    APP --> METRICS
    APP --> TRACES
    LOGS --> AI
    METRICS --> AI
    TRACES --> AI
    AI --> LAW
    LAW --> ERROR
    LAW --> PERF
    LAW --> DB
    LAW --> DASH
    LAW --> QUERY
```

## Deployment Strategies

### Blue-Green Deployment (Production)

```mermaid
graph LR
    subgraph "Production Slot"
        BLUE[Current Version<br/>v1.0]
    end

    subgraph "Staging Slot"
        GREEN[New Version<br/>v1.1]
    end

    subgraph "Traffic"
        USERS[Users]
        LB[Load Balancer]
    end

    USERS --> LB
    LB -->|100%| BLUE
    GREEN -.Deploy & Test.-> GREEN
    GREEN -.Swap.-> BLUE
    LB -.Switch.->|100%| GREEN
```

## Cost Optimization

```mermaid
graph TB
    subgraph "Cost Savings"
        FREE[Static Web App<br/>FREE Tier]
        BASIC[Basic Tier<br/>Dev/Staging]
        BURSTABLE[Burstable DB<br/>Dev/Staging]
        LRS[LRS Storage<br/>Dev/Staging]
        SAMPLING[10% Sampling<br/>Production]
    end

    subgraph "Cost Drivers"
        PREMIUM[Premium Tier<br/>Production]
        GP[General Purpose DB<br/>Production]
        ZRS[ZRS Storage<br/>Production]
        HA[High Availability<br/>Production]
    end

    FREE -.Saves $50/mo.-> PREMIUM
    BASIC -.Saves $100/mo.-> PREMIUM
    BURSTABLE -.Saves $150/mo.-> GP
    LRS -.Saves $20/mo.-> ZRS
    SAMPLING -.Saves $30/mo.-> HA
```
