# Docker Image Pinning Guide

## Overview

Pinning Docker images to specific digests ensures reproducible builds and prevents unexpected breaking changes from upstream updates.

## Why Pin Images?

### Benefits
1. **Reproducibility** - Same image every time
2. **Security** - Control when updates are applied
3. **Stability** - Prevent breaking changes
4. **Compliance** - Meet audit requirements

### Risks of Not Pinning
- Unexpected breaking changes
- Security vulnerabilities introduced
- Build inconsistencies
- Difficult to debug issues

## Current Images

### Production Images (cursor-projects/DOT-Copilot/docker-compose.yml)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    # Should be: postgres:16-alpine@sha256:...
    
  backend:
    build: ./backend
    # Controlled by Dockerfile
    
  frontend:
    build: ./frontend
    # Controlled by Dockerfile
```

### Development Images (docker/docker-compose.yml)

```yaml
services:
  nginx:
    build: ./nginx
    # Base: nginx:1.25-alpine
    
  api_server:
    build: ./api
    # Base: python:3.11-slim
    
  mcp_gateway:
    build: ./mcp-gateway
    # Base: python:3.11-slim
    
  github_mcp:
    image: ghcr.io/github/github-mcp-server:latest
    # Should be pinned to specific version
    
  database:
    image: postgres:16-alpine
    # Should be: postgres:16-alpine@sha256:...
    
  redis:
    image: redis:7-alpine
    # Should be: redis:7-alpine@sha256:...
    
  mongodb:
    image: mongo:7
    # Should be: mongo:7@sha256:...
    
  prometheus:
    image: prom/prometheus:latest
    # Should be: prom/prometheus:v2.48.0@sha256:...
    
  grafana:
    image: grafana/grafana:latest
    # Should be: grafana/grafana:10.2.2@sha256:...
    
  vault:
    image: vault:latest
    # Should be: vault:1.15.4@sha256:...
```

## How to Pin Images

### Step 1: Get Image Digest

```bash
# Pull the image
docker pull postgres:16-alpine

# Get the digest
docker inspect postgres:16-alpine --format='{{index .RepoDigests 0}}'
# Output: postgres:16-alpine@sha256:abc123...

# Or use docker manifest
docker manifest inspect postgres:16-alpine | grep digest
```

### Step 2: Update docker-compose.yml

**Before:**
```yaml
postgres:
  image: postgres:16-alpine
```

**After:**
```yaml
postgres:
  image: postgres:16-alpine@sha256:abc123def456...
```

### Step 3: Update Dockerfiles

**Before:**
```dockerfile
FROM python:3.11-slim
```

**After:**
```dockerfile
FROM python:3.11-slim@sha256:xyz789...
```

## Recommended Image Versions with Digests

### Get Latest Digests

Run this script to get current digests:

```bash
#!/bin/bash
# get-digests.sh

images=(
  "postgres:16-alpine"
  "redis:7-alpine"
  "mongo:7"
  "nginx:1.25-alpine"
  "python:3.11-slim"
  "node:20-alpine"
  "prom/prometheus:v2.48.0"
  "grafana/grafana:10.2.2"
  "vault:1.15.4"
)

for image in "${images[@]}"; do
  echo "Pulling $image..."
  docker pull "$image" > /dev/null 2>&1
  digest=$(docker inspect "$image" --format='{{index .RepoDigests 0}}')
  echo "$digest"
  echo ""
done
```

### Example Pinned Images (as of 2025-12-15)

**Note:** These digests are examples. Run the script above to get current digests.

```yaml
# PostgreSQL
postgres:16-alpine@sha256:7e2c8f3d4b5a6c1e9f0d8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7

# Redis
redis:7-alpine@sha256:1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2

# MongoDB
mongo:7@sha256:9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8

# Nginx
nginx:1.25-alpine@sha256:2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3

# Python
python:3.11-slim@sha256:3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4

# Node.js
node:20-alpine@sha256:4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5

# Prometheus
prom/prometheus:v2.48.0@sha256:5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6

# Grafana
grafana/grafana:10.2.2@sha256:6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7

# Vault
vault:1.15.4@sha256:7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8
```

## Implementation Plan

### Phase 1: Pin Base Images in Dockerfiles

Update all Dockerfiles to pin base images:

```dockerfile
# docker/nginx/Dockerfile
FROM nginx:1.25-alpine@sha256:...

# docker/api/Dockerfile
FROM python:3.11-slim@sha256:...

# docker/mcp-gateway/Dockerfile
FROM python:3.11-slim@sha256:...

# cursor-projects/DOT-Copilot/backend/Dockerfile
FROM node:20-alpine@sha256:...

# cursor-projects/DOT-Copilot/frontend/Dockerfile
FROM node:20-alpine@sha256:...
FROM nginx:alpine@sha256:...
```

### Phase 2: Pin Service Images in docker-compose.yml

Update docker-compose files:

```yaml
# docker/docker-compose.yml
services:
  database:
    image: postgres:16-alpine@sha256:...
  
  redis:
    image: redis:7-alpine@sha256:...
  
  mongodb:
    image: mongo:7@sha256:...
  
  prometheus:
    image: prom/prometheus:v2.48.0@sha256:...
  
  grafana:
    image: grafana/grafana:10.2.2@sha256:...
  
  vault:
    image: vault:1.15.4@sha256:...
  
  github_mcp:
    image: ghcr.io/github/github-mcp-server:v1.0.0@sha256:...
