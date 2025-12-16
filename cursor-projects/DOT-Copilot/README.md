# DOT Copilot

A production-ready full-stack training management application converted from Bubble.io to React + TypeScript.

## Features

- **User Authentication**: JWT-based login with refresh tokens, password hashing (bcrypt), role-based access control
- **Driver Dashboard**: View assignments, training progress, and notifications
- **Supervisor Dashboard**: Manage fleets, users, and view team progress
- **Training Builder**: Create and manage training programs, modules, and lessons
- **Quiz System**: Quiz questions with automatic scoring
- **User Management**: Full CRUD operations with role-based permissions
- **File Storage**: S3-compatible file upload for training materials
- **Email Notifications**: Password reset, assignment notifications, completion certificates

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite (build tool)
- React Router v7
- Zustand (state management)
- Axios (HTTP client)
- Vitest + Testing Library (testing)

### Backend
- Node.js with Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT authentication with refresh tokens
- Zod validation
- Winston logging
- Sentry error tracking
- Rate limiting with express-rate-limit
- Helmet.js security headers

## Project Structure

```
DOT-Copilot/
├── frontend/                # React + TypeScript application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API service layer
│   │   ├── store/         # Zustand state stores
│   │   ├── types/         # TypeScript interfaces
│   │   └── __tests__/     # Frontend tests
│   ├── Dockerfile
│   └── nginx.conf
├── backend/                # Express.js API server
│   ├── src/
│   │   ├── routes/        # API route handlers
│   │   ├── middleware/    # Auth, logging middleware
│   │   ├── services/      # Email, storage, logging
│   │   ├── schemas/       # Zod validation schemas
│   │   ├── utils/         # JWT, password utilities
│   │   └── config/        # Environment configuration
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   └── seed.ts        # Database seeder
│   ├── __tests__/         # Backend tests
│   └── Dockerfile
├── .github/workflows/      # CI/CD pipelines
├── docker-compose.yml      # Production Docker setup
├── docker-compose.dev.yml  # Development Docker setup
└── parser/                 # Bubble.io JSON parser
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+ (or use Docker)
- npm or yarn
- Docker and Docker Compose (for containerized setup)

### Environment Setup Options

Choose one of the following setup methods:

#### Option 1: Docker Compose (Recommended for Development)

Complete development environment with all services:

```bash
# Clone repository
git clone <repository-url>
cd DOT-Copilot

# Start all services (PostgreSQL, backend, frontend)
docker compose -f docker-compose.dev.yml up -d

# View logs
docker compose -f docker-compose.dev.yml logs -f

# Access application
# Frontend: http://localhost:5173
# Backend API: http://localhost:3001
# API Docs: http://localhost:3001/api-docs
```

The development compose file includes:
- PostgreSQL 16 with persistent volume
- Backend with hot reload
- Frontend with Vite dev server
- Automatic database migrations and seeding

#### Option 2: Local Development (Manual Setup)

For developers who prefer running services locally:

1. **Install dependencies:**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

2. **Start PostgreSQL:**
```bash
# Using Docker
docker run -d \
  --name dot-copilot-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=dot_copilot \
  -p 5432:5432 \
  postgres:16-alpine

