# Health Check Endpoints Implementation Guide

## Overview

Health check endpoints are critical for monitoring service availability and readiness. This guide provides implementation details for all services in the DOT-Copilot infrastructure.

## Endpoint Standards

### `/health` - Liveness Probe
**Purpose:** Indicates if the service is running  
**Response Time:** < 100ms  
**Status Codes:**
- `200 OK` - Service is alive
- `503 Service Unavailable` - Service is down

### `/health/ready` - Readiness Probe
**Purpose:** Indicates if the service is ready to accept traffic  
**Response Time:** < 500ms  
**Status Codes:**
- `200 OK` - Service is ready
- `503 Service Unavailable` - Service is not ready (dependencies unavailable)

---

## Backend (Node.js/Express) Implementation

### File: `backend/src/server.ts`

```typescript
import express from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

// Liveness probe - simple check that service is running
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'dot-copilot-backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Readiness probe - check dependencies
app.get('/health/ready', async (req, res) => {
  const checks = {
    database: false,
    timestamp: new Date().toISOString()
  };

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;

    // All checks passed
    res.status(200).json({
      status: 'ready',
      service: 'dot-copilot-backend',
      checks
    });
  } catch (error) {
    // At least one check failed
    res.status(503).json({
      status: 'not ready',
      service: 'dot-copilot-backend',
      checks,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Detailed health check (optional - for monitoring)
app.get('/health/detailed', async (req, res) => {
  const startTime = Date.now();
  const checks: Record<string, any> = {};

  // Database check
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      status: 'healthy',
      responseTime: Date.now() - dbStart
    };
  } catch (error) {
    checks.database = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }

  // Memory check
  const memUsage = process.memoryUsage();
  checks.memory = {
    status: memUsage.heapUsed < memUsage.heapTotal * 0.9 ? 'healthy' : 'warning',
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
    external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
  };

  // Overall status
  const allHealthy = Object.values(checks).every(
    check => check.status === 'healthy' || check.status === 'warning'
  );

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    service: 'dot-copilot-backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    responseTime: Date.now() - startTime,
    checks
  });
});

export default app;
```

---

## Frontend (React/Nginx) Implementation

### File: `frontend/public/health.html`

```html
<!DOCTYPE html>
<html>
<head>
    <title>Health Check</title>
</head>
<body>
    <script>
        document.write(JSON.stringify({
            status: 'healthy',
            service: 'dot-copilot-frontend',
            timestamp: new Date().toISOString()
        }));
    </script>
</body>
</html>
```

### File: `frontend/nginx.conf`

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Health check endpoint
    location /health {
        access_log off;
        return 200 '{"status":"healthy","service":"dot-copilot-frontend","timestamp":"$time_iso8601"}';
        add_header Content-Type application/json;
    }

    # Readiness check (same as liveness for static frontend)
    location /health/ready {
        access_log off;
        return 200 '{"status":"ready","service":"dot-copilot-frontend","timestamp":"$time_iso8601"}';
        add_header Content-Type application/json;
    }

    # Application routes
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## API Server (FastAPI) Implementation

### File: `docker/api/main.py`

