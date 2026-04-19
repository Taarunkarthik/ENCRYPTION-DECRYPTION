#!/bin/bash

# Database Backup Script for Encryption App
# Usage: ./backup-db.sh [backup_dir]

BACKUP_DIR=${1:-"./backups"}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

echo "Starting database backup at $TIMESTAMP..."

# Check if pg_dump is installed
if ! command -v pg_dump &> /dev/null
then
    echo "Error: pg_dump could not be found. Please install postgresql-client."
    exit 1
fi

# Use environment variables if set, otherwise prompt (or fail in non-interactive)
# DB_HOST, DB_PORT, DB_NAME, DB_USER, PGPASSWORD
if [ -z "$DB_HOST" ]; then
    echo "Error: DB_HOST environment variable is not set."
    exit 1
fi

pg_dump -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME" -F p > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "Backup successful: $BACKUP_FILE"
    # Keep only the last 30 days of backups
    find "$BACKUP_DIR" -name "db_backup_*.sql" -mtime +30 -delete
    echo "Cleaned up old backups."
else
    echo "Backup failed!"
    exit 1
fi
