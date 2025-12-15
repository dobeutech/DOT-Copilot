# Rate Limiting Configuration

## Overview

Rate limiting has been implemented in nginx to protect against abuse, DDoS attacks, and ensure fair resource usage across all clients.

## Configuration

### Rate Limiting Zones

Defined in `docker/nginx/nginx.conf`:

```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=general_limit:10m rate=100r/s;

# Connection limiting
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;
```

### Zone Definitions

| Zone | Rate | Burst | Use Case |
|------|------|-------|----------|
| `api_limit` | 10 req/sec | 20 | General API endpoints |
| `auth_limit` | 5 req/min | 5 | Authentication endpoints |
| `general_limit` | 100 req/sec | - | General traffic |
| `conn_limit` | 10 connections | - | Concurrent connections per IP |

## Applied Limits

### API Endpoints (`/api/`)

```nginx
location /api/ {
    limit_req zone=api_limit burst=20 nodelay;
    limit_conn conn_limit 10;
    # ... proxy configuration
}
```

**Limits:**
- **Rate:** 10 requests per second
- **Burst:** Up to 20 requests can be queued
- **Connections:** Maximum 10 concurrent connections per IP
- **Behavior:** `nodelay` - excess requests rejected immediately

### Authentication Endpoints (`/api/auth/`)

```nginx
location /api/auth/ {
    limit_req zone=auth_limit burst=5 nodelay;
    limit_conn conn_limit 5;
    # ... proxy configuration
}
```

**Limits:**
- **Rate:** 5 requests per minute
- **Burst:** Up to 5 requests can be queued
- **Connections:** Maximum 5 concurrent connections per IP
- **Behavior:** `nodelay` - excess requests rejected immediately

**Rationale:** Stricter limits on auth endpoints to prevent brute force attacks

### MCP Gateway Endpoints (`/mcp/`)

```nginx
location /mcp/ {
    limit_req zone=api_limit burst=20 nodelay;
    limit_conn conn_limit 10;
    # ... proxy configuration
}
```

**Limits:**
- **Rate:** 10 requests per second
- **Burst:** Up to 20 requests can be queued
- **Connections:** Maximum 10 concurrent connections per IP

## Response Codes

When rate limits are exceeded:

- **429 Too Many Requests** - Rate limit exceeded
- **503 Service Unavailable** - Connection limit exceeded

### Response Headers

```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1639584000
Retry-After: 1
```

## Monitoring

### Log Format

Rate limit violations are logged in nginx error log:

```
2025/12/15 06:10:00 [error] 123#123: *456 limiting requests, excess: 20.000 by zone "api_limit", client: 192.168.1.100, server: _, request: "GET /api/users HTTP/1.1"
```

### Metrics to Track

1. **Rate limit hits** - Number of 429 responses
2. **Connection limit hits** - Number of 503 responses
3. **Burst usage** - How often burst capacity is used
4. **Top offending IPs** - IPs hitting limits most frequently

## Testing

### Test Rate Limits

```bash
# Test API rate limit (should fail after 10 requests/sec)
for i in {1..15}; do
  curl -w "\n%{http_code}\n" http://localhost:8080/api/health
  sleep 0.05
done

# Test auth rate limit (should fail after 5 requests/min)
for i in {1..10}; do
  curl -w "\n%{http_code}\n" http://localhost:8080/api/auth/login
  sleep 1
done

# Test connection limit
for i in {1..15}; do
  curl http://localhost:8080/api/users &
done
wait
```

### Expected Results

**API Limit Test:**
- First 10 requests: `200 OK`
- Next 20 requests: `200 OK` (burst)
- Remaining requests: `429 Too Many Requests`

**Auth Limit Test:**
- First 5 requests: `200 OK`
- Next 5 requests: `200 OK` (burst)
- Remaining requests: `429 Too Many Requests`

**Connection Limit Test:**
- First 10 connections: Successful
- Remaining connections: `503 Service Unavailable`

## Tuning Recommendations

### Development Environment

For development, you may want to increase limits:

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=50r/m;
```

### Production Environment

Current limits are appropriate for production. Monitor and adjust based on:

1. **Legitimate traffic patterns**
2. **Attack patterns observed**
3. **Server capacity**
4. **Business requirements**

### Per-User Rate Limiting

For authenticated users, consider implementing per-user limits:

```nginx
# In your application, set a custom header
# X-User-ID: user123

map $http_x_user_id $limit_key {
    default $binary_remote_addr;
    ~^.+$ $http_x_user_id;
}

limit_req_zone $limit_key zone=user_limit:10m rate=100r/s;
```

## Whitelisting

### Whitelist Trusted IPs

```nginx
geo $limit {
    default 1;
    10.0.0.0/8 0;        # Internal network
    192.168.0.0/16 0;    # Private network
    172.16.0.0/12 0;     # Docker network
}