```python
from fastapi import FastAPI, status
from fastapi.responses import JSONResponse
from datetime import datetime
import time
import psutil
import asyncpg

app = FastAPI()

# Store startup time
startup_time = time.time()

@app.get("/health")
async def health_check():
    """Liveness probe - simple check that service is running"""
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "status": "healthy",
            "service": "dot-copilot-api",
            "timestamp": datetime.utcnow().isoformat(),
            "uptime": time.time() - startup_time,
            "environment": os.getenv("ENVIRONMENT", "development")
        }
    )

@app.get("/health/ready")
async def readiness_check():
    """Readiness probe - check dependencies"""
    checks = {
        "database": False,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    try:
        # Check database connection
        conn = await asyncpg.connect(os.getenv("DATABASE_URL"))
        await conn.fetchval("SELECT 1")
        await conn.close()
        checks["database"] = True
        
        # All checks passed
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "status": "ready",
                "service": "dot-copilot-api",
                "checks": checks
            }
        )
    except Exception as e:
        # At least one check failed
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "not ready",
                "service": "dot-copilot-api",
                "checks": checks,
                "error": str(e)
            }
        )

@app.get("/health/detailed")
async def detailed_health_check():
    """Detailed health check for monitoring"""
    start_time = time.time()
    checks = {}
    
    # Database check
    try:
        db_start = time.time()
        conn = await asyncpg.connect(os.getenv("DATABASE_URL"))
        await conn.fetchval("SELECT 1")
        await conn.close()
        checks["database"] = {
            "status": "healthy",
            "responseTime": (time.time() - db_start) * 1000
        }
    except Exception as e:
        checks["database"] = {
            "status": "unhealthy",
            "error": str(e)
        }
    
    # Memory check
    memory = psutil.virtual_memory()
    checks["memory"] = {
        "status": "healthy" if memory.percent < 90 else "warning",
        "used": f"{memory.used / 1024 / 1024:.0f}MB",
        "total": f"{memory.total / 1024 / 1024:.0f}MB",
        "percent": f"{memory.percent:.1f}%"
    }
    
    # CPU check
    cpu_percent = psutil.cpu_percent(interval=0.1)
    checks["cpu"] = {
        "status": "healthy" if cpu_percent < 80 else "warning",
        "percent": f"{cpu_percent:.1f}%"
    }
    
    # Overall status
    all_healthy = all(
        check.get("status") in ["healthy", "warning"]
        for check in checks.values()
    )
    
    status_code = status.HTTP_200_OK if all_healthy else status.HTTP_503_SERVICE_UNAVAILABLE
    
    return JSONResponse(
        status_code=status_code,
        content={
            "status": "healthy" if all_healthy else "degraded",
            "service": "dot-copilot-api",
            "timestamp": datetime.utcnow().isoformat(),
            "uptime": time.time() - startup_time,
            "responseTime": (time.time() - start_time) * 1000,
            "checks": checks
        }
    )
```

---

## MCP Gateway Implementation

### File: `docker/mcp-gateway/main.py`

```python
from fastapi import FastAPI, status
from fastapi.responses import JSONResponse
from datetime import datetime
import time
import redis

app = FastAPI()
startup_time = time.time()

@app.get("/health")
async def health_check():
    """Liveness probe"""
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "status": "healthy",
            "service": "mcp-gateway",
            "timestamp": datetime.utcnow().isoformat(),
            "uptime": time.time() - startup_time
        }
    )

@app.get("/health/ready")
async def readiness_check():
    """Readiness probe - check Redis connection"""
    checks = {
        "redis": False,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    try:
        # Check Redis connection
        r = redis.from_url(os.getenv("REDIS_URL"))
        r.ping()
        checks["redis"] = True
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "status": "ready",
                "service": "mcp-gateway",
                "checks": checks
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "not ready",
                "service": "mcp-gateway",
                "checks": checks,
                "error": str(e)
            }
        )
```

---

## Docker Compose Health Checks

### Updated `docker-compose.yml`

```yaml
services:
  backend:
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  frontend:
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:80/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

  api_server:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  mcp_gateway:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

---

## Kubernetes Probes (Future)

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: dot-copilot-backend
spec:
  containers:
  - name: backend
    image: dot-copilot-backend:latest
    livenessProbe:
      httpGet:
        path: /health
        port: 3001
      initialDelaySeconds: 30
      periodSeconds: 10
      timeoutSeconds: 5
      failureThreshold: 3
    readinessProbe:
      httpGet:
        path: /health/ready
        port: 3001
      initialDelaySeconds: 10
      periodSeconds: 5
      timeoutSeconds: 3
      failureThreshold: 3
```

---

## Monitoring Integration

### Prometheus Metrics

