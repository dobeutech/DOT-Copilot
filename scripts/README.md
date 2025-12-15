# Backup & Restore Scripts

## Overview

Automated backup and restore scripts for PostgreSQL and MongoDB databases.

## Scripts

### PostgreSQL

#### backup-postgres.sh
Creates compressed backup of PostgreSQL database.

**Usage:**
```bash
# Backup default database
./scripts/backup-postgres.sh

# Backup specific database
./scripts/backup-postgres.sh mydb

# With custom backup directory
BACKUP_DIR=/custom/path ./scripts/backup-postgres.sh

# With Azure upload
AZURE_STORAGE_ACCOUNT=mystorageaccount ./scripts/backup-postgres.sh
```

**Environment Variables:**
- `POSTGRES_DB` - Database name (default: from .env)
- `POSTGRES_USER` - Database user (default: postgres)
- `POSTGRES_PASSWORD` - Database password (required)
- `POSTGRES_HOST` - Database host (default: localhost)
- `POSTGRES_PORT` - Database port (default: 5432)
- `BACKUP_DIR` - Backup directory (default: /backups/postgres)
- `RETENTION_DAYS` - Days to keep backups (default: 7)
- `AZURE_STORAGE_ACCOUNT` - Azure storage account (optional)
- `AZURE_CONTAINER` - Azure container name (default: postgres-backups)

#### restore-postgres.sh
Restores PostgreSQL database from backup.

**Usage:**
```bash
# Restore from backup file
./scripts/restore-postgres.sh /backups/postgres/backup_20251215_120000.sql.gz

# Restore to specific database
./scripts/restore-postgres.sh backup.sql.gz mydb
```

**Safety Features:**
- Creates safety backup before restore
- Prompts for confirmation
- Verifies restore completion
- Provides rollback instructions

### MongoDB

#### backup-mongodb.sh
Creates compressed backup of MongoDB database.

**Usage:**
```bash
# Backup default database
./scripts/backup-mongodb.sh

# Backup specific database
./scripts/backup-mongodb.sh mydb

# With Azure upload
AZURE_STORAGE_ACCOUNT=mystorageaccount ./scripts/backup-mongodb.sh
```

**Environment Variables:**
- `MONGO_DATABASE` - Database name (default: from .env)
- `MONGO_ROOT_USER` - MongoDB user (default: admin)
- `MONGO_ROOT_PASSWORD` - MongoDB password (required)
- `MONGO_HOST` - MongoDB host (default: localhost)
- `MONGO_PORT` - MongoDB port (default: 27017)
- `BACKUP_DIR` - Backup directory (default: /backups/mongodb)
- `RETENTION_DAYS` - Days to keep backups (default: 7)
- `AZURE_STORAGE_ACCOUNT` - Azure storage account (optional)
- `AZURE_CONTAINER` - Azure container name (default: mongodb-backups)

#### restore-mongodb.sh
Restores MongoDB database from backup.

**Usage:**
```bash
# Restore from backup file
./scripts/restore-mongodb.sh /backups/mongodb/backup_20251215_120000.tar.gz

# Restore to specific database
./scripts/restore-mongodb.sh backup.tar.gz mydb
```

**Safety Features:**
- Creates safety backup before restore
- Prompts for confirmation
- Verifies restore completion
- Provides rollback instructions

## Automated Backups

### Cron Setup

```bash
# Edit crontab
crontab -e

# Add backup jobs
# PostgreSQL - Daily at 2 AM
0 2 * * * /path/to/scripts/backup-postgres.sh >> /var/log/backup-postgres.log 2>&1

# MongoDB - Daily at 3 AM
0 3 * * * /path/to/scripts/backup-mongodb.sh >> /var/log/backup-mongodb.log 2>&1
```

### Docker Compose Service

```yaml
services:
  backup:
    image: postgres:16-alpine
    volumes:
      - ./scripts:/scripts
      - /backups:/backups
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - MONGO_DATABASE=${MONGO_DATABASE}
      - MONGO_ROOT_USER=${MONGO_ROOT_USER}
      - MONGO_ROOT_PASSWORD=${MONGO_ROOT_PASSWORD}
    command: >
      sh -c "
        apk add --no-cache mongodb-tools &&
        while true; do
          /scripts/backup-postgres.sh &&
          /scripts/backup-mongodb.sh &&
          sleep 86400
        done
      "
```

## Azure Integration

### Setup Azure Storage

```bash
# Create storage account
az storage account create \
  --name dotcopilotbackups \
  --resource-group rg-dot-copilot-prod \
  --location eastus \
  --sku Standard_GRS

# Create containers
az storage container create \
  --account-name dotcopilotbackups \
  --name postgres-backups

az storage container create \
  --account-name dotcopilotbackups \
  --name mongodb-backups

# Set retention policy
az storage blob service-properties update \
  --account-name dotcopilotbackups \
  --delete-retention-days 30
```

