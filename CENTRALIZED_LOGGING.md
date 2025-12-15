# Centralized Logging Configuration

## Overview

Centralized logging configuration for DOT-Copilot infrastructure using multiple logging solutions.

## Logging Stack Options

### Option 1: ELK Stack (Elasticsearch, Logstash, Kibana)
### Option 2: Loki + Grafana (Recommended for Docker)
### Option 3: Azure Application Insights (Production)

---

## Option 1: ELK Stack Configuration

### docker-compose.yml Addition

```yaml
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: elasticsearch
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - xpack.security.enabled=false
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    networks:
      - monitoring_network
    ports:
      - "127.0.0.1:9200:9200"
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    container_name: logstash
    volumes:
      - ./logging/logstash/pipeline:/usr/share/logstash/pipeline
      - ./logging/logstash/config/logstash.yml:/usr/share/logstash/config/logstash.yml
    networks:
      - monitoring_network
    depends_on:
      - elasticsearch
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    container_name: kibana
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    networks:
      - monitoring_network
    ports:
      - "127.0.0.1:5601:5601"
    depends_on:
      - elasticsearch
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

volumes:
  elasticsearch_data:
```

### Logstash Pipeline Configuration

**File:** `logging/logstash/pipeline/logstash.conf`

```conf
input {
  # Docker logs
  gelf {
    port => 12201
  }
  
  # Application logs
  tcp {
    port => 5000
    codec => json
  }
  
  # Syslog
  syslog {
    port => 5514
  }
}

filter {
  # Parse JSON logs
  if [message] =~ /^\{.*\}$/ {
    json {
      source => "message"
    }
  }
  
  # Add timestamp
  date {
    match => [ "timestamp", "ISO8601" ]
    target => "@timestamp"
  }
  
  # Add environment
  mutate {
    add_field => {
      "environment" => "${ENVIRONMENT:development}"
    }
  }
  
  # Parse log level
  if [level] {
    mutate {
      uppercase => [ "level" ]
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "logs-%{+YYYY.MM.dd}"
  }
  
  # Debug output (optional)
  # stdout { codec => rubydebug }
}
```

---

## Option 2: Loki + Grafana (Recommended)

### docker-compose.yml Addition

```yaml
services:
  loki:
    image: grafana/loki:2.9.0
    container_name: loki
    command: -config.file=/etc/loki/local-config.yaml
    volumes:
      - ./logging/loki/config.yaml:/etc/loki/local-config.yaml
      - loki_data:/loki
    networks:
      - monitoring_network
    ports:
      - "127.0.0.1:3100:3100"
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  promtail:
    image: grafana/promtail:2.9.0
    container_name: promtail
    command: -config.file=/etc/promtail/config.yml
    volumes:
      - ./logging/promtail/config.yml:/etc/promtail/config.yml
      - /var/log:/var/log:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
    networks:
      - monitoring_network
    depends_on:
      - loki
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
        reservations:
          cpus: '0.25'
          memory: 128M

volumes:
  loki_data:
```

### Loki Configuration

**File:** `logging/loki/config.yaml`

```yaml
auth_enabled: false

server:
  http_listen_port: 3100
  grpc_listen_port: 9096

common:
  path_prefix: /loki
  storage:
    filesystem:
      chunks_directory: /loki/chunks
      rules_directory: /loki/rules
  replication_factor: 1
  ring:
    instance_addr: 127.0.0.1
    kvstore:
      store: inmemory

schema_config:
  configs:
    - from: 2020-10-24
      store: boltdb-shipper
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 24h

ruler:
  alertmanager_url: http://localhost:9093

# Retention
limits_config:
  retention_period: 168h  # 7 days
  
# Compactor
compactor:
  working_directory: /loki/compactor
  shared_store: filesystem
  compaction_interval: 10m
  retention_enabled: true
  retention_delete_delay: 2h
  retention_delete_worker_count: 150
```

### Promtail Configuration

**File:** `logging/promtail/config.yml`

```yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  # Docker containers
  - job_name: docker
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
        refresh_interval: 5s
    relabel_configs:
      - source_labels: ['__meta_docker_container_name']
        regex: '/(.*)'
        target_label: 'container'
      - source_labels: ['__meta_docker_container_log_stream']
        target_label: 'stream'
      - source_labels: ['__meta_docker_container_label_com_docker_compose_service']
        target_label: 'service'

  # System logs
  - job_name: system
    static_configs:
      - targets:
          - localhost
        labels:
          job: varlogs
          __path__: /var/log/*log

  # Application logs
  - job_name: application
    static_configs:
      - targets:
          - localhost
        labels:
          job: app
          __path__: /var/log/app/*.log
```

### Grafana Data Source

Add to Grafana:

```yaml
apiVersion: 1

datasources:
  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
    isDefault: true
    editable: true
```

---

## Option 3: Azure Application Insights

### Application Configuration

**Backend (Node.js):**

```typescript
// backend/src/logger.ts
import { ApplicationInsights } from '@azure/monitor-opentelemetry';

if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
  ApplicationInsights.setup()
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectConsole(true)
    .start();
}

export const logger = {
  info: (message: string, properties?: any) => {
    console.log(JSON.stringify({
      level: 'INFO',
      message,
      timestamp: new Date().toISOString(),
      ...properties
    }));
  },
  error: (message: string, error?: Error, properties?: any) => {
    console.error(JSON.stringify({
      level: 'ERROR',
      message,
      error: error?.message,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      ...properties
    }));
  },
  warn: (message: string, properties?: any) => {
    console.warn(JSON.stringify({
      level: 'WARN',
      message,
      timestamp: new Date().toISOString(),
      ...properties
    }));
  }
};
```

**Python (FastAPI):**

```python
# api/logger.py
import logging
import json
from datetime import datetime
from opencensus.ext.azure.log_exporter import AzureLogHandler

# Configure Azure Application Insights
logger = logging.getLogger(__name__)

if os.getenv('APPLICATIONINSIGHTS_CONNECTION_STRING'):
    logger.addHandler(AzureLogHandler())

logger.setLevel(logging.INFO)

def log_info(message: str, **kwargs):
    logger.info(json.dumps({
        'level': 'INFO',
        'message': message,
        'timestamp': datetime.utcnow().isoformat(),
        **kwargs
    }))

def log_error(message: str, error: Exception = None, **kwargs):
    logger.error(json.dumps({
        'level': 'ERROR',
        'message': message,
        'error': str(error) if error else None,
        'timestamp': datetime.utcnow().isoformat(),
        **kwargs
    }))
```

---

## Structured Logging Format

### Standard Log Format

```json
{
  "timestamp": "2025-12-15T11:00:00.000Z",
  "level": "INFO",
  "service": "backend",
  "message": "User login successful",
  "userId": "123",
  "ip": "192.168.1.1",
  "duration": 150,
  "environment": "production"
}
```

### Log Levels

- **ERROR**: System errors, exceptions
- **WARN**: Warning conditions
- **INFO**: Informational messages
- **DEBUG**: Debug information (dev only)

### Required Fields

- `timestamp`: ISO 8601 format
- `level`: Log level
- `service`: Service name
- `message`: Log message
- `environment`: Environment name

---

## Log Aggregation

### Docker Logging Driver

**docker-compose.yml:**

```yaml
x-logging: &default-logging
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
    labels: "service,environment"
    tag: "{{.Name}}/{{.ID}}"

services:
  backend:
    logging: *default-logging
```

### Fluentd Configuration (Alternative)

```yaml
services:
  fluentd:
    image: fluent/fluentd:v1.16-1
    container_name: fluentd
    volumes:
      - ./logging/fluentd/fluent.conf:/fluentd/etc/fluent.conf
      - fluentd_data:/fluentd/log
    networks:
      - monitoring_network
    ports:
      - "127.0.0.1:24224:24224"
```

---

## Log Queries

### Loki Queries (LogQL)

```logql
# All logs from backend service
{service="backend"}

# Error logs only
{service="backend"} |= "ERROR"

# Logs with specific user
{service="backend"} | json | userId="123"

# Rate of errors
rate({service="backend"} |= "ERROR" [5m])

# Top 10 error messages
topk(10, sum by (message) (rate({service="backend"} |= "ERROR" [1h])))
```

