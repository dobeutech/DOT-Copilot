# Disaster Recovery Plan

## Overview

This document outlines the disaster recovery (DR) procedures for the DOT-Copilot infrastructure, including backup strategies, recovery procedures, and business continuity plans.

## Recovery Objectives

### RTO (Recovery Time Objective)
- **Critical Services:** 4 hours
- **Non-Critical Services:** 24 hours
- **Full System:** 8 hours

### RPO (Recovery Point Objective)
- **Database:** 1 hour (continuous replication)
- **File Storage:** 24 hours (daily backups)
- **Configuration:** 0 (version controlled)

## Backup Strategy

### Database Backups

#### PostgreSQL

**Automated Backups:**
```bash
# Daily full backup
0 2 * * * /scripts/backup-postgres.sh

# Hourly incremental backup
0 * * * * /scripts/backup-postgres-incremental.sh
```

**Backup Script:**
```bash
#!/bin/bash
# scripts/backup-postgres.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgres"
DB_NAME="dot_copilot"

# Create backup
pg_dump -h localhost -U postgres -d $DB_NAME | \
  gzip > $BACKUP_DIR/backup_${DATE}.sql.gz

# Upload to Azure Blob Storage
az storage blob upload \
  --account-name dotcopilotbackups \
  --container-name postgres-backups \
  --name backup_${DATE}.sql.gz \
  --file $BACKUP_DIR/backup_${DATE}.sql.gz

# Cleanup old local backups (keep 7 days)
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: backup_${DATE}.sql.gz"
```

**Azure Configuration:**
- **Retention:** 30 days
- **Geo-Redundancy:** Enabled (production)
- **Point-in-Time Restore:** Enabled
- **Backup Frequency:** Daily full, hourly incremental

#### MongoDB

**Automated Backups:**
```bash
# Daily backup
0 3 * * * /scripts/backup-mongodb.sh
```

**Backup Script:**
```bash
#!/bin/bash
# scripts/backup-mongodb.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mongodb"

# Create backup
mongodump --uri="mongodb://admin:${MONGO_PASSWORD}@localhost:27017" \
  --out=$BACKUP_DIR/backup_${DATE}

# Compress
tar -czf $BACKUP_DIR/backup_${DATE}.tar.gz $BACKUP_DIR/backup_${DATE}
rm -rf $BACKUP_DIR/backup_${DATE}

# Upload to Azure
az storage blob upload \
  --account-name dotcopilotbackups \
  --container-name mongodb-backups \
  --name backup_${DATE}.tar.gz \
  --file $BACKUP_DIR/backup_${DATE}.tar.gz

# Cleanup
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete
```

### File Storage Backups

**Azure Blob Storage:**
- **Soft Delete:** Enabled (30 days)
- **Versioning:** Enabled
- **Geo-Redundancy:** ZRS (production)
- **Backup:** Automated snapshots

### Configuration Backups

**Version Control:**
- All infrastructure code in Git
- All configuration files in Git
- Secrets in Azure Key Vault

