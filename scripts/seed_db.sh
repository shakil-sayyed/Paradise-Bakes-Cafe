#!/bin/bash
set -e

LOG_FILE="/var/log/pbc/seed_db.log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "Starting DB migration and seeding..."

# Load .env variables for DB connection
if [ ! -f .env ]; then
  echo ".env file not found! Please create it from .env.example"
  exit 1
fi

source <(grep = .env | sed 's/^/export /')

MYSQL_CMD="mysql -h${DB_HOST} -P${DB_PORT} -u${DB_USER} -p${DB_PASSWORD} ${DB_NAME}"

echo "Running migration script..."
cat db/init.sql | ${MYSQL_CMD}

echo "Seeding initial data..."
cat db/seed.sql | ${MYSQL_CMD}

echo "DB migration and seeding completed at $(date)."

