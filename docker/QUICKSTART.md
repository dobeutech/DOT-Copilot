# 🚀 Quick Start Guide

## 5-Minute Deployment

### 1. Setup Environment (1 min)

```bash
cd docker
cp env.example .env
```

Edit `.env` and update at minimum:
- `POSTGRES_PASSWORD` 
- `SECRET_KEY` (generate: `openssl rand -hex 32`)
- `GITHUB_TOKEN` (your GitHub PAT)

### 2. Deploy (2 min)

```bash
chmod +x deploy.sh
./deploy.sh
```

### 3. Verify (1 min)

```bash
# Check status
docker compose ps

# Test API
curl http://localhost/api/health

# View logs
docker compose logs -f api_server
```

### 4. Access Services (1 min)

- **API Docs:** http://localhost/api/docs
- **MCP Gateway:** http://localhost/mcp/health
- **Grafana:** http://localhost:3000 (admin / password from .env)
- **Prometheus:** http://localhost:9090

## Common Commands

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# Restart a service
docker compose restart api_server

# View logs
docker compose logs -f [service_name]

# Execute command in container
docker compose exec api_server bash

# Update services
docker compose pull && docker compose up -d --build
```

## Troubleshooting

**Services won't start?**
```bash
docker compose logs
docker compose config  # Check configuration
```

**Port already in use?**
```bash
# Find process using port
sudo lsof -i :80
# Or change ports in docker-compose.yml
```

**Database connection error?**
```bash
# Check database is running
docker compose ps database
# Test connection
docker compose exec database psql -U appuser -d appdb
```

## Next Steps

1. ✅ Review `DOCKER_IMPLEMENTATION_PLAN.md` for detailed setup
2. ✅ Configure production SSL certificates
3. ✅ Set up automated backups
4. ✅ Configure monitoring alerts
5. ✅ Review security settings

---

**Need Help?** Check `README.md` for detailed documentation.


