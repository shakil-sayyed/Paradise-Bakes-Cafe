#!/bin/bash

# backup_db.sh
# Dumps MySQL DB tcp_database with rotation & optional S3 upload.
# Logs to /var/log/pbc/backup_db.log

set -euo pipefail

LOGFILE="/var/log/pbc/backup_db.log"
BACKUP_DIR="/var/backups/pbc"
RETENTION_DAYS=30

# Load env
if [ -f /etc/pbc_env ]; then
  source /etc/pbc_env
elif [ -f .env ]; then
  set -o allexport; source .env; set +o allexport
fi

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="pbc_backup_${TIMESTAMP}.sql.gz"
FILEPATH="${BACKUP_DIR}/${FILENAME}"

mkdir -p "$BACKUP_DIR"
touch "$LOGFILE"
chmod 600 "$LOGFILE"

log() {
  echo "$(date +"%Y-%m-%d %H:%M:%S") $*" | tee -a "$LOGFILE"
}

log "Starting backup..."

if [ -z "${DB_USER:-}" ] || [ -z "${DB_PASSWORD:-}" ] || [ -z "${DB_NAME:-}" ]; then
  log "ERROR: DB_USER, DB_PASSWORD or DB_NAME not set in environment."
  exit 1
fi

mysqldump -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" | gzip > "$FILEPATH"
log "Backup saved to $FILEPATH"

# Rotate backups older than retention days
find "$BACKUP_DIR" -type f -name "pbc_backup_*.sql.gz" -mtime +$RETENTION_DAYS -exec rm -f {} \;
log "Old backups rotated."

# Optional S3 upload
if [ "${S3_UPLOAD_ENABLED:-false}" == "true" ]; then
  if [ -z "${AWS_S3_BUCKET:-}" ]; then
    log "S3_UPLOAD_ENABLED=true but AWS_S3_BUCKET not set. Skipping upload."
  else
    log "Uploading $FILENAME to s3://${AWS_S3_BUCKET}/"
    aws s3 cp "$FILEPATH" "s3://${AWS_S3_BUCKET}/" --storage-class STANDARD_IA
    if [ $? -eq 0 ]; then
      log "Upload successful."
    else
      log "Upload failed."
    fi
  fi
fi

log "Backup completed successfully."
exit 0

