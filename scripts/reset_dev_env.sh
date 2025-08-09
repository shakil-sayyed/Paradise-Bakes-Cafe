#!/bin/bash
# ==========================================================
# Paradise Bakes & Cafe - Reset Development Environment
# Author: TCP DevOps Team
# Purpose: Drops, recreates, and seeds the database + clears caches
# Usage: ./reset_dev_env.sh
# ==========================================================

set -e

# -----------------------------
# Configurable Variables
# -----------------------------
DB_NAME="tcp_database"
DB_USER="tcp_shakil"
DB_PASS="Simple4me1!"
DB_HOST="localhost"
INIT_SQL="./db/init.sql"
SEED_SQL="./db/seed.sql"
FRONTEND_DIR="./frontend"
BACKEND_DIR="./backend"

echo "♻️  Resetting development environment for Paradise Bakes & Cafe"

# -----------------------------
# Step 1: Drop & Recreate DB
# -----------------------------
echo "🗑  Dropping & recreating database..."
mysql -u"$DB_USER" -p"$DB_PASS" -h"$DB_HOST" < "$INIT_SQL"
echo "✅ Database recreated"

# -----------------------------
# Step 2: Seed Initial Data
# -----------------------------
echo "🌱 Seeding database..."
mysql -u"$DB_USER" -p"$DB_PASS" -h"$DB_HOST" "$DB_NAME" < "$SEED_SQL"
echo "✅ Database seeded"

# -----------------------------
# Step 3: Install Backend Deps
# -----------------------------
echo "📦 Installing backend dependencies..."
cd "$BACKEND_DIR"
npm install
cd ..

# -----------------------------
# Step 4: Install Frontend Deps
# -----------------------------
echo "📦 Installing frontend dependencies..."
cd "$FRONTEND_DIR"
npm install
cd ..

# -----------------------------
# Step 5: Clear Caches
# -----------------------------
echo "🧹 Clearing caches..."
rm -rf "$FRONTEND_DIR/.cache" "$FRONTEND_DIR/dist"
rm -rf "$BACKEND_DIR/node_modules/.cache"
echo "✅ Caches cleared"

# -----------------------------
# Step 6: Start Development Servers
# -----------------------------
echo "🚀 Starting development servers..."
cd "$BACKEND_DIR" && npm run dev & 
cd "$FRONTEND_DIR" && npm run dev & 
echo "✅ Dev servers running"

# -----------------------------
# Complete
# -----------------------------
echo "🎉 Development environment reset complete"

