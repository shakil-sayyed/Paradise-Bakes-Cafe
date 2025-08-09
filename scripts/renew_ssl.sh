#!/bin/bash
set -e

LOG_FILE="/var/log/pbc/renew_ssl.log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "Starting SSL certificate renewal via certbot..."

certbot renew --quiet --no-self-upgrade

echo "Reloading Nginx to apply renewed certificates..."
systemctl reload nginx

echo "SSL renewal completed at $(date)."

