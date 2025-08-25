#!/bin/bash

# Paradise Bakes & Cafe - Production Deployment Script
# For EC2 Amazon Linux 2023 (T2.micro)

set -e

echo "🚀 Starting Paradise Bakes & Cafe deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="paradise-bakes-cafe"
APP_USER="paradise-cafe"
APP_DIR="/opt/paradise-bakes-cafe"
LOG_DIR="/opt/logs"
UPLOAD_DIR="/opt/uploads"
DOMAIN="paradisebakescafe.com"
EC2_IP="18.212.72.188"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Update system
print_status "Updating system packages..."
sudo yum update -y
print_success "System updated"

# Install required packages
print_status "Installing required packages..."
sudo yum install -y \
    nodejs \
    npm \
    git \
    nginx \
    docker \
    certbot \
    python3-certbot-nginx \
    wget \
    curl \
    unzip \
    htop \
    vim \
    tree

print_success "Packages installed"

# Install PM2 globally
print_status "Installing PM2..."
sudo npm install -g pm2
print_success "PM2 installed"

# Create application user
print_status "Creating application user..."
if ! id "$APP_USER" &>/dev/null; then
    sudo useradd -r -s /bin/bash -d /opt/$APP_USER $APP_USER
    sudo usermod -aG docker $APP_USER
    print_success "User $APP_USER created"
else
    print_warning "User $APP_USER already exists"
fi

# Create necessary directories
print_status "Creating application directories..."
sudo mkdir -p $APP_DIR
sudo mkdir -p $LOG_DIR
sudo mkdir -p $UPLOAD_DIR
sudo mkdir -p /etc/nginx/sites-available
sudo mkdir -p /etc/nginx/sites-enabled

# Set permissions
sudo chown -R $APP_USER:$APP_USER $APP_DIR
sudo chown -R $APP_USER:$APP_USER $LOG_DIR
sudo chown -R $APP_USER:$APP_USER $UPLOAD_DIR
print_success "Directories created and permissions set"

# Clone repository (if not exists)
if [ ! -d "$APP_DIR/.git" ]; then
    print_status "Cloning repository..."
    cd /tmp
    sudo -u $APP_USER git clone https://github.com/shakil-sayyed/Paradise-Bakes-Cafe.git $APP_DIR
    print_success "Repository cloned"
else
    print_status "Updating repository..."
    cd $APP_DIR
    sudo -u $APP_USER git pull origin main
    print_success "Repository updated"
fi

# Install dependencies
print_status "Installing Node.js dependencies..."
cd $APP_DIR
sudo -u $APP_USER npm install --production
print_success "Dependencies installed"

# Install client dependencies and build
print_status "Installing and building client..."
cd $APP_DIR/client
sudo -u $APP_USER npm install
sudo -u $APP_USER npm run build
print_success "Client built"

# Setup environment file
print_status "Setting up environment configuration..."
cd $APP_DIR
if [ ! -f ".env" ]; then
    sudo -u $APP_USER cp env.example .env
    print_success "Environment file created"
else
    print_warning "Environment file already exists"
fi

# Setup database
print_status "Setting up database..."
cd $APP_DIR
sudo -u $APP_USER npm run db:setup
sudo -u $APP_USER npm run db:seed
print_success "Database setup completed"

# Create PM2 ecosystem file
print_status "Creating PM2 configuration..."
cat > $APP_DIR/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$APP_NAME',
    script: 'server.js',
    cwd: '$APP_DIR',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '$LOG_DIR/pm2-error.log',
    out_file: '$LOG_DIR/pm2-out.log',
    log_file: '$LOG_DIR/pm2-combined.log',
    time: true
  }]
};
EOF

print_success "PM2 configuration created"

# Start application with PM2
print_status "Starting application with PM2..."
cd $APP_DIR
sudo -u $APP_USER pm2 start ecosystem.config.js
sudo -u $APP_USER pm2 save
sudo pm2 startup
print_success "Application started with PM2"

# Configure Nginx
print_status "Configuring Nginx..."
cat > /etc/nginx/sites-available/$APP_NAME << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN $EC2_IP;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
    
    # Client-side routing
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Static files
    location /uploads/ {
        alias $UPLOAD_DIR/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:3000/api/health;
        access_log off;
    }
    
    # Security: Hide nginx version
    server_tokens off;
    
    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t
