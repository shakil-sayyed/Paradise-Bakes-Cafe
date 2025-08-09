# Paradise Bakes & Cafe

**App Name:** Paradise Bakes & Cafe  
**Primary Domains:**  
- [https://padisebakescafe.com](https://padisebakescafe.com)  
- [https://www.padisebakescafe.com](https://www.padisebakescafe.com)

This is the **production-grade, PWA-ready, full-stack web application** for Paradise Bakes & Cafe — featuring a mobile-first, accessible frontend and a secure, API-driven backend with full DevOps automation.

---

## 📂 Repository Structure

/frontend # React + Vite + TS + Tailwind + ShadCN UI
/backend # Node.js + Express + TS backend APIs
/configs # Nginx and other server configuration files
/scripts # Deployment, backup, git helper scripts
/db # SQL migrations, schema, and seed data
/seed # Sample images and JSON data for seeding


---

## 🚀 Features

- **PWA-enabled**: Offline caching, manifest, service worker
- **Mobile-first UI**: Food-themed branding, responsive components
- **i18n**: English & Hindi/Hinglish
- **Admin dashboard**: Business & Chef pages (JWT-protected)
- **Backend APIs**: Recipes, Equipment, Business entries, Auth
- **Secure**: bcrypt hashing, JWT tokens, rate limiting, input validation
- **Automation**: Scripts for deployment, backup, health checks
- **DevOps ready**: PM2 process manager, Nginx reverse proxy, SSL with Certbot

---

## 🛠 Prerequisites

**For Local Development**
- Node.js LTS (>=18.x)
- npm or yarn
- MySQL 8.x
- Git

**For Production (AWS EC2 Amazon Linux 2023)**
- Nginx
- MySQL client (or managed DB)
- PM2
- Certbot (for SSL)
- Git
- unzip, build-essential

---

## 📦 Setup

### 1️⃣ Clone the Repo
```bash
git clone git@github.com:<your-org>/paradise-bakes-cafe.git
cd paradise-bakes-cafe

2️⃣ Environment Variables
Copy .env.example to .env and fill in secure values:
cp .env.example .env
nano .env
3️⃣ Install Dependencies
cd backend && npm install
cd ../frontend && npm install
4️⃣ Database Setup
Run migrations and seed:
cd ..
scripts/seed_db.sh
🚀 Deployment on AWS EC2
1️⃣ Launch EC2 Instance
Amazon Linux 2023, t3.small or higher
Security group: Allow ports 80, 443, SSH (custom port recommended)
2️⃣ Connect to EC2
ssh -i your-key.pem ec2-user@your-ec2-public-ip
3️⃣ Install & Deploy
# From EC2 terminal
git clone git@github.com:<your-org>/paradise-bakes-cafe.git
cd paradise-bakes-cafe
cp .env.example .env  # Fill in production values
nano .env
bash scripts/deploy_full.sh

🔄 Rollback
If a deployment fails, you can:
pm2 revert <revision_id>
Or restore from the last DB backup:
mysql -u $DB_USER -p$DB_PASS $DB_NAME < /var/backups/pbc/backup-YYYY-MM-DD.sql.gz
📅 Backups
Daily backups run via cron:
0 2 * * * /bin/bash /path/to/paradise-bakes-cafe/scripts/backup_db.sh >> /var/log/pbc/backup.log 2>&1
Backups stored in /var/backups/pbc, rotated every 30 days. Optional S3 upload via .env.
🛡 Security
Change all seed credentials immediately after first deploy.
Restrict MySQL to localhost or private network.
Use AWS Secrets Manager for long-term credential storage.
Enable firewall to allow only HTTP(S) and SSH from trusted IPs.
🩺 Health Checks
To verify system status:
bash scripts/health_check.sh
📚 Documentation
SECURITY_NOTES.md – post-deploy security hardening
DEPLOYCHECKLIST.md – exact production deployment steps
Author: IT & DevOps Team – Paradise Bakes & Cafe
License: Paradise Bakes & Cafe

---

