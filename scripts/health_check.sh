#!/bin/bash

# health_check.sh
# Checks Node app health, DB connectivity, and Nginx status.
# Logs output to /var/log/pbc/health_check.log

set -euo pipefail

LOGFILE="/var/log/pbc/health_check.log"
mkdir -p /var/log/pbc
touch "$LOGFILE"
chmod 600 "$LOGFILE"

log() {
  echo "$(date +"%Y-%m-%d %H:%M:%S") $*" | tee -a "$LOGFILE"
}

log "Starting health check..."

# Check Node app via PM2 status
if pm2 status | grep -q 'online'; then
  log "PM2 Node app is online."
else
  log "ERROR: Node app is not online."
fi

# Check DB connectivity using environment variables
if [ ! -f .env ]; then
  log "ERROR: .env file not found. Cannot check DB connectivity."
  exit 1
fi

# Load DB env vars safely
DB_HOST=$(grep '^DB_HOST=' .env | cut -d '=' -f2)
DB_PORT=$(grep '^DB_PORT=' .env | cut -d '=' -f2)
DB_USER=$(grep '^DB_USER=' .env | cut -d '=' -f2)
DB_PASS=$(grep '^DB_PASS=' .env | cut -d '=' -f2)
DB_NAME=$(grep '^DB_NAME=' .env | cut -d '=' -f2)

log "Checking MySQL connection to $DB_HOST:$DB_PORT..."

if mysqladmin ping -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" --silent; then
  log "MySQL connection successful."
else
  log "ERROR: Unable to connect to MySQL."
fi

# Check Nginx status
if systemctl is-active --quiet nginx; then
  log "Nginx service is running."
else
  log "ERROR: Nginx service is not running."
fi

# Check Nginx serving on port 80 and 443
if curl -Is http://localhost | head -1 | grep -q "200\|301\|302"; then
  log "Nginx HTTP is serving content."
else
  log "ERROR: Nginx HTTP is not serving content."
fi

if curl -Ik https://localhost | head -1 | grep -q "200\|301\|302"; then
  log "Nginx HTTPS is serving content."
else
  log "WARNING: Nginx HTTPS may not be serving content."
fi

log "Health check completed."
exit 0