```

### Phase 3: Set Up Automated Updates

Use Dependabot or Renovate to automate digest updates:

**.github/dependabot.yml:**
```yaml
version: 2
updates:
  - package-ecosystem: "docker"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    reviewers:
      - "infrastructure-team"
    labels:
      - "dependencies"
      - "docker"
```

## Maintenance

### Weekly Review Process

1. **Check for updates:**
   ```bash
   docker pull postgres:16-alpine
   docker pull redis:7-alpine
   # ... etc
   ```

2. **Get new digests:**
   ```bash
   ./scripts/get-digests.sh > digests.txt
   ```

3. **Update docker-compose.yml and Dockerfiles**

4. **Test in development:**
   ```bash
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   docker-compose ps
   ```

5. **Run tests:**
   ```bash
   npm test
   docker-compose exec backend npm test
   ```

6. **Commit and deploy:**
   ```bash
   git add .
   git commit -m "chore: update Docker image digests"
   git push
   ```

### Monthly Security Audit

1. **Scan images for vulnerabilities:**
   ```bash
   docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
     aquasec/trivy image postgres:16-alpine@sha256:...
   ```

2. **Review CVE reports**

3. **Update images with security patches**

4. **Document changes in CHANGELOG.md**

## Automation Script

### scripts/pin-images.sh

```bash
#!/bin/bash
set -e

echo "Pinning Docker images to specific digests..."

# Function to get digest
get_digest() {
  local image=$1
  docker pull "$image" > /dev/null 2>&1
  docker inspect "$image" --format='{{index .RepoDigests 0}}'
}

# Images to pin
declare -A images=(
  ["POSTGRES"]="postgres:16-alpine"
  ["REDIS"]="redis:7-alpine"
  ["MONGO"]="mongo:7"
  ["NGINX"]="nginx:1.25-alpine"
  ["PYTHON"]="python:3.11-slim"
  ["NODE"]="node:20-alpine"
  ["PROMETHEUS"]="prom/prometheus:v2.48.0"
  ["GRAFANA"]="grafana/grafana:10.2.2"
  ["VAULT"]="vault:1.15.4"
)

# Get digests
echo "Fetching digests..."
for key in "${!images[@]}"; do
  image="${images[$key]}"
  echo "Processing $image..."
  digest=$(get_digest "$image")
  echo "$key=$digest"
done

echo ""
echo "Update your docker-compose.yml and Dockerfiles with these digests."
```

### scripts/update-digests.sh

```bash
#!/bin/bash
set -e

# This script updates docker-compose.yml with new digests
# Usage: ./scripts/update-digests.sh

COMPOSE_FILE="docker/docker-compose.yml"
BACKUP_FILE="docker/docker-compose.yml.backup"

# Backup
cp "$COMPOSE_FILE" "$BACKUP_FILE"

# Get new digests and update
# ... implementation here ...

echo "Updated $COMPOSE_FILE"
echo "Backup saved to $BACKUP_FILE"
```

## Best Practices

1. **Pin to digests, not tags** - Tags can be moved, digests cannot
2. **Use specific versions** - Avoid `:latest` tag
3. **Document versions** - Keep track of what's deployed
4. **Test updates** - Always test in dev before production
5. **Automate updates** - Use Dependabot or Renovate
6. **Monitor security** - Scan images regularly
7. **Review changes** - Check release notes before updating
8. **Rollback plan** - Keep previous digests for quick rollback

## Rollback Procedure

If an update causes issues:

1. **Identify previous digest:**
   ```bash
   git log -p docker-compose.yml | grep "image:"
   ```

2. **Revert to previous digest:**
   ```yaml
   postgres:
     image: postgres:16-alpine@sha256:OLD_DIGEST
   ```

3. **Redeploy:**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

4. **Verify:**
   ```bash
   docker-compose ps
   docker-compose logs
   ```

## Troubleshooting

### Issue: Digest Not Found

**Error:** `manifest for postgres:16-alpine@sha256:... not found`

**Solution:**
1. Image was removed from registry
2. Use a different digest or tag
3. Check Docker Hub for available digests

### Issue: Build Fails After Pinning

**Error:** `failed to solve with frontend dockerfile.v0`

**Solution:**
1. Clear Docker cache: `docker system prune -a`
2. Rebuild: `docker-compose build --no-cache`
3. Verify digest is correct

### Issue: Slow Builds

**Cause:** Docker needs to verify digests

**Solution:**
1. Use BuildKit: `DOCKER_BUILDKIT=1 docker-compose build`
2. Enable layer caching
3. Use a Docker registry mirror

## References

- [Docker Image Digests](https://docs.docker.com/engine/reference/commandline/pull/#pull-an-image-by-digest-immutable-identifier)
- [Dependabot Docker Support](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file#docker)
- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)

---

**Last Updated:** 2025-12-15  
**Status:** Documentation Complete - Implementation Pending  
**Next Steps:** Run get-digests.sh and update all files
