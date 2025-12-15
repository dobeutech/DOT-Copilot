#!/bin/bash
# =============================================================================
# PostgreSQL Backup Script
# =============================================================================
# Creates compressed backup of PostgreSQL database and uploads to Azure
# Usage: ./backup-postgres.sh [database_name]
# =============================================================================

set -e

# Configuration
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_DIR:-/backups/postgres}"
DB_NAME="${1:-${POSTGRES_DB}}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

# Azure Storage (optional)
AZURE_STORAGE_ACCOUNT="${AZURE_STORAGE_ACCOUNT:-}"
AZURE_CONTAINER="${AZURE_CONTAINER:-postgres-backups}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate prerequisites
if ! command -v pg_dump &> /dev/null; then
    log_error "pg_dump not found. Please install PostgreSQL client tools."
    exit 1
fi

if [ -z "$DB_NAME" ]; then
    log_error "Database name not specified. Set POSTGRES_DB or pass as argument."
    exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup filename
BACKUP_FILE="$BACKUP_DIR/backup_${DB_NAME}_${DATE}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

log_info "Starting PostgreSQL backup..."
log_info "Database: $DB_NAME"
log_info "Host: $DB_HOST:$DB_PORT"
log_info "Backup file: $COMPRESSED_FILE"

# Create backup
log_info "Creating backup..."
if PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --no-owner \
    --no-acl \
    -F p \
    | gzip > "$COMPRESSED_FILE"; then
    log_info "Backup created successfully"
else
    log_error "Backup failed"
    exit 1
fi

# Verify backup
if [ ! -f "$COMPRESSED_FILE" ]; then
    log_error "Backup file not found: $COMPRESSED_FILE"
    exit 1
fi

BACKUP_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
log_info "Backup size: $BACKUP_SIZE"

# Upload to Azure (if configured)
if [ -n "$AZURE_STORAGE_ACCOUNT" ]; then
    log_info "Uploading to Azure Blob Storage..."
    
    if command -v az &> /dev/null; then
        if az storage blob upload \
            --account-name "$AZURE_STORAGE_ACCOUNT" \
            --container-name "$AZURE_CONTAINER" \
            --name "backup_${DB_NAME}_${DATE}.sql.gz" \
            --file "$COMPRESSED_FILE" \
            --overwrite; then
            log_info "Uploaded to Azure successfully"
        else
            log_warn "Azure upload failed, backup saved locally only"
        fi
    else
        log_warn "Azure CLI not found, skipping upload"
    fi
fi

# Cleanup old backups
log_info "Cleaning up old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "backup_${DB_NAME}_*.sql.gz" -mtime +$RETENTION_DAYS -delete
REMAINING=$(find "$BACKUP_DIR" -name "backup_${DB_NAME}_*.sql.gz" | wc -l)
log_info "Remaining backups: $REMAINING"

# Summary
log_info "Backup completed successfully!"
log_info "Backup location: $COMPRESSED_FILE"
log_info "Backup size: $BACKUP_SIZE"

# Exit successfully
exit 0