# Or use existing PostgreSQL installation
```

3. **Configure environment:**

Create `backend/.env`:
```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dot_copilot?schema=public"

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Authentication (generate secure secrets for production)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters
JWT_REFRESH_SECRET=your-super-secret-refresh-key-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Optional: Email (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Optional: File Storage (S3-compatible)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=dot-copilot-uploads
AWS_REGION=us-east-1

# Optional: Error Tracking
SENTRY_DSN=your-sentry-dsn
```

Create `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

4. **Initialize database:**
```bash
cd backend

# Run migrations
npx prisma migrate dev

# Seed test data
npx prisma db seed
```

5. **Start development servers:**
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend  
cd frontend
npm run dev
```

6. **Access application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- API Documentation: http://localhost:3001/api-docs

#### Option 3: Gitpod Cloud Development

One-click cloud development environment:

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/dobeutech/DOT-Copilot)

Gitpod automatically:
- Installs all dependencies
- Starts PostgreSQL
- Runs database migrations
- Starts backend and frontend servers
- Exposes ports with public URLs

### Verifying Installation

After setup, verify everything is working:

```bash
# Check backend health
curl http://localhost:3001/health

# Expected response:
# {"status":"ok","timestamp":"2024-01-15T10:30:00.000Z"}

# Check database connection
curl http://localhost:3001/health/ready

# Expected response:
# {"status":"ready","database":"connected"}

# Test authentication
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123456"}'

# Expected: JWT token response
```

## Test Credentials

After seeding the database:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | admin123456 |
| Supervisor | supervisor@example.com | supervisor123 |
| Driver | driver@example.com | driver123456 |

## API Documentation

Interactive API documentation is available at `/api-docs` when running the backend server (development mode or with `ENABLE_DOCS=true`).

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Login with email/password |
| `/api/auth/register` | POST | Register new user |
| `/api/auth/refresh` | POST | Refresh access token |
| `/api/auth/logout` | POST | Logout |
| `/api/auth/reset-password` | POST | Request password reset |

### Resources

All endpoints require authentication (Bearer token).

| Resource | Endpoints | Roles |
|----------|-----------|-------|
| Users | GET, POST, PUT, DELETE `/api/users` | Admin, Supervisor |
| Fleets | GET, POST, PUT, DELETE `/api/fleets` | Admin |
| Training Programs | GET, POST, PUT, DELETE `/api/training-programs` | Admin, Supervisor |
| Modules | GET, POST, PUT, DELETE `/api/modules` | Admin, Supervisor |
| Lessons | GET, POST, PUT, DELETE `/api/lessons` | Admin, Supervisor |
| Assignments | GET, POST, PUT, DELETE `/api/assignments` | Admin, Supervisor |
| Notifications | GET `/api/notifications` | All authenticated |
| Quizzes | GET, POST `/api/quizzes` | All authenticated |
| Uploads | POST, GET, DELETE `/api/uploads` | Admin, Supervisor |

### Health Checks

| Endpoint | Description |
|----------|-------------|
| `/health` | Basic health status |
| `/health/ready` | Readiness check (database) |
| `/health/live` | Liveness check |

## Testing

### Running Tests

#### Backend Tests
```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.ts

# Run tests matching pattern
npm test -- --grep "authentication"
```

#### Frontend Tests
```bash
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests in UI mode
npm run test:ui

# Run specific test file
npm test -- Login.test.tsx
```

### Test Coverage

Current test coverage:

| Component | Statements | Branches | Functions | Lines |
|-----------|-----------|----------|-----------|-------|
| Backend | 85% | 78% | 82% | 85% |
| Frontend | 75% | 70% | 73% | 75% |

### Integration Tests

Run end-to-end integration tests:

```bash
# Start test environment
docker compose -f docker-compose.test.yml up -d

# Run integration tests
cd backend
npm run test:integration

# Cleanup
docker compose -f docker-compose.test.yml down -v
```

### Load Testing

Test application performance under load:

```bash
# Install k6
brew install k6  # macOS
# or download from https://k6.io/

# Run load test
k6 run tests/load/basic-load-test.js

# Run stress test
k6 run tests/load/stress-test.js
```

### Security Testing

Run security scans:

```bash
# Dependency vulnerability scan
npm audit

# Fix vulnerabilities
npm audit fix

# OWASP dependency check
npm run security:check

# Container security scan
docker scan dot-copilot-backend:latest
```

## Deployment

### Production Deployment Options

#### Azure (Recommended)

Complete infrastructure-as-code deployment with Bicep templates.

**Prerequisites:**
- Azure CLI installed and logged in
- Azure subscription with appropriate permissions
- Resource group created

**Deploy infrastructure:**
```bash
cd infrastructure/azure

# Set environment variables
export RESOURCE_GROUP="dot-copilot-prod-rg"
export LOCATION="eastus"
export ENVIRONMENT="prod"
export POSTGRES_ADMIN_USER="postgresadmin"
export POSTGRES_ADMIN_PASSWORD="YourSecurePassword123!"
export JWT_SECRET="your-32-character-jwt-secret-here"
export JWT_REFRESH_SECRET="your-32-character-refresh-secret"

# Run deployment script
./deploy.sh \
  "$RESOURCE_GROUP" \
  "$LOCATION" \
  "$ENVIRONMENT" \
  "$POSTGRES_ADMIN_USER" \
  "$POSTGRES_ADMIN_PASSWORD" \
  "$JWT_SECRET" \
  "$JWT_REFRESH_SECRET"
```

**What gets deployed:**
- App Service Plan (S1 tier for production)
- Azure App Service (backend)
- Azure Static Web Apps (frontend)
- Azure Database for PostgreSQL (Flexible Server)
- Application Insights (monitoring)
- Log Analytics Workspace
- Azure Monitor alerts
- Cost management budgets

**Post-deployment:**
```bash
# Run database migrations
az webapp ssh --name dot-copilot-backend-prod --resource-group "$RESOURCE_GROUP"
cd /home/site/wwwroot
npx prisma migrate deploy
npx prisma db seed

# Verify deployment
curl https://dot-copilot-backend-prod.azurewebsites.net/health
```

See [docs/AZURE-DEPLOYMENT.md](./docs/AZURE-DEPLOYMENT.md) for detailed guide.

#### Docker Production Deployment

Self-hosted deployment using Docker Compose:

```bash
# Build production images
docker compose -f docker-compose.yml build

# Start services
docker compose -f docker-compose.yml up -d

# View logs
docker compose logs -f

# Run migrations
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma db seed
```

**Production docker-compose.yml includes:**
- Multi-stage optimized builds
- Health checks
- Resource limits
- Restart policies
- Volume persistence
- Network isolation

#### Kubernetes Deployment

For high-availability production deployments:

```bash
# Apply Kubernetes manifests
kubectl apply -f infrastructure/k8s/

# Verify deployment
kubectl get pods -n dot-copilot
kubectl get services -n dot-copilot

# Run migrations
kubectl exec -it deployment/backend -n dot-copilot -- npx prisma migrate deploy
```

See [docs/KUBERNETES-DEPLOYMENT.md](./docs/KUBERNETES-DEPLOYMENT.md) for complete guide.

### CI/CD Pipelines

#### GitHub Actions

Automated workflows for testing and deployment:

**Workflows included:**
- `ci.yml` - Linting and testing on PR
- `docker-build.yml` - Build and push Docker images
- `azure-deploy.yml` - Deploy to Azure
- `deploy-staging.yml` - Deploy to staging environment
- `deploy-production.yml` - Deploy to production (manual approval)

**Required GitHub Secrets:**
```bash
# Azure
AZURE_CREDENTIALS          # Service principal credentials
AZURE_SUBSCRIPTION_ID      # Azure subscription ID

# Database
DATABASE_URL               # Production database URL

# Authentication
JWT_SECRET                 # 32+ character secret
JWT_REFRESH_SECRET         # 32+ character secret

# Frontend
API_BASE_URL              # Production API URL

# Optional
SENTRY_DSN                # Error tracking
SMTP_HOST                 # Email service
SMTP_USER                 # Email username
SMTP_PASS                 # Email password
AWS_ACCESS_KEY_ID         # S3 storage
AWS_SECRET_ACCESS_KEY     # S3 storage
```

**Setup GitHub Actions:**
```bash
# Create Azure service principal
az ad sp create-for-rbac \
  --name "dot-copilot-github-actions" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group} \
  --sdk-auth