print_success "Nginx configuration is valid"

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
print_success "Nginx started and enabled"

# Configure firewall
print_status "Configuring firewall..."
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --reload
print_success "Firewall configured"

# Setup SSL certificate (if domain is configured)
if [ "$DOMAIN" != "localhost" ]; then
    print_status "Setting up SSL certificate..."
    sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email info@$DOMAIN
    print_success "SSL certificate configured"
    
    # Setup auto-renewal
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
    print_success "SSL auto-renewal configured"
fi

# Create backup script
print_status "Creating backup script..."
cat > $APP_DIR/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups"
APP_DIR="/opt/paradise-bakes-cafe"

mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz -C /opt paradise-bakes-cafe

# Backup logs
tar -czf $BACKUP_DIR/logs_backup_$DATE.tar.gz -C /opt logs

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x $APP_DIR/backup.sh
print_success "Backup script created"

# Create health check script
print_status "Creating health check script..."
cat > $APP_DIR/health-check.sh << 'EOF'
#!/bin/bash
APP_URL="http://localhost:3000/api/health"
LOG_FILE="/opt/logs/health-check.log"

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $APP_URL)

if [ $RESPONSE -eq 200 ]; then
    echo "$(date): Application is healthy" >> $LOG_FILE
    exit 0
else
    echo "$(date): Application health check failed with code: $RESPONSE" >> $LOG_FILE
    # Restart application
    cd /opt/paradise-bakes-cafe
    pm2 restart all
    exit 1
fi
EOF

chmod +x $APP_DIR/health-check.sh
print_success "Health check script created"

# Setup cron jobs
print_status "Setting up cron jobs..."
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/paradise-bakes-cafe/health-check.sh") | crontab -
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/paradise-bakes-cafe/backup.sh") | crontab -
print_success "Cron jobs configured"

# Create monitoring script
print_status "Creating monitoring script..."
cat > $APP_DIR/monitor.sh << 'EOF'
#!/bin/bash
echo "=== Paradise Bakes & Cafe - System Status ==="
echo "Date: $(date)"
echo ""

echo "=== Application Status ==="
pm2 status

echo ""
echo "=== System Resources ==="
free -h
df -h /

echo ""
echo "=== Recent Logs ==="
tail -n 20 /opt/logs/paradise-cafe.log

echo ""
echo "=== Nginx Status ==="
systemctl status nginx --no-pager -l
EOF

chmod +x $APP_DIR/monitor.sh
print_success "Monitoring script created"

# Final status check
print_status "Performing final status check..."
sleep 5

# Check if application is running
if pm2 list | grep -q "$APP_NAME.*online"; then
    print_success "Application is running"
else
    print_error "Application failed to start"
    exit 1
fi

# Check if Nginx is running
if systemctl is-active --quiet nginx; then
    print_success "Nginx is running"
else
    print_error "Nginx failed to start"
    exit 1
fi

# Test application health
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
if [ $HEALTH_RESPONSE -eq 200 ]; then
    print_success "Application health check passed"
else
    print_error "Application health check failed"
    exit 1
fi

echo ""
print_success "🎉 Paradise Bakes & Cafe deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "  • Application: $APP_NAME"
echo "  • User: $APP_USER"
echo "  • Directory: $APP_DIR"
echo "  • Domain: $DOMAIN"
echo "  • IP: $EC2_IP"
echo ""
echo "🔧 Useful Commands:"
echo "  • Monitor app: pm2 monit"
echo "  • View logs: pm2 logs"
echo "  • Restart app: pm2 restart all"
echo "  • System status: /opt/paradise-bakes-cafe/monitor.sh"
echo "  • Backup: /opt/paradise-bakes-cafe/backup.sh"
echo ""
echo "🌐 Access URLs:"
echo "  • Public: http://$EC2_IP"
echo "  • Admin: http://$EC2_IP/admin"
echo "  • Health: http://$EC2_IP/api/health"
echo ""
echo "🔐 Admin Credentials:"
echo "  • Username: shakil"
echo "  • Password: Paradise123!"
echo ""
print_success "Deployment script completed!"
