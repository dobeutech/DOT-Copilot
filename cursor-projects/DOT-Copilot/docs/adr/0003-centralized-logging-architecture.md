# ADR-0003: Centralized Logging Architecture

**Status:** Accepted  
**Date:** 2024-12-15  
**Deciders:** Infrastructure Team, DevOps Team, Backend Team  
**Technical Story:** [DBS-19](https://linear.app/4zonelogistics/issue/DBS-19) - Week 3

## Context

The DOT Copilot application consists of multiple services (backend API, frontend, database, MCP gateway) running in distributed environments (development, staging, production). Logging was fragmented:

**Problems:**
- **Scattered Logs:** Each service logs independently to stdout/stderr
- **No Aggregation:** Difficult to correlate events across services
- **Limited Retention:** Container logs lost on restart
- **Poor Searchability:** No full-text search or filtering
- **No Alerting:** Cannot trigger alerts on log patterns
- **Debugging Difficulty:** Hard to trace requests across services
- **Compliance Gaps:** No audit trail for security events

**Requirements:**
- Centralized log collection from all services
- Structured logging with consistent format
- Long-term retention (30-90 days)
- Full-text search and filtering
- Correlation IDs for request tracing
- Alert capabilities for critical events
- Cost-effective solution
- Easy integration with existing infrastructure

## Decision

Implement a centralized logging architecture using:

**Core Components:**
1. **Winston** - Structured logging library for Node.js
2. **Azure Monitor / Application Insights** - Cloud-native logging (production)
3. **Loki + Grafana** - Self-hosted alternative (optional)
4. **Correlation IDs** - Request tracing across services
5. **Log Levels** - Consistent severity levels
6. **Structured Format** - JSON logging for parsing

**Architecture:**
```
┌─────────────┐
│   Backend   │──┐
└─────────────┘  │
                 │
┌─────────────┐  │    ┌──────────────┐    ┌─────────────┐
│  Frontend   │──┼───▶│ Log Collector│───▶│   Storage   │
└─────────────┘  │    │  (Fluentd)   │    │ (Azure/Loki)│
                 │    └──────────────┘    └─────────────┘
┌─────────────┐  │                              │
│     API     │──┤                              ▼
└─────────────┘  │                        ┌─────────────┐
                 │                        │   Grafana   │
┌─────────────┐  │                        │  Dashboard  │
│ MCP Gateway │──┘                        └─────────────┘
└─────────────┘
```

**Log Format:**
```json
{
  "timestamp": "2024-12-15T10:30:00.000Z",
  "level": "info",
  "service": "backend-api",
  "correlationId": "req-123-456",
  "userId": "user-789",
  "method": "POST",
  "path": "/api/users",
  "statusCode": 201,
  "duration": 45,
  "message": "User created successfully",
  "metadata": {
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0..."
  }
}
```

## Alternatives Considered

### Alternative 1: ELK Stack (Elasticsearch, Logstash, Kibana)
Industry-standard logging stack.

**Pros:**
- Powerful search capabilities
- Rich visualization options
- Large ecosystem and community
- Mature and battle-tested
- Advanced analytics

**Cons:**
- High resource requirements (4GB+ RAM)
- Complex setup and maintenance
- Expensive at scale
- Elasticsearch licensing concerns
- Overkill for current needs
- Steep learning curve

**Rejected:** Too resource-intensive and complex for current scale.

### Alternative 2: CloudWatch Logs (AWS)
AWS-native logging service.

**Pros:**
- Fully managed service
- Tight AWS integration
- Pay-per-use pricing
- No infrastructure to manage
- Built-in retention policies

**Cons:**
- Vendor lock-in to AWS
- Application is Azure-focused
- Higher costs at scale
- Limited query capabilities
- Slower search performance
- Not suitable for multi-cloud

**Rejected:** Not aligned with Azure infrastructure strategy.

### Alternative 3: Splunk
Enterprise logging and monitoring platform.

**Pros:**
- Enterprise-grade features
- Powerful analytics
- Excellent support
- Comprehensive dashboards
- Advanced alerting

**Cons:**
- Very expensive ($2000+/month)
- Overkill for startup
- Complex licensing model
- Requires dedicated team
- High learning curve

**Rejected:** Cost prohibitive for current scale.

### Alternative 4: Simple File Logging
Continue with basic file-based logging.

**Pros:**
- No additional infrastructure
- Simple to implement
- No external dependencies
- Zero cost
- Easy to understand

**Cons:**
- No centralization
- Difficult to search
- No correlation
- Limited retention
- No alerting
- Poor scalability
- Manual log rotation

**Rejected:** Does not solve core problems.

### Alternative 5: Datadog
SaaS monitoring and logging platform.

**Pros:**
- Comprehensive monitoring
- Easy setup
- Great UI/UX
- Powerful features
- Good documentation

**Cons:**
- Expensive ($31/host/month)
- Vendor lock-in
- Data leaves infrastructure
- Compliance concerns
- Ongoing subscription cost

**Rejected:** Cost and data sovereignty concerns.

## Decision Rationale

Azure Monitor + Loki hybrid approach chosen because:

1. **Azure Monitor (Production):**
   - Native Azure integration
   - No infrastructure to manage
   - Built-in alerting
   - Cost-effective at current scale
   - Compliance-ready
   - Automatic scaling

2. **Loki (Development/Staging):**
   - Lightweight (200MB RAM)
   - Easy to deploy
   - Grafana integration
   - Cost-free for dev/staging
   - Good for learning

3. **Winston (Application):**
   - Node.js native
   - Flexible transports
   - Structured logging
   - Active community
   - Easy to configure

**Key Factors:**
- Aligns with Azure infrastructure
- Cost-effective ($20-50/month production)
- Scalable to future needs
- No vendor lock-in (can switch)
- Team already knows Grafana
- Supports hybrid cloud strategy

## Consequences

### Positive
- **Centralized Visibility:** All logs in one place
- **Faster Debugging:** Correlation IDs trace requests
- **Better Monitoring:** Real-time log analysis
- **Compliance:** Audit trail for security events
- **Alerting:** Automated alerts on errors
- **Cost Effective:** ~$30/month for production
- **Scalable:** Handles growth without changes
- **Flexible:** Can switch providers if needed
- **Developer Experience:** Better local debugging

### Negative
- **Additional Infrastructure:** Loki requires deployment
- **Learning Curve:** Team needs to learn new tools
- **Configuration Overhead:** More setup required
- **Storage Costs:** Log retention costs money
- **Maintenance:** Loki needs updates and monitoring
- **Query Language:** Need to learn LogQL (Loki) or KQL (Azure)
- **Network Overhead:** Logs sent over network

### Neutral
- **Log Volume:** Need to monitor and manage
- **Retention Policies:** Must define and enforce
- **Access Control:** Need to configure permissions
- **Backup Strategy:** Logs need backup plan
- **Performance Impact:** Minimal logging overhead

## Implementation Notes

### Winston Configuration
```typescript
// backend/src/config/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'backend-api',
    environment: process.env.NODE_ENV
  },
  transports: [
    // Console for development
    new winston.transports.Console({
      format: winston.format.simple()
    }),
    // Azure Application Insights for production
    new winston.transports.ApplicationInsights({
      instrumentationKey: process.env.APPINSIGHTS_INSTRUMENTATIONKEY
    })
  ]
});

export default logger;
```

### Correlation ID Middleware
```typescript
// backend/src/middleware/correlationId.ts
import { v4 as uuidv4 } from 'uuid';

export const correlationIdMiddleware = (req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || uuidv4();
  res.setHeader('x-correlation-id', req.correlationId);
  next();
};
```

### Request Logging
```typescript
// backend/src/middleware/requestLogger.ts
import logger from '../config/logger';

export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      correlationId: req.correlationId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });
  
  next();
};
```

### Loki Deployment (Docker Compose)
```yaml
# docker-compose.logging.yml
version: '3.8'

services:
  loki:
    image: grafana/loki:2.9.0
    ports:
      - "3100:3100"
    volumes:
      - ./loki-config.yml:/etc/loki/local-config.yaml
      - loki-data:/loki
    command: -config.file=/etc/loki/local-config.yaml

  promtail:
    image: grafana/promtail:2.9.0
    volumes:
      - /var/log:/var/log
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - ./promtail-config.yml:/etc/promtail/config.yml
    command: -config.file=/etc/promtail/config.yml

  grafana:
    image: grafana/grafana:10.0.0
    ports:
      - "3000:3000"
    environment:
      - GF_AUTH_ANONYMOUS_ENABLED=true
      - GF_AUTH_ANONYMOUS_ORG_ROLE=Admin
    volumes:
      - grafana-data:/var/lib/grafana

volumes:
  loki-data:
  grafana-data:
```

### Log Retention Policies
```yaml
# Production (Azure Monitor)
retention:
  default: 30 days
  security_logs: 90 days
  audit_logs: 365 days
  debug_logs: 7 days

# Development (Loki)
retention:
  default: 7 days
  max_size: 10GB
```

### Alert Rules
```yaml
# Critical errors
- alert: HighErrorRate
  expr: rate(log_messages{level="error"}[5m]) > 10
  for: 5m
  annotations:
    summary: High error rate detected
    
# Authentication failures
- alert: AuthenticationFailures
  expr: rate(log_messages{path="/api/auth/login",statusCode="401"}[5m]) > 5
  for: 2m
  annotations:
    summary: Multiple authentication failures
```

### Grafana Dashboard
```json
{
  "dashboard": {
    "title": "Application Logs",
    "panels": [
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate({service=\"backend-api\",level=\"error\"}[5m])"
          }
        ]
      },
      {
        "title": "Request Duration",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate({service=\"backend-api\"}[5m]))"
          }
        ]
      }
    ]
  }
}
```

## Related Decisions

- [ADR-0001: Infrastructure Security Implementation](./0001-infrastructure-security-implementation.md)
- [ADR-0002: Docker Build Optimization](./0002-docker-build-optimization.md)

## References

- [Winston Documentation](https://github.com/winstonjs/winston)
- [Azure Monitor Logs](https://docs.microsoft.com/azure/azure-monitor/logs/)
- [Grafana Loki](https://grafana.com/oss/loki/)
- [Structured Logging Best Practices](https://www.loggly.com/ultimate-guide/node-logging-basics/)
- [Implementation Guide](../CENTRALIZED_LOGGING.md)

## Metrics

### Before Implementation
- Log aggregation: None
- Search capability: grep only
- Retention: Until container restart
- Correlation: Manual
- Alerting: None
- Cost: $0

### After Implementation
- Log aggregation: All services centralized
- Search capability: Full-text with filters
- Retention: 30 days (production), 7 days (dev)
- Correlation: Automatic via correlation IDs
- Alerting: Automated on critical events
- Cost: ~$30/month (production)

### Success Criteria (All Met)
- ✅ All services send logs to central location
- ✅ Structured JSON format implemented
- ✅ Correlation IDs in all requests
- ✅ Grafana dashboards created
- ✅ Alert rules configured
- ✅ 30-day retention in production
- ✅ Search and filter working
- ✅ Documentation complete

---

**Last Updated:** 2024-12-16  
**Implementation Commit:** c7952cc, a778d29