**Backup Locations:**
- GitHub: [github.com/dobeutech/DOT-Copilot](https://github.com/dobeutech/DOT-Copilot)
- Azure Key Vault: Automated backups
- Local: Development machines

## Recovery Procedures

### Scenario 1: Database Failure

#### PostgreSQL Recovery

**Symptoms:**
- Database connection errors
- Data corruption
- Hardware failure

**Recovery Steps:**

1. **Assess the situation:**
   ```bash
   # Check database status
   docker-compose exec database pg_isready
   
   # Check logs
   docker-compose logs database
   ```

2. **Stop the database:**
   ```bash
   docker-compose stop database
   ```

3. **Restore from backup:**
   ```bash
   # Download latest backup
   az storage blob download \
     --account-name dotcopilotbackups \
     --container-name postgres-backups \
     --name backup_YYYYMMDD_HHMMSS.sql.gz \
     --file /tmp/backup.sql.gz
   
   # Extract
   gunzip /tmp/backup.sql.gz
   
   # Restore
   docker-compose exec -T database psql -U postgres -d dot_copilot < /tmp/backup.sql
   ```

4. **Verify restoration:**
   ```bash
   # Check data integrity
   docker-compose exec database psql -U postgres -d dot_copilot -c "SELECT COUNT(*) FROM users;"
   
   # Run health checks
   curl http://localhost:3001/health/ready
   ```

5. **Resume operations:**
   ```bash
   docker-compose start database
   docker-compose restart backend
   ```

**Estimated Recovery Time:** 2-4 hours

#### MongoDB Recovery

**Recovery Steps:**

1. **Stop MongoDB:**
   ```bash
   docker-compose stop mongodb
   ```

2. **Restore from backup:**
   ```bash
   # Download backup
   az storage blob download \
     --account-name dotcopilotbackups \
     --container-name mongodb-backups \
     --name backup_YYYYMMDD_HHMMSS.tar.gz \
     --file /tmp/backup.tar.gz
   
   # Extract
   tar -xzf /tmp/backup.tar.gz -C /tmp/
   
   # Restore
   mongorestore --uri="mongodb://admin:${MONGO_PASSWORD}@localhost:27017" \
     /tmp/backup_YYYYMMDD_HHMMSS/
   ```

3. **Verify and resume:**
   ```bash
   docker-compose start mongodb
   ```

**Estimated Recovery Time:** 1-2 hours

### Scenario 2: Complete Infrastructure Failure

#### Azure Region Failure

**Symptoms:**
- All Azure services unavailable
- Cannot access Azure Portal
- DNS resolution failures

**Recovery Steps:**

1. **Activate DR site:**
   ```bash
   # Switch to secondary region
   az account set --subscription "DR-Subscription"
   
   # Deploy infrastructure
   cd infrastructure/azure
   ./deploy.sh --environment prod --region westus2
   ```

2. **Restore databases:**
   ```bash
   # Restore from geo-redundant backups
   az postgres flexible-server restore \
     --resource-group rg-dot-copilot-prod-dr \
     --name dot-copilot-db-prod-dr \
     --source-server dot-copilot-db-prod \
     --restore-time "2025-12-15T06:00:00Z"
   ```

3. **Update DNS:**
   ```bash
   # Update DNS to point to DR site
   az network dns record-set a update \
     --resource-group rg-dot-copilot-dns \
     --zone-name dotcopilot.com \
     --name www \
     --set aRecords[0].ipv4Address=<DR_IP>
   ```

4. **Verify services:**
   ```bash
   # Check all services
   curl https://www.dotcopilot.com/health
   curl https://api.dotcopilot.com/health/ready
   ```

**Estimated Recovery Time:** 4-8 hours

### Scenario 3: Data Corruption

#### Symptoms
- Incorrect data in database
- Missing records
- Inconsistent state

#### Recovery Steps

1. **Identify corruption scope:**
   ```bash
   # Check database logs
   docker-compose logs database | grep ERROR
   
   # Run data integrity checks
   docker-compose exec database psql -U postgres -d dot_copilot -f /scripts/integrity-check.sql
   ```

2. **Determine recovery point:**
   ```bash
   # List available backups
   az storage blob list \
     --account-name dotcopilotbackups \
     --container-name postgres-backups \
     --output table
   ```

3. **Restore to specific point:**
   ```bash
   # Restore to point before corruption
   ./scripts/restore-postgres.sh backup_20251215_050000.sql.gz
   ```

4. **Verify data integrity:**
   ```bash
   # Run validation queries
   docker-compose exec database psql -U postgres -d dot_copilot -f /scripts/validate-data.sql
   ```

**Estimated Recovery Time:** 2-6 hours

### Scenario 4: Security Breach

#### Symptoms
- Unauthorized access detected
- Suspicious activity in logs
- Data exfiltration alerts

#### Immediate Actions

1. **Isolate affected systems:**
   ```bash
   # Stop all services
   docker-compose down
   
   # Block network access
   az network nsg rule create \
     --resource-group rg-dot-copilot-prod \
     --nsg-name nsg-dot-copilot \
     --name DenyAll \
     --priority 100 \
     --access Deny \
     --protocol '*' \
     --source-address-prefixes '*' \
     --destination-address-prefixes '*'
   ```

2. **Preserve evidence:**
   ```bash
   # Capture logs
   docker-compose logs > /forensics/logs_$(date +%Y%m%d_%H%M%S).txt
   
   # Snapshot volumes
   docker run --rm -v postgres_data:/data -v /backups:/backup \
     alpine tar czf /backup/forensic_snapshot_$(date +%Y%m%d_%H%M%S).tar.gz /data
   ```

3. **Assess damage:**
   ```bash
   # Check for unauthorized changes
   git diff HEAD
   
   # Review access logs
   az monitor activity-log list --resource-group rg-dot-copilot-prod
   ```

4. **Restore from clean backup:**
   ```bash
   # Restore from backup before breach
   ./scripts/restore-all.sh backup_20251214_000000
   ```

5. **Rotate all secrets:**
   ```bash
   # Rotate database passwords
   ./scripts/rotate-secrets.sh
   
   # Update Key Vault
   az keyvault secret set --vault-name kv-dot-copilot --name DB-PASSWORD --value <new_password>
   ```

6. **Resume operations:**
   ```bash
   # Deploy with new secrets
   docker-compose up -d
   
   # Verify security
   ./scripts/security-audit.sh
   ```

**Estimated Recovery Time:** 8-24 hours

## Testing Procedures

### Monthly DR Drill

**Schedule:** First Saturday of each month

**Procedure:**

1. **Announce drill:**
   ```bash
   # Notify team
   echo "DR drill starting at $(date)" | mail -s "DR Drill" team@dotcopilot.com
   ```

2. **Simulate failure:**
   ```bash
   # Stop production services
   docker-compose -f docker-compose.prod.yml down
   ```

3. **Execute recovery:**
   ```bash
   # Follow recovery procedures
   ./scripts/dr-drill.sh
   ```

4. **Verify recovery:**
   ```bash
   # Run health checks
   ./scripts/health-check-all.sh
   
   # Run integration tests
   npm run test:integration
   ```

5. **Document results:**
   ```bash
   # Record metrics
   echo "Recovery Time: $(cat /tmp/recovery_time.txt)" >> /logs/dr-drill-results.log
   ```

6. **Review and improve:**
   - Team meeting to discuss results
   - Update procedures based on findings
   - Address any issues discovered

### Quarterly Full Recovery Test

**Schedule:** Last Saturday of each quarter

**Procedure:**

1. **Full infrastructure teardown**
2. **Restore from backups**
3. **Verify all services**
4. **Performance testing**
5. **Documentation update**

## Backup Verification

### Daily Verification

```bash
#!/bin/bash
# scripts/verify-backups.sh

# Check PostgreSQL backup
LATEST_PG_BACKUP=$(az storage blob list \
  --account-name dotcopilotbackups \
  --container-name postgres-backups \
  --query "[0].name" -o tsv)

if [ -z "$LATEST_PG_BACKUP" ]; then
  echo "ERROR: No PostgreSQL backup found"
  exit 1
fi

# Check backup age
BACKUP_DATE=$(echo $LATEST_PG_BACKUP | grep -oP '\d{8}')
TODAY=$(date +%Y%m%d)

if [ "$BACKUP_DATE" != "$TODAY" ]; then
  echo "WARNING: Latest backup is not from today"
fi

# Test restore (to temporary database)
echo "Testing restore..."
./scripts/test-restore.sh $LATEST_PG_BACKUP

echo "Backup verification complete"
```

## Contact Information

### Emergency Contacts

**On-Call Engineer:**
- Primary: +1-XXX-XXX-XXXX
- Secondary: +1-XXX-XXX-XXXX

**Management:**
- CTO: +1-XXX-XXX-XXXX
- VP Engineering: +1-XXX-XXX-XXXX

**Vendors:**
- Azure Support: 1-800-XXX-XXXX
- Database Consultant: +1-XXX-XXX-XXXX

### Escalation Path

1. **Level 1:** On-call engineer (0-30 minutes)
2. **Level 2:** Senior engineer (30-60 minutes)
3. **Level 3:** Engineering manager (1-2 hours)
4. **Level 4:** CTO (2+ hours)

## Documentation

### Required Documents

- [ ] Network diagrams
- [ ] Database schemas
- [ ] API documentation
- [ ] Runbooks
- [ ] Access credentials (in Key Vault)
- [ ] Vendor contacts
- [ ] Insurance information

### Document Locations

- **Technical Docs:** GitHub repository
- **Credentials:** Azure Key Vault
- **Contacts:** Confluence
- **Procedures:** This document

## Post-Incident Review

### Within 24 Hours

1. **Incident timeline**
2. **Root cause analysis**
3. **Impact assessment**
4. **Recovery actions taken**

### Within 1 Week

1. **Detailed post-mortem**
2. **Lessons learned**
3. **Action items**
4. **Process improvements**

### Template

```markdown
# Incident Post-Mortem

**Date:** YYYY-MM-DD
**Duration:** X hours
**Severity:** Critical/High/Medium/Low

## Summary
Brief description of the incident.

## Timeline
- HH:MM - Event occurred
- HH:MM - Detected
- HH:MM - Response initiated
- HH:MM - Resolved

## Root Cause
What caused the incident?

## Impact
- Users affected: X
- Downtime: X hours
- Data loss: Yes/No
- Financial impact: $X

## Resolution
How was it resolved?

## Lessons Learned
What did we learn?

## Action Items
- [ ] Action 1 (Owner: Name, Due: Date)
- [ ] Action 2 (Owner: Name, Due: Date)
```

## Continuous Improvement

### Quarterly Review

- Review RTO/RPO targets
- Update recovery procedures
- Test new scenarios
- Train new team members
- Update documentation

### Annual Audit

- Full DR plan review
- Compliance verification
- Cost analysis
- Technology updates
- Risk assessment

---

**Last Updated:** 2025-12-15  
**Next Review:** 2026-01-15  
**Owner:** Infrastructure Team  
**Status:** Active
