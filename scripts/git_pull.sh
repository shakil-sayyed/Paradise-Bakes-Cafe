#!/bin/bash

# git_pull.sh
# Pulls latest changes from origin main, installs backend/frontend dependencies, restarts PM2 processes.
# Logs output to /var/log/pbc/git_pull.log

set -euo pipefail

LOGFILE="/var/log/pbc/git_pull.log"
BRANCH="main"

mkdir -p /var/log/pbc
touch "$LOGFILE"
chmod 600 "$LOGFILE"

log() {
  echo "$(date +"%Y-%m-%d %H:%M:%S") $*" | tee -a "$LOGFILE"
}

log "Starting git pull and update..."

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
  log "ERROR: Current branch is '$CURRENT_BRANCH', expected '$BRANCH'. Aborting."
  exit 1
fi

log "Pulling latest changes from origin/$BRANCH..."
git pull origin "$BRANCH"

# Install backend dependencies
if [ -d backend ]; then
  log "Installing backend dependencies..."
  cd backend
  npm ci
  cd ..
else
  log "Backend directory not found!"
fi

# Install frontend dependencies and build
if [ -d frontend ]; then
  log "Installing frontend dependencies and building..."
  cd frontend
  npm ci
  npm run build
  cd ..
else
  log "Frontend directory not found!"
fi

# Restart PM2 apps
log "Restarting PM2 applications..."
pm2 reload pm2.ecosystem.config.js

log "Git pull and update completed successfully."
exit 0

