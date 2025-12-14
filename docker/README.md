# Docker Full Stack Implementation Plan

## 🚀 Overview

This directory contains a complete Docker-based full stack architecture implementation with:
- API Gateway (Nginx)
- FastAPI Backend
- MCP Gateway/Orchestrator
- PostgreSQL Database
- MongoDB (Optional)
- Redis Cache
- Monitoring (Prometheus + Grafana)
- Secrets Management (Vault)

## 📋 Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- OpenSSL (for SSL certificate generation)
- 4GB+ RAM available
- 20GB+ disk space

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         Nginx (API Gateway)            │
│         Ports: 80, 443                  │
└──────────────┬──────────────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
┌───▼──────┐      ┌───────▼──────┐
│ API      │      │ MCP Gateway  │
│ Server   │      │              │
│ :8000    │      │ :8000        │
└───┬──────┘      └───────┬───────┘
    │                     │
    │              ┌──────▼──────┐
    │              │ MCP Servers │
    │              │ (GitHub)    │
    │              └─────────────┘
    │
┌───▼──────────────────────────────────┐
│  Database Layer                      │
│  ┌──────────┐  ┌──────────┐         │
│  │PostgreSQL│  │ MongoDB  │         │
│  └──────────┘  └──────────┘         │
│  ┌──────────┐                        │
│  │  Redis   │                        │
│  └──────────┘                        │
└──────────────────────────────────────┘
```

## 🚦 Quick Start

### 1. Setup Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**Required changes in .env:**
- `POSTGRES_PASSWORD` - Strong password for PostgreSQL
- `MONGO_ROOT_PASSWORD` - Strong password for MongoDB
- `REDIS_PASSWORD` - Strong password for Redis
- `SECRET_KEY` - Generate random 32+ character string
- `AUTH0_CLIENT_ID` - Your Auth0 client ID
- `AUTH0_CLIENT_SECRET` - Your Auth0 client secret
- `GITHUB_TOKEN` - Your GitHub personal access token
- Other API keys as needed

### 2. Generate SSL Certificates

```bash
# Self-signed (development)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout nginx/ssl/key.pem \
    -out nginx/ssl/cert.pem \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Or use Let's Encrypt for production (see below)
```

### 3. Deploy

```bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

The script will:
- Check prerequisites
- Create necessary directories
- Generate SSL certificates
- Pull Docker images
- Build custom images
- Start all services
- Wait for health checks
- Display status

### 4. Verify Deployment

```bash
# Check service status
docker compose ps

# View logs
docker compose logs -f api_server
docker compose logs -f mcp_gateway

# Test API
curl http://localhost/api/health
curl http://localhost/api/v1/status
```

## 📁 Directory Structure

```
docker/
├── docker-compose.yml          # Main orchestration file
├── .env.example                # Environment template
├── deploy.sh                   # Deployment script
├── README.md                   # This file
│
├── nginx/                      # API Gateway
│   ├── nginx.conf             # Main config
│   ├── conf.d/                # Server configs
│   │   └── default.conf
│   ├── ssl/                   # SSL certificates
│   └── logs/                  # Log files
│
├── api/                        # FastAPI Backend
│   ├── Dockerfile
│   ├── requirements.txt
│   └── main.py
│
├── mcp-gateway/                # MCP Orchestrator
│   ├── Dockerfile
│   ├── requirements.txt
│   └── main.py
│
├── database/                   # Database init scripts
│   ├── init/                  # PostgreSQL init
│   └── mongodb-init/          # MongoDB init
│
└── monitoring/                 # Monitoring configs
    ├── prometheus.yml
    └── grafana/
        └── provisioning/
```

## 🔧 Service Configuration

### API Server

- **Port:** 8000 (internal)
- **External:** http://localhost/api
- **Docs:** http://localhost/api/docs
- **Health:** http://localhost/api/health

### MCP Gateway