map $limit $limit_key {
    0 "";
    1 $binary_remote_addr;
}

limit_req_zone $limit_key zone=api_limit:10m rate=10r/s;
```

### Whitelist by User Agent

```nginx
map $http_user_agent $limit_key {
    default $binary_remote_addr;
    ~*monitoring-bot "";  # Whitelist monitoring
}

limit_req_zone $limit_key zone=api_limit:10m rate=10r/s;
```

## Error Handling

### Custom Error Pages

Create custom error pages for rate limit responses:

```nginx
error_page 429 /429.html;
location = /429.html {
    root /usr/share/nginx/html;
    internal;
}
```

**429.html:**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Rate Limit Exceeded</title>
</head>
<body>
    <h1>429 - Too Many Requests</h1>
    <p>You have exceeded the rate limit. Please try again later.</p>
    <p>If you believe this is an error, please contact support.</p>
</body>
</html>
```

## Integration with Application

### Backend Rate Limit Headers

Your backend should also return rate limit headers:

```typescript
// backend/src/middleware/rateLimit.ts
app.use((req, res, next) => {
  res.setHeader('X-RateLimit-Limit', '10');
  res.setHeader('X-RateLimit-Remaining', '5');
  res.setHeader('X-RateLimit-Reset', Date.now() + 1000);
  next();
});
```

### Client-Side Handling

```typescript
// frontend/src/api/client.ts
async function apiCall(url: string) {
  try {
    const response = await fetch(url);
    
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      console.warn(`Rate limited. Retry after ${retryAfter}s`);
      
      // Implement exponential backoff
      await sleep(parseInt(retryAfter) * 1000);
      return apiCall(url);
    }
    
    return response;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}
```

## Security Considerations

### DDoS Protection

Rate limiting provides basic DDoS protection but should be combined with:

1. **Azure Front Door** - WAF rules and DDoS protection
2. **Cloudflare** - Additional layer of protection
3. **Fail2ban** - Ban IPs after repeated violations
4. **Geographic restrictions** - Block traffic from specific regions

### Brute Force Protection

Authentication endpoints have stricter limits (5 req/min) to prevent:

- Password guessing attacks
- Credential stuffing
- Account enumeration

### API Abuse Prevention

General API limits (10 req/sec) prevent:

- Scraping
- Resource exhaustion
- Unfair usage

## Troubleshooting

### Issue: Legitimate Users Getting Rate Limited

**Solution:**
1. Increase burst capacity
2. Implement per-user rate limiting
3. Whitelist known good IPs
4. Add authentication-based limits

### Issue: Rate Limits Not Working

**Check:**
1. Nginx configuration syntax: `nginx -t`
2. Zone memory allocation: `limit_req_zone ... :10m`
3. Logs: `tail -f /var/log/nginx/error.log`
4. Test with curl: See testing section above

### Issue: Too Many False Positives

**Solution:**
1. Analyze traffic patterns
2. Adjust rate limits based on data
3. Implement graduated limits (warning → throttle → block)
4. Add monitoring and alerting

## Monitoring Dashboard

### Prometheus Metrics

```nginx
# In nginx.conf
http {
    # ... existing config
    
    # Expose metrics
    server {
        listen 9113;
        location /metrics {
            stub_status;
        }
    }
}
```

### Grafana Dashboard

Track these metrics:

1. **Request rate** - Requests per second
2. **Rate limit hits** - 429 responses
3. **Connection limit hits** - 503 responses
4. **Top IPs** - IPs with most requests
5. **Burst usage** - Percentage of burst capacity used

## Best Practices

1. **Start conservative** - Begin with strict limits and relax as needed
2. **Monitor continuously** - Track rate limit hits and adjust
3. **Document limits** - Make limits clear in API documentation
4. **Provide feedback** - Return helpful error messages
5. **Implement gracefully** - Use burst capacity for legitimate spikes
6. **Test thoroughly** - Test limits before deploying
7. **Plan for growth** - Review limits as traffic grows
8. **Layer defenses** - Combine with other security measures

## References

- [Nginx Rate Limiting](https://www.nginx.com/blog/rate-limiting-nginx/)
- [Nginx ngx_http_limit_req_module](http://nginx.org/en/docs/http/ngx_http_limit_req_module.html)
- [Nginx ngx_http_limit_conn_module](http://nginx.org/en/docs/http/ngx_http_limit_conn_module.html)

---

**Last Updated:** 2025-12-15  
**Status:** Implemented  
**Next Review:** Monitor for 1 week, adjust as needed