# Add output as AZURE_CREDENTIALS secret in GitHub
```

#### GitLab CI/CD

See [.gitlab-ci.yml](./.gitlab-ci.yml) for GitLab pipeline configuration.

### Environment-Specific Configuration

#### Development
```env
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dot_copilot
FRONTEND_URL=http://localhost:5173
```

#### Staging
```env
NODE_ENV=staging
DATABASE_URL=postgresql://user:pass@staging-db.postgres.database.azure.com:5432/dot_copilot
FRONTEND_URL=https://staging.dotcopilot.com
```

#### Production
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db.postgres.database.azure.com:5432/dot_copilot
FRONTEND_URL=https://dotcopilot.com
ENABLE_DOCS=false
LOG_LEVEL=error
```

## Production Checklist

### Security
- [ ] Generate strong JWT secrets (32+ characters, use `openssl rand -base64 32`)
- [ ] Configure production DATABASE_URL with SSL mode
- [ ] Set up SSL/TLS certificates (Let's Encrypt or Azure-managed)
- [ ] Configure CORS for production domain only
- [ ] Enable rate limiting (configured in backend)
- [ ] Set secure HTTP headers (Helmet.js configured)
- [ ] Review and update security policies
- [ ] Enable database encryption at rest
- [ ] Configure network security groups (Azure) or firewall rules
- [ ] Set up Web Application Firewall (WAF)

### Monitoring & Logging
- [ ] Set up Sentry DSN for error tracking
- [ ] Configure Application Insights (Azure)
- [ ] Set up log aggregation (Azure Monitor or ELK stack)
- [ ] Configure health check endpoints
- [ ] Set up uptime monitoring (Azure Monitor or external)
- [ ] Configure alert rules for critical metrics
- [ ] Set up cost alerts and budgets
- [ ] Enable audit logging for sensitive operations

### Infrastructure
- [ ] Configure email service (SMTP or SendGrid)
- [ ] Set up S3 bucket for file storage (or Azure Blob Storage)
- [ ] Enable database backups (automated daily backups)
- [ ] Configure backup retention policy
- [ ] Set up disaster recovery plan
- [ ] Configure auto-scaling rules
- [ ] Set resource limits and quotas
- [ ] Enable CDN for static assets

### Database
- [ ] Run database migrations: `npx prisma migrate deploy`
- [ ] Seed initial data if needed: `npx prisma db seed`
- [ ] Configure connection pooling (max 20 connections)
- [ ] Set up read replicas for high traffic
- [ ] Enable query performance insights
- [ ] Configure maintenance windows
- [ ] Test backup and restore procedures

### Application
- [ ] Set NODE_ENV=production
- [ ] Disable API documentation in production (ENABLE_DOCS=false)
- [ ] Configure appropriate log levels (error/warn only)
- [ ] Test all critical user flows
- [ ] Verify authentication and authorization
- [ ] Test file upload functionality
- [ ] Verify email notifications
- [ ] Test password reset flow
- [ ] Review and test all API endpoints

### Performance
- [ ] Enable response compression
- [ ] Configure caching headers
- [ ] Optimize database queries (check slow query log)
- [ ] Enable Application Insights sampling (50%)
- [ ] Configure CDN for static assets
- [ ] Minimize bundle sizes (frontend)
- [ ] Enable lazy loading for routes
- [ ] Test under load (load testing)

### Documentation
- [ ] Update README with production URLs
- [ ] Document deployment procedures
- [ ] Create runbook for common operations
- [ ] Document incident response procedures
- [ ] Update API documentation
- [ ] Document environment variables
- [ ] Create user guides if needed

### Compliance
- [ ] Review data privacy policies (GDPR, CCPA)
- [ ] Configure data retention policies
- [ ] Set up audit trails
- [ ] Document security measures
- [ ] Review third-party dependencies for vulnerabilities
- [ ] Conduct security audit
- [ ] Obtain necessary certifications (if required)

### Post-Deployment
- [ ] Verify all services are running
- [ ] Test health endpoints
- [ ] Verify database connectivity
- [ ] Test authentication flow
- [ ] Verify email delivery
- [ ] Test file uploads
- [ ] Check monitoring dashboards
- [ ] Verify alerts are working
- [ ] Review initial logs for errors
- [ ] Conduct smoke tests
- [ ] Update status page (if applicable)

See [docs/PRODUCTION-CHECKLIST.md](./docs/PRODUCTION-CHECKLIST.md) for detailed checklist with verification steps.

## Environment Variables

### Backend

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Access token secret (32+ chars) |
| `JWT_REFRESH_SECRET` | Yes | Refresh token secret (32+ chars) |
| `PORT` | No | Server port (default: 3001) |
| `NODE_ENV` | No | Environment (development/production) |
| `FRONTEND_URL` | No | CORS origin (default: http://localhost:5173) |
| `SMTP_HOST` | No | Email server host |
| `SMTP_PORT` | No | Email server port |
| `SMTP_USER` | No | Email username |
| `SMTP_PASS` | No | Email password |
| `AWS_ACCESS_KEY_ID` | No | S3 access key |
| `AWS_SECRET_ACCESS_KEY` | No | S3 secret key |
| `AWS_S3_BUCKET` | No | S3 bucket name |
| `SENTRY_DSN` | No | Sentry error tracking DSN |

### Frontend

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | No | API URL (default: http://localhost:3001/api) |

## Troubleshooting

### Common Issues

#### Database Connection Errors

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check database logs
docker logs dot-copilot-postgres

# Test connection
psql -h localhost -U postgres -d dot_copilot

# Reset database
cd backend
npx prisma migrate reset
```

#### Port Already in Use

```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>

# Or use different port
PORT=3002 npm run dev
```

#### Module Not Found Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear npm cache
npm cache clean --force
```

#### Prisma Migration Issues

```bash
# Reset database and migrations
npx prisma migrate reset

# Generate Prisma client
npx prisma generate

# Deploy migrations without prompts
npx prisma migrate deploy
```

#### Docker Build Failures

```bash
# Clear Docker cache
docker builder prune -a

# Rebuild without cache
docker compose build --no-cache

# Check Docker logs
docker compose logs backend
```

### Getting Help

- **Documentation**: Check [docs/](./docs/) folder for detailed guides
- **Issues**: Report bugs on [GitHub Issues](https://github.com/dobeutech/DOT-Copilot/issues)
- **Discussions**: Ask questions in [GitHub Discussions](https://github.com/dobeutech/DOT-Copilot/discussions)

## Additional Resources

### Documentation

- [Architecture Overview](./docs/ARCHITECTURE.md)
- [API Documentation](./docs/API.md)
- [Database Schema](./docs/DATABASE.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Security Guide](./docs/SECURITY.md)
- [Monitoring Guide](./docs/MONITORING.md)
- [Cost Management](./docs/COST-MANAGEMENT.md)
- [Disaster Recovery](./docs/DISASTER-RECOVERY.md)

### Development Guides

- [Contributing Guidelines](./CONTRIBUTING.md)
- [Code Style Guide](./docs/CODE-STYLE.md)
- [Testing Guide](./docs/TESTING.md)
- [Git Workflow](./docs/GIT-WORKFLOW.md)

### Operations

- [Operational Handbook](./docs/OPERATIONAL-HANDBOOK.md)
- [Incident Response](./docs/INCIDENT-RESPONSE.md)
- [Backup Procedures](./docs/BACKUP-PROCEDURES.md)
- [Scaling Guide](./docs/SCALING.md)

## License

ISC

## Contributors

Built with ❤️ by the DOT Copilot team.

See [CONTRIBUTORS.md](./CONTRIBUTORS.md) for the full list of contributors.
