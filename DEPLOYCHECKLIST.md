# Paradise Bakes & Cafe - Deployment Checklist for AWS EC2 (Amazon Linux 2023)

## 1. Prepare EC2 Instance

```bash
sudo yum update -y
sudo yum install -y git curl unzip nginx
sudo amazon-linux-extras enable nodejs16
sudo yum install -y nodejs mysql
sudo npm install -g pm2
sudo systemctl enable nginx
sudo systemctl start nginx
2. Clone the Repo
git clone <your-repo-url> /home/ec2-user/paradise-bakes-cafe
cd /home/ec2-user/paradise-bakes-cafe
3. Setup Environment Variables
Copy .env.example to .env
Fill all variables securely (DB credentials, JWT secrets, S3 keys if used)
cp .env.example .env
nano .env
4. Run Full Deployment Script
chmod +x scripts/deploy_full.sh
sudo ./scripts/deploy_full.sh
Optional flags:
--no-db (skip DB install/migrations if using managed DB)
--no-ssl (skip SSL setup if using external certs)
5. Seed Database
sudo ./scripts/seed_db.sh
6. Verify Application
Visit: https://padisebakescafe.com
Check PM2 status:
pm2 status
Check logs:
tail -f /var/log/pbc/deploy_full.log
7. Setup Daily Backup Cron Job
Add to root crontab:
0 2 * * * /home/ec2-user/paradise-bakes-cafe/scripts/backup_db.sh >> /var/log/pbc/backup_db.log 2>&1
8. SSL Auto Renewal Cron (Certbot)
Certbot renewal is auto-configured during deploy.
Check with:

sudo certbot renew --dry-run
9. Manage Git Operations
To push changes safely:
./scripts/git_push.sh "Commit message"
To pull and update:
./scripts/git_pull.sh
To clone and setup fresh:
./scripts/git_clone_and_setup.sh <repo-url>
10. Changing Admin Passwords
Use backend API /auth/change-password (implement frontend/admin UI or use curl with JWT)
Immediately change seeded passwords on first login.
11. Security Notes
Remove hardcoded dev creds post-deploy.
Use AWS Secrets Manager or SSM Parameter Store for production secrets.
Enable firewall (iptables/ufw) to restrict ports.
Troubleshooting Tips
Nginx errors: Check /var/log/nginx/error.log
PM2 logs: pm2 logs
Database issues: Ensure MySQL service is running and credentials in .env are correct.
SSL issues: Check Certbot logs in /var/log/letsencrypt/