### Elasticsearch Queries

```json
{
  "query": {
    "bool": {
      "must": [
        { "match": { "service": "backend" } },
        { "match": { "level": "ERROR" } }
      ],
      "filter": [
        { "range": { "@timestamp": { "gte": "now-1h" } } }
      ]
    }
  }
}
```

---

## Monitoring & Alerts

### Grafana Alerts

```yaml
# Alert on high error rate
- alert: HighErrorRate
  expr: |
    rate({service="backend"} |= "ERROR" [5m]) > 0.1
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High error rate detected"
    description: "Error rate is {{ $value }} errors/sec"
```

### Azure Monitor Alerts

```bicep
resource errorRateAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'high-error-rate'
  properties: {
    description: 'Alert when error rate exceeds threshold'
    severity: 2
    enabled: true
    scopes: [appInsights.id]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'ErrorRate'
          metricName: 'exceptions/count'
          operator: 'GreaterThan'
          threshold: 10
          timeAggregation: 'Total'
        }
      ]
    }
  }
}
```

---

## Best Practices

### 1. Structured Logging

```typescript
// ✅ GOOD
logger.info('User login', { userId: user.id, ip: req.ip });

// ❌ BAD
console.log(`User ${user.id} logged in from ${req.ip}`);
```

### 2. Log Levels

```typescript
// ERROR - System errors
logger.error('Database connection failed', error);

// WARN - Warning conditions
logger.warn('API rate limit approaching', { usage: 90 });

// INFO - Normal operations
logger.info('User created', { userId: user.id });

// DEBUG - Development only
logger.debug('Cache hit', { key: cacheKey });
```

### 3. Sensitive Data

```typescript
// ✅ GOOD - Mask sensitive data
logger.info('User login', { 
  email: maskEmail(user.email),
  ip: req.ip 
});

// ❌ BAD - Exposes sensitive data
logger.info('User login', { 
  email: user.email,
  password: user.password 
});
```

### 4. Context

```typescript
// ✅ GOOD - Include context
logger.error('Payment failed', {
  userId: user.id,
  orderId: order.id,
  amount: order.total,
  error: error.message
});

// ❌ BAD - No context
logger.error('Payment failed');
```

---

## Implementation Steps

### 1. Choose Logging Solution

- **Development:** Loki + Grafana
- **Production:** Azure Application Insights
- **Hybrid:** Both (local + cloud)

### 2. Deploy Logging Stack

```bash
# Add logging services to docker-compose
docker-compose up -d loki promtail grafana

# Verify services
docker-compose ps
curl http://localhost:3100/ready
```

### 3. Configure Applications

```bash
# Update application logging
# Add structured logging
# Configure log levels
```

### 4. Set Up Dashboards

```bash
# Import Grafana dashboards
# Configure alerts
# Set up notifications
```

### 5. Test Logging

```bash
# Generate test logs
curl http://localhost:3001/api/test-error

# Query logs
curl http://localhost:3100/loki/api/v1/query?query={service="backend"}
```

---

## Troubleshooting

### Logs Not Appearing

**Check Promtail:**
```bash
docker-compose logs promtail
curl http://localhost:9080/metrics
```

**Check Loki:**
```bash
docker-compose logs loki
curl http://localhost:3100/ready
```

### High Disk Usage

**Configure Retention:**
```yaml
# loki/config.yaml
limits_config:
  retention_period: 168h  # 7 days
```

**Clean Old Logs:**
```bash
docker exec loki rm -rf /loki/chunks/*
```

---

## References

- [Loki Documentation](https://grafana.com/docs/loki/latest/)
- [Promtail Configuration](https://grafana.com/docs/loki/latest/clients/promtail/)
- [Azure Application Insights](https://docs.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview)
- [ELK Stack](https://www.elastic.co/elastic-stack)

---

**Status:** Configuration Guide  
**Last Updated:** 2025-12-15  
**Recommended:** Loki + Grafana for Docker, Azure Application Insights for Production
