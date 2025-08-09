#!/bin/bash

# git_clone_and_setup.sh
# Clones the repo URL (argument), installs required packages,
# creates .env from .env.example asking user to fill securely,
# runs initial deploy script.
# Logs output to /var/log/pbc/git_clone_and_setup.log

set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: $0 <git_repo_url>"
  exit 1
fi

REPO_URL="$1"
CLONE_DIR=$(basename "$REPO_URL" .git)
LOGFILE="/var/log/pbc/git_clone_and_setup.log"

mkdir -p /var/log/pbc
touch "$LOGFILE"
chmod 600 "$LOGFILE"

log() {
  echo "$(date +"%Y-%m-%d %H:%M:%S") $*" | tee -a "$LOGFILE"
}

log "Starting clone and setup for $REPO_URL..."

if [ -d "$CLONE_DIR" ]; then
  log "Directory $CLONE_DIR already exists, skipping clone."
else
  log "Cloning repo..."
  git clone "$REPO_URL"
fi

cd "$CLONE_DIR"

log "Installing system packages..."
sudo yum update -y
sudo yum install -y git nodejs npm nginx mysql mysql-server pm2 unzip certbot

log "Installing backend dependencies..."
cd backend
npm ci
cd ..

log "Installing frontend dependencies..."
cd frontend
npm ci
cd ..

if [ ! -f .env ]; then
  log "Creating .env from .env.example"
  cp .env.example .env
  echo "Please edit the .env file now to add your secrets."
  read -p "Press Enter to open .env in nano editor..."
  nano .env
else
  log ".env file already exists, skipping creation."
fi

log "Running initial deployment script..."
bash scripts/deploy_full.sh

log "Clone and setup completed successfully."
exit 0

