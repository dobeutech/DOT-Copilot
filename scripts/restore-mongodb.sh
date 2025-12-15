#!/bin/bash
# =============================================================================
# MongoDB Restore Script
# =============================================================================
# Restores MongoDB database from backup file
# Usage: ./restore-mongodb.sh <backup_file.tar.gz> [database_name]
# =============================================================================

set -e

# Configuration
BACKUP_FILE="$1"
DB_NAME="${2:-${MONGO_DATABASE}}"
MONGO_USER="${MONGO_ROOT_USER:-admin}"
MONGO_HOST="${MONGO_HOST:-localhost}"
MONGO_PORT="${MONGO_PORT:-27017}"

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

# Validate arguments
if [ -z "$BACKUP_FILE" ]; then
    log_error "Usage: $0 <backup_file.tar.gz> [database_name]"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Backup file not found: $BACKUP_FILE"
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

# Validate prerequisites
if ! command -v mongorestore &> /dev/null; then
    log_error "mongorestore not found. Please install MongoDB Database Tools."
    exit 1
fi

log_warn "========================================="
log_warn "WARNING: This will REPLACE all data in database: $DB_NAME"
log_warn "========================================="
read -p "Are you sure you want to continue? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    log_info "Restore cancelled"
    exit 0
fi

# Create safety backup
SAFETY_BACKUP="/tmp/safety_backup_${DB_NAME}_$(date +%Y%m%d_%H%M%S)"
log_info "Creating safety backup of current database..."
if mongodump \
    --uri="mongodb://${MONGO_USER}:${MONGO_ROOT_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}" \
    --authenticationDatabase=admin \
    --db="$DB_NAME" \
    --out="$SAFETY_BACKUP"; then
    log_info "Safety backup created: $SAFETY_BACKUP"
    tar -czf "${SAFETY_BACKUP}.tar.gz" -C /tmp "$(basename "$SAFETY_BACKUP")"
    rm -rf "$SAFETY_BACKUP"
    log_info "Safety backup compressed: ${SAFETY_BACKUP}.tar.gz"
else
    log_warn "Safety backup failed, continuing anyway..."
fi

log_info "Starting MongoDB restore..."
log_info "Database: $DB_NAME"
log_info "Host: $MONGO_HOST:$MONGO_PORT"
log_info "Backup file: $BACKUP_FILE"

# Extract backup
TEMP_DIR="/tmp/mongodb_restore_$$"
mkdir -p "$TEMP_DIR"
log_info "Extracting backup..."
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Find the backup directory
BACKUP_DIR=$(find "$TEMP_DIR" -type d -name "backup_*" | head -n 1)
if [ -z "$BACKUP_DIR" ]; then
    log_error "Backup directory not found in archive"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Drop existing database
log_info "Dropping existing database..."
mongosh \
    "mongodb://${MONGO_USER}:${MONGO_ROOT_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}" \
    --authenticationDatabase admin \
    --eval "db.getSiblingDB('$DB_NAME').dropDatabase()" \
    > /dev/null 2>&1 || true

# Restore from backup
log_info "Restoring from backup..."
if mongorestore \
    --uri="mongodb://${MONGO_USER}:${MONGO_ROOT_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}" \
    --authenticationDatabase=admin \
    --db="$DB_NAME" \
    "$BACKUP_DIR/$DB_NAME"; then
    log_info "Restore completed successfully"
else
    log_error "Restore failed!"
    log_error "Safety backup available at: ${SAFETY_BACKUP}.tar.gz"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Cleanup temp directory
rm -rf "$TEMP_DIR"

# Verify restore
log_info "Verifying restore..."
COLLECTION_COUNT=$(mongosh \
    "mongodb://${MONGO_USER}:${MONGO_ROOT_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${DB_NAME}" \
    --authenticationDatabase admin \
    --quiet \
    --eval "db.getCollectionNames().length")

log_info "Collections restored: $COLLECTION_COUNT"

if [ "$COLLECTION_COUNT" -eq 0 ]; then
    log_warn "No collections found in restored database!"
    log_warn "Safety backup available at: ${SAFETY_BACKUP}.tar.gz"
else
    log_info "Restore verified successfully"
    log_info "You can delete the safety backup: ${SAFETY_BACKUP}.tar.gz"
fi

# Summary
log_info "Restore completed!"
log_info "Database: $DB_NAME"
log_info "Collections: $COLLECTION_COUNT"

exit 0