### Configure Scripts

```bash
# Set environment variables
export AZURE_STORAGE_ACCOUNT=dotcopilotbackups
export AZURE_CONTAINER=postgres-backups

# Run backup (will upload to Azure)
./scripts/backup-postgres.sh
```

## Monitoring

### Check Backup Status

```bash
# List recent backups
ls -lh /backups/postgres/
ls -lh /backups/mongodb/

# Check backup sizes
du -sh /backups/postgres/*
du -sh /backups/mongodb/*

# Verify backup integrity
gunzip -t /backups/postgres/backup_*.sql.gz
tar -tzf /backups/mongodb/backup_*.tar.gz > /dev/null
```

### Backup Verification Script

```bash
#!/bin/bash
# scripts/verify-backups.sh

# Check PostgreSQL backups
LATEST_PG=$(ls -t /backups/postgres/backup_*.sql.gz | head -1)
if [ -z "$LATEST_PG" ]; then
    echo "ERROR: No PostgreSQL backup found"
    exit 1
fi

AGE=$(($(date +%s) - $(stat -c %Y "$LATEST_PG")))
if [ $AGE -gt 86400 ]; then
    echo "WARNING: Latest PostgreSQL backup is older than 24 hours"
fi

# Check MongoDB backups
LATEST_MONGO=$(ls -t /backups/mongodb/backup_*.tar.gz | head -1)
if [ -z "$LATEST_MONGO" ]; then
    echo "ERROR: No MongoDB backup found"
    exit 1
fi

AGE=$(($(date +%s) - $(stat -c %Y "$LATEST_MONGO")))
if [ $AGE -gt 86400 ]; then
    echo "WARNING: Latest MongoDB backup is older than 24 hours"
fi

echo "All backups verified successfully"
```

## Troubleshooting

### PostgreSQL Backup Fails

**Error:** `pg_dump: error: connection to server failed`

**Solution:**
```bash
# Check database is running
docker-compose ps database

# Test connection
PGPASSWORD=$POSTGRES_PASSWORD psql -h localhost -U postgres -d postgres -c "SELECT 1"

# Check environment variables
echo $POSTGRES_PASSWORD
```

### MongoDB Backup Fails

**Error:** `Failed: error connecting to db server`

**Solution:**
```bash
# Check MongoDB is running
docker-compose ps mongodb

# Test connection
mongosh "mongodb://admin:${MONGO_ROOT_PASSWORD}@localhost:27017" --authenticationDatabase admin

# Check authentication
docker-compose logs mongodb | grep "Authentication"
```

### Restore Fails

**Error:** `ERROR: database "mydb" already exists`

**Solution:**
The restore script automatically drops the database. If it fails:
```bash
# Manually drop database
PGPASSWORD=$POSTGRES_PASSWORD psql -h localhost -U postgres -c "DROP DATABASE mydb;"

# Or for MongoDB
mongosh "mongodb://admin:${MONGO_ROOT_PASSWORD}@localhost:27017" --authenticationDatabase admin --eval "db.getSiblingDB('mydb').dropDatabase()"
```

### Azure Upload Fails

**Error:** `az: command not found`

**Solution:**
```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login
az login

# Test upload
az storage blob upload --help
```

## Best Practices

1. **Test Restores Regularly**
   ```bash
   # Monthly restore test
   ./scripts/restore-postgres.sh latest_backup.sql.gz test_db
   # Verify data
   # Drop test database
   ```

2. **Monitor Backup Sizes**
   ```bash
   # Alert if backup size changes significantly
   CURRENT_SIZE=$(du -b latest_backup.sql.gz | cut -f1)
   PREVIOUS_SIZE=$(du -b previous_backup.sql.gz | cut -f1)
   DIFF=$((CURRENT_SIZE - PREVIOUS_SIZE))
   if [ $DIFF -gt 1000000000 ]; then
       echo "WARNING: Backup size increased by 1GB"
   fi
   ```

3. **Encrypt Backups**
   ```bash
   # Encrypt before upload
   gpg --encrypt --recipient admin@example.com backup.sql.gz
   
   # Decrypt for restore
   gpg --decrypt backup.sql.gz.gpg > backup.sql.gz
   ```

4. **Verify Backup Integrity**
   ```bash
   # Add to backup script
   gunzip -t backup.sql.gz || exit 1
   tar -tzf backup.tar.gz > /dev/null || exit 1
   ```

5. **Document Recovery Procedures**
   - Keep printed copy of restore procedures
   - Test recovery in isolated environment
   - Document RTO/RPO requirements
   - Train team on restore process

## References

- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [MongoDB Backup Methods](https://docs.mongodb.com/manual/core/backups/)
- [Azure Blob Storage](https://docs.microsoft.com/en-us/azure/storage/blobs/)

---

**Last Updated:** 2025-12-15  
**Maintained By:** Infrastructure Team