- **Port:** 8000 (internal)
- **External:** http://localhost/mcp
- **Health:** http://localhost/mcp/health

### Database

- **PostgreSQL:** Port 5432 (internal only)
- **MongoDB:** Port 27017 (internal only)
- **Redis:** Port 6379 (internal only)

### Monitoring

- **Grafana:** http://localhost:3000
  - Default user: `admin`
  - Password: Set in `.env` (`GRAFANA_PASSWORD`)
- **Prometheus:** http://localhost:9090

## 🔐 Security Features

### Implemented

- ✅ SSL/TLS encryption (HTTPS)
- ✅ Rate limiting (Nginx)
- ✅ Security headers
- ✅ Non-root containers
- ✅ Network isolation
- ✅ Health checks
- ✅ Secrets via environment variables

### Recommended Additions

- 🔄 Use Let's Encrypt for production SSL
- 🔄 Implement JWT token validation
- 🔄 Add WAF (Web Application Firewall)
- 🔄 Set up Vault for secrets management
- 🔄 Enable audit logging
- 🔄 Implement backup strategy

## 🔄 Production SSL Setup (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

Update `nginx/conf.d/default.conf` to use Let's Encrypt certificates:
```nginx
ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
```

## 📊 Monitoring

### Prometheus Metrics

- Service health
- Request rates
- Response times
- Error rates

### Grafana Dashboards

Access Grafana at http://localhost:3000 and import dashboards:
- Node Exporter Full
- Docker Container Metrics
- PostgreSQL Database Metrics

## 🛠️ Management Commands

### Start Services

```bash
docker compose up -d
```

### Stop Services

```bash
docker compose down
```

### Restart Service

```bash
docker compose restart api_server
```

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f api_server
docker compose logs -f mcp_gateway
docker compose logs -f nginx
```

### Execute Commands

```bash
# Access API server shell
docker compose exec api_server bash

# Access database
docker compose exec database psql -U appuser -d appdb

# Access Redis CLI
docker compose exec redis redis-cli -a $REDIS_PASSWORD
```

### Backup Database

```bash
# PostgreSQL backup
docker compose exec database pg_dump -U appuser appdb > backup.sql

# MongoDB backup
docker compose exec mongodb mongodump --out /backup
docker compose cp mongodb:/backup ./backups/
```

### Update Services

```bash
# Pull latest images
docker compose pull

# Rebuild and restart
docker compose up -d --build
```

## 🐛 Troubleshooting

### Services won't start

1. Check logs: `docker compose logs`
2. Verify .env file is configured
3. Check port conflicts: `netstat -tulpn | grep :80`
4. Verify Docker has enough resources

### Database connection errors

1. Check database is healthy: `docker compose ps database`
2. Verify credentials in .env
3. Check network connectivity: `docker compose exec api_server ping database`

### SSL certificate errors

1. Regenerate self-signed certs: `./deploy.sh`
2. For production, use Let's Encrypt
3. Check certificate permissions: `ls -la nginx/ssl/`

### MCP Gateway errors

1. Verify API keys in .env
2. Check MCP server logs: `docker compose logs github_mcp`
3. Test connectivity: `curl http://localhost/mcp/health`

## 📈 Scaling

### Horizontal Scaling

```yaml
# In docker-compose.yml, add:
api_server:
  deploy:
    replicas: 3
```

### Load Balancing

Nginx already configured with `least_conn` load balancing for multiple API instances.

## 🔄 Updates & Maintenance

### Weekly Tasks

- Review logs for errors
- Check disk usage: `docker system df`
- Update images: `docker compose pull`

### Monthly Tasks

- Rotate secrets/API keys
- Review security advisories
- Backup databases
- Update dependencies

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 🆘 Support

For issues or questions:
1. Check logs: `docker compose logs`
2. Review this README
3. Check architecture evaluation document
4. Review service-specific documentation

---

**Last Updated:** June 2025  
**Version:** 1.0.0