```typescript
// backend/src/metrics.ts
import promClient from 'prom-client';

const register = new promClient.Registry();

// Health check metrics
const healthCheckDuration = new promClient.Histogram({
  name: 'health_check_duration_seconds',
  help: 'Duration of health checks',
  labelNames: ['endpoint', 'status'],
  registers: [register]
});

const healthCheckTotal = new promClient.Counter({
  name: 'health_check_total',
  help: 'Total number of health checks',
  labelNames: ['endpoint', 'status'],
  registers: [register]
});

export { healthCheckDuration, healthCheckTotal, register };
```

### Application Insights

```typescript
// backend/src/server.ts
import { TelemetryClient } from 'applicationinsights';

const appInsights = new TelemetryClient();

app.get('/health/ready', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Perform checks...
    
    appInsights.trackMetric({
      name: 'HealthCheckDuration',
      value: Date.now() - startTime
    });
    
    appInsights.trackEvent({
      name: 'HealthCheckSuccess',
      properties: { endpoint: '/health/ready' }
    });
    
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    appInsights.trackException({ exception: error });
    res.status(503).json({ status: 'not ready' });
  }
});
```

---

## Testing Health Checks

### Manual Testing

```bash
# Test liveness
curl http://localhost:3001/health

# Test readiness
curl http://localhost:3001/health/ready

# Test detailed health
curl http://localhost:3001/health/detailed

# Test with Docker Compose
docker-compose ps
docker-compose exec backend wget --spider http://localhost:3001/health
```

### Automated Testing

```typescript
// backend/src/__tests__/health.test.ts
import request from 'supertest';
import app from '../server';

describe('Health Check Endpoints', () => {
  describe('GET /health', () => {
    it('should return 200 OK', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
    });

    it('should include uptime', async () => {
      const response = await request(app).get('/health');
      expect(response.body.uptime).toBeGreaterThan(0);
    });
  });

  describe('GET /health/ready', () => {
    it('should return 200 when database is available', async () => {
      const response = await request(app).get('/health/ready');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ready');
      expect(response.body.checks.database).toBe(true);
    });
  });
});
```

---

## Troubleshooting

### Common Issues

1. **Health check fails immediately**
   - Increase `start_period` in Docker health check
   - Check if service is listening on correct port
   - Verify network connectivity

2. **Readiness check always fails**
   - Check database connection string
   - Verify database is running and accessible
   - Check firewall rules

3. **Health check times out**
   - Reduce timeout value
   - Optimize health check queries
   - Check for blocking operations

### Debug Commands

```bash
# Check service logs
docker-compose logs backend

# Check health status
docker inspect --format='{{json .State.Health}}' backend | jq

# Test health check manually
docker-compose exec backend curl -v http://localhost:3001/health

# Check network connectivity
docker-compose exec backend ping database
```

---

## Best Practices

1. **Keep health checks lightweight** - < 100ms for liveness, < 500ms for readiness
2. **Don't check external dependencies in liveness** - Only check if service is running
3. **Check all critical dependencies in readiness** - Database, cache, external APIs
4. **Use appropriate timeouts** - Balance between false positives and quick detection
5. **Log health check failures** - But don't spam logs with successful checks
6. **Monitor health check metrics** - Track duration and failure rates
7. **Test health checks** - Include in unit and integration tests
8. **Document expected behavior** - What each endpoint checks and why

---

## Implementation Checklist

- [ ] Implement `/health` endpoint in backend
- [ ] Implement `/health/ready` endpoint in backend
- [ ] Implement `/health` endpoint in frontend (nginx)
- [ ] Implement `/health` endpoint in API server
- [ ] Implement `/health` endpoint in MCP gateway
- [ ] Update Docker Compose health checks
- [ ] Add health check tests
- [ ] Configure monitoring alerts
- [ ] Document health check behavior
- [ ] Test health checks in all environments

---

**Last Updated:** 2025-12-15  
**Status:** Implementation Guide  
**Next Steps:** Implement endpoints in each service
