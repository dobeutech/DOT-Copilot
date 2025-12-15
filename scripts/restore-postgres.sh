#!/bin/bash
# =============================================================================
# PostgreSQL Restore Script
# =============================================================================
# Restores PostgreSQL database from backup file
# Usage: ./restore-postgres.sh <backup_file.sql.gz> [database_name]
# =============================================================================

set -e

# Configuration
BACKUP_FILE="$1"
DB_NAME="${2:-${POSTGRES_DB}}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"

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
    log_error "Usage: $0 <backup_file.sql.gz> [database_name]"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

if [ -z "$DB_NAME" ]; then
    log_error "Database name not specified. Set POSTGRES_DB or pass as argument."
    exit 1
fi

# Validate prerequisites
if ! command -v psql &> /dev/null; then
    log_error "psql not found. Please install PostgreSQL client tools."
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

# Create backup of current database before restore
SAFETY_BACKUP="/tmp/safety_backup_${DB_NAME}_$(date +%Y%m%d_%H%M%S).sql.gz"
log_info "Creating safety backup of current database..."
if PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --no-owner \
    --no-acl \
    | gzip > "$SAFETY_BACKUP"; then
    log_info "Safety backup created: $SAFETY_BACKUP"
else
    log_warn "Safety backup failed, continuing anyway..."
fi

log_info "Starting PostgreSQL restore..."
log_info "Database: $DB_NAME"
log_info "Host: $DB_HOST:$DB_PORT"
log_info "Backup file: $BACKUP_FILE"

# Drop existing connections
log_info "Terminating existing connections..."
PGPASSWORD="$POSTGRES_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d postgres \
    -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" \
    > /dev/null 2>&1 || true

# Drop and recreate database
log_info "Dropping database..."
PGPASSWORD="$POSTGRES_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d postgres \
    -c "DROP DATABASE IF EXISTS $DB_NAME;" \
    > /dev/null

log_info "Creating database..."
PGPASSWORD="$POSTGRES_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d postgres \
    -c "CREATE DATABASE $DB_NAME;" \
    > /dev/null

# Restore from backup
log_info "Restoring from backup..."
if gunzip -c "$BACKUP_FILE" | PGPASSWORD="$POSTGRES_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --quiet; then
    log_info "Restore completed successfully"
else
    log_error "Restore failed!"
    log_error "Safety backup available at: $SAFETY_BACKUP"
    exit 1
fi

# Verify restore
log_info "Verifying restore..."
TABLE_COUNT=$(PGPASSWORD="$POSTGRES_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" \
    | tr -d ' ')

log_info "Tables restored: $TABLE_COUNT"

if [ "$TABLE_COUNT" -eq 0 ]; then
    log_warn "No tables found in restored database!"
    log_warn "Safety backup available at: $SAFETY_BACKUP"
else
    log_info "Restore verified successfully"
    log_info "You can delete the safety backup: $SAFETY_BACKUP"
fi

# Summary
log_info "Restore completed!"
log_info "Database: $DB_NAME"
log_info "Tables: $TABLE_COUNT"

exit 0
