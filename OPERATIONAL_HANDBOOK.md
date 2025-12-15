# DOT-Copilot Operational Handbook & Standards

## Overview

This handbook defines operational standards, procedures, and best practices for the DOT-Copilot infrastructure. All team members must follow these guidelines to ensure consistency, security, and reliability.

**Version:** 1.0  
**Last Updated:** 2025-12-15  
**Owner:** Infrastructure Team  
**Review Cycle:** Quarterly

---

## Table of Contents

1. [Development Standards](#development-standards)
2. [Infrastructure Standards](#infrastructure-standards)
3. [Security Standards](#security-standards)
4. [Deployment Procedures](#deployment-procedures)
5. [Monitoring & Alerting](#monitoring--alerting)
6. [Incident Response](#incident-response)
7. [Change Management](#change-management)
8. [Documentation Standards](#documentation-standards)
9. [Code Review Process](#code-review-process)
10. [Testing Standards](#testing-standards)

---

## Development Standards

### Code Style

#### TypeScript/JavaScript

**Formatting:**
- Use Prettier with project configuration
- 2 spaces for indentation
- Single quotes for strings
- Trailing commas in multi-line objects/arrays
- Max line length: 100 characters

**Naming Conventions:**
```typescript
// Files: kebab-case
user-service.ts
auth-middleware.ts

// Components: PascalCase
UserProfile.tsx
LoadingSpinner.tsx

// Functions/Variables: camelCase
const getUserData = () => {}
const isAuthenticated = true

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3
const API_BASE_URL = 'https://api.example.com'

// Interfaces/Types: PascalCase with 'I' prefix for interfaces
interface IUser {
  id: string
  name: string
}

type UserRole = 'admin' | 'user' | 'guest'
```

**Code Organization:**
```typescript
// 1. Imports (external first, then internal)
import React from 'react'
import { useState } from 'react'

import { Button } from '@/components/Button'
import { useAuth } from '@/hooks/useAuth'

// 2. Types/Interfaces
interface Props {
  userId: string
}

// 3. Constants
const DEFAULT_TIMEOUT = 5000

// 4. Component/Function
export const UserProfile: React.FC<Props> = ({ userId }) => {
  // Hooks
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  
  // Effects
  useEffect(() => {
    // ...
  }, [userId])
  
  // Handlers
  const handleSubmit = () => {
    // ...
  }
  
  // Render
  return (
    // ...
  )
}
```

#### Python

**Formatting:**
- Follow PEP 8
- 4 spaces for indentation
- Max line length: 88 characters (Black formatter)
- Type hints for all function signatures

**Naming Conventions:**
```python
# Files: snake_case
user_service.py
auth_middleware.py

# Classes: PascalCase
class UserService:
    pass

# Functions/Variables: snake_case
def get_user_data():
    pass

is_authenticated = True

# Constants: UPPER_SNAKE_CASE
MAX_RETRY_ATTEMPTS = 3
API_BASE_URL = "https://api.example.com"
```

### Git Workflow

#### Branch Naming

```bash
# Feature branches
feature/user-authentication
feature/add-payment-gateway

# Bug fixes
fix/login-redirect-issue
fix/memory-leak-in-cache

# Hotfixes
hotfix/security-vulnerability
hotfix/production-crash

# Infrastructure
infra/add-monitoring
infra/update-docker-config

# Documentation
docs/update-api-guide
docs/add-deployment-steps
```

#### Commit Messages

**Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes
- `build`: Build system changes

**Examples:**
```bash
feat(auth): add JWT token refresh mechanism

Implement automatic token refresh when access token expires.
Tokens are refreshed 5 minutes before expiration.

Resolves: DBS-19
Co-authored-by: Ona <no-reply@ona.com>

---

fix(api): handle null response in user endpoint

Add null check before accessing user data to prevent crashes.

Fixes: #123

---

docs(readme): update installation instructions

Add Docker setup steps and environment variable configuration.
```

### Environment Management

#### Environment Files

**Required Files:**
```
.env.example          # Template with all variables
.env.development      # Local development
.env.staging          # Staging environment
.env.production       # Production (in Key Vault)
```

**Variable Naming:**
```bash
# Format: COMPONENT_PURPOSE_DETAIL
DATABASE_URL=postgresql://...
REDIS_CACHE_URL=redis://...
AUTH0_CLIENT_ID=...
AZURE_STORAGE_CONNECTION_STRING=...

# Avoid
db_url=...           # Wrong: lowercase
DatabaseURL=...      # Wrong: mixed case
URL_DATABASE=...     # Wrong: reversed order
```

#### Secrets Management

**Rules:**
1. ❌ Never commit secrets to Git
2. ✅ Use `.env.example` with placeholder values
3. ✅ Store production secrets in Azure Key Vault
4. ✅ Rotate secrets every 90 days
5. ✅ Use different secrets per environment

**Secret Rotation Schedule:**
```
Database passwords:    Every 90 days
API keys:             Every 90 days
JWT secrets:          Every 180 days
SSL certificates:     Before expiration
```

---

## Infrastructure Standards

### Docker Standards

#### Dockerfile Best Practices

```dockerfile
# ✅ GOOD
FROM node:20-alpine@sha256:abc123...  # Pinned to digest
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN adduser -S nodejs -u 1001
USER nodejs
EXPOSE 3000
CMD ["node", "server.js"]

# ❌ BAD
FROM node:latest                      # Unpinned version
WORKDIR /app
COPY . .                              # Copies everything
RUN npm install                       # Installs dev dependencies
# No USER directive - runs as root
EXPOSE 3000
CMD ["node", "server.js"]
```

#### docker-compose.yml Standards

```yaml
# ✅ GOOD
services:
  backend:
    image: backend:1.0.0@sha256:...
    restart: unless-stopped
    environment:
      - DATABASE_URL=${DATABASE_URL:?DATABASE_URL required}
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

# ❌ BAD
services:
  backend:
    image: backend:latest              # Unpinned
    restart: always                    # Wrong restart policy
    environment:
      - DATABASE_URL=postgres://...    # Hardcoded secret
    # No resource limits
    # No health check
```

### Kubernetes Standards (Future)

#### Resource Requests/Limits

```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

#### Labels

```yaml
metadata:
  labels:
    app: dot-copilot
    component: backend
    environment: production
    version: "1.0.0"
    managed-by: helm
```

### Azure Standards

#### Resource Naming

```
Format: <resource-type>-<app-name>-<environment>-<region>

Examples:
rg-dot-copilot-prod-eastus          # Resource Group
asp-dot-copilot-prod-eastus         # App Service Plan
app-dot-copilot-backend-prod        # App Service
db-dot-copilot-prod                 # Database
kv-dot-copilot-prod                 # Key Vault
st-dotcopilotprod                   # Storage Account (no hyphens)
```

#### Tagging Standards

```json
{
  "Environment": "production",
  "Application": "dot-copilot",
  "Owner": "infrastructure-team",
  "CostCenter": "engineering",
  "ManagedBy": "terraform",
  "CreatedDate": "2025-12-15",
  "DataClassification": "confidential"
}
```

---

## Security Standards

### Authentication & Authorization

#### Password Requirements

- Minimum 12 characters
- Must include: uppercase, lowercase, number, special character
- Cannot contain username or email
- Cannot be in common password list
- Must be changed every 90 days
- Cannot reuse last 5 passwords

#### MFA Requirements

- Required for all admin accounts
- Required for production access
- TOTP or hardware token preferred
- SMS as fallback only

#### API Security

```typescript
// ✅ GOOD
app.use(helmet())                    // Security headers
app.use(rateLimit({                  // Rate limiting
  windowMs: 15 * 60 * 1000,
  max: 100
}))
app.use(cors({                       // CORS configuration
  origin: process.env.FRONTEND_URL,
  credentials: true
}))

// Validate input
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(12)
})

// ❌ BAD
app.use(cors({ origin: '*' }))       // Open CORS
// No rate limiting
// No input validation
```

### Data Protection

#### Encryption Standards

- **At Rest:** AES-256
- **In Transit:** TLS 1.2+
- **Database:** Transparent Data Encryption (TDE)
- **Backups:** Encrypted with separate keys

#### PII Handling

```typescript
// ✅ GOOD
// Log without PII
logger.info('User login', { userId: user.id })

// Mask sensitive data
const maskedEmail = email.replace(/(.{2}).*(@.*)/, '$1***$2')

// ❌ BAD
logger.info('User login', { email: user.email, password: user.password })
console.log(user)  // May contain PII
```

### Vulnerability Management

#### Scanning Schedule

```
Daily:     Dependency scanning (npm audit, pip check)
Weekly:    Container scanning (Trivy)
Monthly:   Full security audit
Quarterly: Penetration testing
```

#### Patch Management

- **Critical:** Within 24 hours
- **High:** Within 7 days
- **Medium:** Within 30 days
- **Low:** Next maintenance window

---

## Deployment Procedures

### Pre-Deployment Checklist

```markdown
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Security scan completed
- [ ] Documentation updated
- [ ] Database migrations tested
- [ ] Rollback plan documented
- [ ] Stakeholders notified
- [ ] Monitoring alerts configured
- [ ] Feature flags configured (if applicable)
- [ ] Backup verified
```

### Deployment Windows

**Production:**
- Tuesday-Thursday: 10:00 AM - 2:00 PM EST
- No deployments on Fridays or before holidays
- Emergency hotfixes: Anytime with approval

**Staging:**
- Monday-Friday: Anytime
- Automated deployments allowed

**Development:**
- Anytime
- Continuous deployment enabled

### Deployment Process

#### 1. Pre-Deployment

```bash
# Run tests
npm test
npm run test:integration

# Security scan
npm audit
docker scan backend:latest

# Build
npm run build

# Tag release
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin v1.0.0
```

#### 2. Deployment

```bash
# Staging deployment
./scripts/deploy.sh staging

# Smoke tests
./scripts/smoke-test.sh staging

# Production deployment (with approval)
./scripts/deploy.sh production

# Verify deployment
./scripts/health-check.sh production
```

#### 3. Post-Deployment

```bash
# Monitor logs
kubectl logs -f deployment/backend

# Check metrics
curl https://api.dotcopilot.com/metrics

# Verify health
curl https://api.dotcopilot.com/health/ready

# Update status page
./scripts/update-status.sh "Deployment v1.0.0 complete"
```

### Rollback Procedure

```bash
# Immediate rollback
./scripts/rollback.sh production v0.9.9

# Verify rollback
./scripts/health-check.sh production

# Notify team
./scripts/notify-team.sh "Rolled back to v0.9.9"

# Post-mortem
./scripts/create-incident.sh "Deployment v1.0.0 rollback"
```

---

## Monitoring & Alerting

### Metrics to Monitor

#### Application Metrics

```
- Request rate (requests/second)
- Error rate (errors/total requests)
- Response time (p50, p95, p99)
- Active connections
- Queue depth
- Cache hit rate
```

#### Infrastructure Metrics

```
- CPU usage (%)
- Memory usage (%)
- Disk usage (%)
- Network I/O (bytes/second)
- Database connections
- Container restarts
```

#### Business Metrics

```
- User signups
- Active users
- Feature usage
- Conversion rate
- Revenue
```

### Alert Thresholds

#### Critical (Page immediately)

```
- Error rate > 5%
- Response time p99 > 5s
- CPU usage > 90% for 5 minutes
- Memory usage > 95%
- Database connections > 90% of max
- Service down
```

#### Warning (Notify during business hours)

```
- Error rate > 1%
- Response time p99 > 2s
- CPU usage > 70% for 15 minutes
- Memory usage > 80%
- Disk usage > 80%
```

#### Info (Log only)

```
- Deployment started/completed
- Configuration changed
- Scheduled maintenance
```

### On-Call Rotation

**Schedule:**
- Primary: Week 1-2
- Secondary: Week 3-4
- Rotation: Every 2 weeks

**Responsibilities:**
- Respond to alerts within 15 minutes
- Escalate if needed within 30 minutes
- Document all incidents
- Handoff notes to next on-call

---

## Incident Response

### Severity Levels

#### SEV-1 (Critical)
- **Definition:** Complete service outage
- **Response Time:** Immediate
- **Escalation:** CTO notified immediately
- **Communication:** Status page updated every 30 minutes

#### SEV-2 (High)
- **Definition:** Major feature unavailable
- **Response Time:** 30 minutes
- **Escalation:** Engineering manager notified
- **Communication:** Status page updated hourly

#### SEV-3 (Medium)
- **Definition:** Minor feature degraded
- **Response Time:** 2 hours
- **Escalation:** Team lead notified
- **Communication:** Internal only

#### SEV-4 (Low)
- **Definition:** Cosmetic issue
- **Response Time:** Next business day
- **Escalation:** None
- **Communication:** Ticket only

### Incident Response Process

#### 1. Detection & Triage (0-5 minutes)

```markdown
1. Alert received
2. Acknowledge alert
3. Assess severity
4. Create incident ticket
5. Notify team
```

#### 2. Investigation (5-30 minutes)

```markdown
1. Check monitoring dashboards
2. Review recent changes
3. Check logs
4. Identify root cause
5. Document findings
```

#### 3. Mitigation (30-60 minutes)

```markdown
1. Implement fix or rollback
2. Verify fix
3. Monitor for recurrence
4. Update status page
```

#### 4. Resolution (1-2 hours)

```markdown
1. Confirm issue resolved
2. Close incident
3. Update stakeholders
4. Schedule post-mortem
```

#### 5. Post-Mortem (Within 48 hours)

```markdown
1. Timeline of events
2. Root cause analysis
3. Impact assessment
4. Action items
5. Process improvements
```

---

## Change Management

### Change Types

#### Standard Change
- Pre-approved
- Low risk
- Well documented
- Examples: Dependency updates, config changes

#### Normal Change
- Requires approval
- Medium risk
- Tested in staging
- Examples: Feature releases, infrastructure changes

#### Emergency Change
- Expedited approval
- High risk acceptable
- Security or availability issue
- Examples: Security patches, critical bug fixes

### Change Request Process

```markdown
1. Submit change request (Jira/Linear)
2. Technical review (2 approvers)
3. Security review (if applicable)
4. Schedule deployment
5. Execute change
6. Verify success
7. Close change request
```

### Change Advisory Board (CAB)

**Members:**
- CTO (Chair)
- Engineering Manager
- Security Lead
- Operations Lead

**Meeting Schedule:**
- Weekly: Tuesday 2:00 PM EST
- Emergency: As needed

**Approval Criteria:**
- Technical feasibility
- Security impact
- Business impact
- Resource availability
- Rollback plan

---

## Documentation Standards

### Required Documentation

#### Code Documentation

```typescript
/**
 * Authenticates a user with email and password
 * 
 * @param email - User's email address
 * @param password - User's password (will be hashed)
 * @returns JWT token and user object
 * @throws {AuthenticationError} If credentials are invalid
 * @throws {RateLimitError} If too many attempts
 * 
 * @example
 * const { token, user } = await authenticateUser(
 *   'user@example.com',
 *   'password123'
 * )
 */
async function authenticateUser(
  email: string,
  password: string
): Promise<{ token: string; user: User }> {
  // Implementation
}
```

#### API Documentation

```yaml
/api/users/{id}:
  get:
    summary: Get user by ID
    description: Returns a single user
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string
    responses:
      200:
        description: User found
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/User'
      404:
        description: User not found
      401:
        description: Unauthorized
```

#### Runbook Documentation

```markdown
# Service Restart Runbook

## When to Use
- Service is unresponsive
- Memory leak suspected
- After configuration change

## Prerequisites
- SSH access to server
- Sudo privileges
- Backup verified

## Steps
1. Check service status
   ```bash
   systemctl status backend
   ```

2. Stop service gracefully
   ```bash
   systemctl stop backend
   ```

3. Verify stopped
   ```bash
   ps aux | grep backend
   ```

4. Start service
   ```bash
   systemctl start backend
   ```

5. Verify health
   ```bash
   curl http://localhost:3000/health
   ```

## Rollback
If service fails to start:
1. Check logs: `journalctl -u backend -n 100`
2. Restore previous version
3. Escalate to on-call engineer
```

### Documentation Locations

```
/docs
  /api              # API documentation
  /architecture     # System architecture
  /runbooks         # Operational procedures
  /guides           # How-to guides
  /decisions        # Architecture Decision Records (ADRs)
  
/README.md          # Project overview
/CONTRIBUTING.md    # Contribution guidelines
/CHANGELOG.md       # Version history
/SECURITY.md        # Security policies
```

---

## Code Review Process

### Review Checklist

#### Functionality
- [ ] Code works as intended
- [ ] Edge cases handled
- [ ] Error handling implemented
- [ ] Tests added/updated
- [ ] No breaking changes (or documented)

#### Code Quality
- [ ] Follows style guide
- [ ] No code duplication
- [ ] Functions are small and focused
- [ ] Variable names are descriptive
- [ ] Comments explain "why" not "what"

#### Security
- [ ] Input validation
- [ ] No hardcoded secrets
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection

#### Performance
- [ ] No N+1 queries
- [ ] Appropriate caching
- [ ] No memory leaks
- [ ] Efficient algorithms
- [ ] Database indexes

#### Documentation
- [ ] README updated
- [ ] API docs updated
- [ ] Inline comments for complex logic
- [ ] CHANGELOG updated

### Review Guidelines

**For Authors:**
1. Keep PRs small (< 400 lines)
2. Write clear description
3. Link to issue/ticket
4. Add screenshots for UI changes
5. Respond to feedback promptly

**For Reviewers:**
1. Review within 24 hours
2. Be constructive and specific
3. Ask questions, don't demand
4. Approve when satisfied
5. Test locally if needed

**Review Comments:**
```markdown
# ✅ GOOD
"Consider using a Map here for O(1) lookup instead of Array.find() which is O(n)"

"This function is doing too much. Could we split it into smaller functions?"

"Great use of TypeScript generics here!"

# ❌ BAD
"This is wrong"
"Why did you do it this way?"
"Just use a Map"
```

---

## Testing Standards

### Test Coverage Requirements

```
Unit Tests:        80% minimum
Integration Tests: 70% minimum
E2E Tests:        Critical paths only
```

### Test Structure

```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!'
      }
      
      // Act
      const user = await userService.createUser(userData)
      
      // Assert
      expect(user).toBeDefined()
      expect(user.email).toBe(userData.email)
      expect(user.password).not.toBe(userData.password) // Should be hashed
    })
    
    it('should throw error with invalid email', async () => {
      // Arrange
      const userData = {
        email: 'invalid-email',
        password: 'SecurePass123!'
      }
      
      // Act & Assert
      await expect(userService.createUser(userData))
        .rejects
        .toThrow('Invalid email format')
    })
  })
})
```

### Test Naming

```typescript
// ✅ GOOD
it('should return 404 when user not found')
it('should hash password before saving')
it('should send email verification after signup')

// ❌ BAD
it('test user creation')
it('works')
it('should work correctly')
```

### Mocking

```typescript
// ✅ GOOD - Mock external dependencies
jest.mock('../services/emailService')

const mockSendEmail = jest.fn()
emailService.sendEmail = mockSendEmail

// ❌ BAD - Don't mock internal logic
jest.mock('../utils/validation')  // Test real validation
```

---

## Appendix

### Useful Commands

#### Docker

```bash
# Build image
docker build -t backend:1.0.0 .

# Run container
docker run -d -p 3000:3000 backend:1.0.0

# View logs
docker logs -f container_name

# Execute command in container
docker exec -it container_name sh

# Clean up
docker system prune -a
```

#### Git

```bash
# Create feature branch
git checkout -b feature/new-feature

# Commit with message
git commit -m "feat: add new feature"

# Push branch
git push origin feature/new-feature

# Rebase on main
git rebase main

# Interactive rebase (squash commits)
git rebase -i HEAD~3
```

#### Azure CLI

```bash
# Login
az login

# List resources
az resource list --resource-group rg-dot-copilot-prod

# Get app service logs
az webapp log tail --name app-dot-copilot-backend-prod --resource-group rg-dot-copilot-prod

# Restart app service
az webapp restart --name app-dot-copilot-backend-prod --resource-group rg-dot-copilot-prod
```

### Contact Information

**Engineering Team:**
- Email: engineering@dotcopilot.com
- Slack: #engineering

**On-Call:**
- PagerDuty: https://dotcopilot.pagerduty.com
- Phone: 1-800-XXX-XXXX

**Management:**
- CTO: cto@dotcopilot.com
- VP Engineering: vp-eng@dotcopilot.com

### External Resources

- [Azure Documentation](https://docs.microsoft.com/azure)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

**Document Version:** 1.0  
**Effective Date:** 2025-12-15  
**Next Review:** 2026-03-15  
**Approved By:** Infrastructure Team

