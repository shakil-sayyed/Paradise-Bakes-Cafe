#!/bin/bash
# ==========================================================
# Paradise Bakes & Cafe - Database Backup Script
# Author: TCP DevOps Team
# Purpose: Creates compressed MySQL backups & rotates them
# Usage: ./db_backup.sh
# Can be set as a cron job for automated backups.
# ==========================================================

set -e

# -----------------------------
# Configurable Variables
# -----------------------------
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
PROJECT_NAME="paradise_bakes_cafe"
BACKUP_DIR="/var/backups/${PROJECT_NAME}"
DB_NAME="tcp_database"
DB_USER="tcp_admin"
DB_PASS="CHANGE_THIS_SECURELY"
RETENTION_DAYS=30

mkdir -p "$BACKUP_DIR"

# -----------------------------
# Step 1: Dump Database
# -----------------------------
echo "📦 Backing up database: $DB_NAME"
mysqldump -u "$DB_USER" -p"$DB_PASS" --single-transaction "$DB_NAME" | gzip > "${BACKUP_DIR}/db_backup_${TIMESTAMP}.sql.gz"
echo "✅ Backup saved to ${BACKUP_DIR}/db_backup_${TIMESTAMP}.sql.gz"

# -----------------------------
# Step 2: Rotate Old Backups
# -----------------------------
echo "♻️  Rotating backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +$RETENTION_DAYS -exec rm {} \;
echo "✅ Old backups removed"

# -----------------------------
# Step 3: Optional S3 Upload
# -----------------------------
if [ "$ENABLE_S3_BACKUP" = "true" ]; then
    echo "☁️  Uploading backup to S3 bucket: $AWS_S3_BUCKET"
    aws s3 cp "${BACKUP_DIR}/db_backup_${TIMESTAMP}.sql.gz" "s3://${AWS_S3_BUCKET}/backups/db_backup_${TIMESTAMP}.sql.gz"
    echo "✅ Backup uploaded to S3"
fi

# -----------------------------
# End of Script
# -----------------------------
echo "🎉 Database backup completed at $TIMESTAMP"

