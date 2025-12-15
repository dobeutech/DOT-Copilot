#!/bin/bash
# =============================================================================
# MongoDB Backup Script
# =============================================================================
# Creates compressed backup of MongoDB database and uploads to Azure
# Usage: ./backup-mongodb.sh [database_name]
# =============================================================================

set -e

# Configuration
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_DIR:-/backups/mongodb}"
DB_NAME="${1:-${MONGO_DATABASE}}"
MONGO_USER="${MONGO_ROOT_USER:-admin}"
MONGO_HOST="${MONGO_HOST:-localhost}"
MONGO_PORT="${MONGO_PORT:-27017}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

# Azure Storage (optional)
AZURE_STORAGE_ACCOUNT="${AZURE_STORAGE_ACCOUNT:-}"
AZURE_CONTAINER="${AZURE_CONTAINER:-mongodb-backups}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

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
if ! command -v mongodump &> /dev/null; then
    log_error "mongodump not found. Please install MongoDB Database Tools."
    exit 1
fi

if [ -z "$DB_NAME" ]; then
    log_error "Database name not specified. Set MONGO_DATABASE or pass as argument."
    exit 1
fi

if [ -z "$MONGO_ROOT_PASSWORD" ]; then
    log_error "MONGO_ROOT_PASSWORD not set"
    exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup directory name
BACKUP_SUBDIR="$BACKUP_DIR/backup_${DB_NAME}_${DATE}"
COMPRESSED_FILE="${BACKUP_SUBDIR}.tar.gz"

log_info "Starting MongoDB backup..."
log_info "Database: $DB_NAME"
log_info "Host: $MONGO_HOST:$MONGO_PORT"
log_info "Backup file: $COMPRESSED_FILE"

# Create backup
log_info "Creating backup..."
if mongodump \
    --uri="mongodb://${MONGO_USER}:${MONGO_ROOT_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}" \
    --authenticationDatabase=admin \
    --db="$DB_NAME" \
    --out="$BACKUP_SUBDIR"; then
    log_info "Backup created successfully"
else
    log_error "Backup failed"
    exit 1
fi

# Compress backup
log_info "Compressing backup..."
tar -czf "$COMPRESSED_FILE" -C "$BACKUP_DIR" "$(basename "$BACKUP_SUBDIR")"
rm -rf "$BACKUP_SUBDIR"

# Verify backup
if [ ! -f "$COMPRESSED_FILE" ]; then
    log_error "Compressed backup file not found: $COMPRESSED_FILE"
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
            --name "backup_${DB_NAME}_${DATE}.tar.gz" \
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
find "$BACKUP_DIR" -name "backup_${DB_NAME}_*.tar.gz" -mtime +$RETENTION_DAYS -delete
REMAINING=$(find "$BACKUP_DIR" -name "backup_${DB_NAME}_*.tar.gz" | wc -l)
log_info "Remaining backups: $REMAINING"

# Summary
log_info "Backup completed successfully!"
log_info "Backup location: $COMPRESSED_FILE"
log_info "Backup size: $BACKUP_SIZE"

exit 0
