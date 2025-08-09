#!/bin/bash
set -euo pipefail

LOGFILE="/var/log/pbc/deploy_full.log"
mkdir -p /var/log/pbc

log() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') [deploy_full] $1" | tee -a "$LOGFILE"
}

usage() {
  echo "Usage: $0 [--no-db] [--no-ssl]"
  exit 1
}

NO_DB=false
NO_SSL=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --no-db)
      NO_DB=true
      shift
      ;;
    --no-ssl)
      NO_SSL=true
      shift
      ;;
    *)
      usage
      ;;
  esac
done

log "Starting full deployment..."

# Create pbc_user if not exists
if ! id -u pbc_user &>/dev/null; then
  log "Creating system user pbc_user..."
  sudo useradd -m -s /bin/bash pbc_user
else
  log "User pbc_user already exists."
fi

# Install required system packages
log "Installing system packages..."
sudo yum update -y
sudo yum install -y nginx git unzip certbot python3-certbot-nginx nodejs npm mysql mysql-server pm2

# Enable and start services
log "Enabling and starting nginx and mysql services..."
sudo systemctl enable nginx
sudo systemctl start nginx
sudo systemctl enable mysqld
sudo systemctl start mysqld

# Setup repo directory
REPO_DIR="/home/pbc_user/paradise-bakes-cafe"
if [ ! -d "$REPO_DIR" ]; then
  log "Cloning repository..."
  sudo -u pbc_user git clone https://github.com/yourusername/paradise-bakes-cafe.git "$REPO_DIR"
else
  log "Repository already cloned, pulling latest changes..."
  cd "$REPO_DIR"
  sudo -u pbc_user git pull origin main
fi

cd "$REPO_DIR"

# Install backend dependencies
log "Installing backend dependencies..."
cd backend
sudo -u pbc_user npm ci

# Install frontend dependencies
log "Installing frontend dependencies..."
cd ../frontend
sudo -u pbc_user npm ci

# Run database migrations and seed if not skipped
if [ "$NO_DB" = false ]; then
  log "Running database migrations and seeding..."
  cd ../scripts
  sudo -u pbc_user ./seed_db.sh
else
  log "Skipping database migrations and seed as per flag."
fi

# Build frontend
log "Building frontend..."
cd ../frontend
sudo -u pbc_user npm run build

# Move frontend build to /var/www/pbc/frontend
log "Deploying frontend build to /var/www/pbc/frontend..."
sudo mkdir -p /var/www/pbc/frontend
sudo rm -rf /var/www/pbc/frontend/*
sudo cp -r dist/* /var/www/pbc/frontend/
sudo chown -R pbc_user:pbc_user /var/www/pbc/frontend

# Setup PM2 ecosystem and start apps
log "Starting PM2 processes..."
cd ../
sudo -u pbc_user pm2 start pm2.ecosystem.config.js --env production
sudo -u pbc_user pm2 save

# Setup Nginx config
NGINX_CONF="/etc/nginx/conf.d/padisebakescafe.conf"
if [ ! -f "$NGINX_CONF" ]; then
  log "Setting up Nginx configuration..."
  sudo cp configs/nginx/padisebakescafe.conf "$NGINX_CONF"
  sudo nginx -t
  sudo systemctl reload nginx
else
  log "Nginx configuration already exists."
fi

# Setup SSL if not skipped
if [ "$NO_SSL" = false ]; then
  log "Obtaining and configuring SSL certificates with Certbot..."
  sudo certbot --nginx -d padisebakescafe.com -d www.padisebakescafe.com --non-interactive --agree-tos -m info@paradisebakescafe.com --redirect
  # Setup auto renewal cron via certbot (usually done automatically)
else
  log "Skipping SSL setup as per flag."
fi

log "Deployment completed successfully."
exit 0

