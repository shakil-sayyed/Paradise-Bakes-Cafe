# Paradise Bakes & Cafe - Security & Operations Notes

## 1. Remove Hardcoded Development Credentials Post-Deployment

- The dev DB user `tcp_shakil` and password `Simple4me1!` are included only for seeding and development.
- Immediately after deployment, rotate all default passwords and revoke access if unused.
- Update `.env` with production secrets and never commit real secrets to Git.

## 2. Use AWS Secrets Manager or Parameter Store

- Store all sensitive environment variables securely in AWS Secrets Manager or Systems Manager Parameter Store.
- Integrate these secrets into your deployment pipeline or server environment.
- Avoid exposing secrets in logs or frontend bundles.

## 3. Firewall Setup

- Restrict inbound traffic to only required ports:
  - HTTP (80)
  - HTTPS (443)
  - SSH (preferably custom port)
  - MySQL (3306) only accessible from localhost or trusted internal network

- Example with `iptables` or `ufw`:

```bash
# Basic iptables example
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
iptables -A INPUT -p tcp --dport 3306 -s 127.0.0.1 -j ACCEPT
iptables -A INPUT -j DROP

4. SSL/TLS Security
Certbot installs and auto-renews certificates.
Nginx is configured with strong SSL ciphers and HSTS enabled.
Monitor cert expiration and renewal logs at /var/log/letsencrypt/.
5. Node.js and PM2 Security
Run Node.js processes as non-root user pbc_user.
Use PM2 ecosystem config with environment variables.
Regularly update Node.js and dependencies to patch vulnerabilities.
Monitor application logs for suspicious activity.
6. Database Security
Use parameterized queries to prevent SQL injection.
Restrict DB user privileges to minimum necessary.
Regularly backup databases and test restores.
Enable MySQL slow query log and monitor for suspicious queries.
7. Rate Limiting & Input Validation
API rate limits configured on authentication and admin routes.
All input is validated and sanitized using Joi/express-validator.
Monitor logs for unusual traffic spikes or brute-force attempts.
8. Logging & Monitoring
Logs are stored in /var/log/pbc/ with timestamps.
Implement centralized logging (e.g., CloudWatch, ELK) for production.
Set alerts on critical errors or downtime.
9. Backup & Recovery
Daily backups configured with rotation and optional S3 upload.
Test backup restoration procedures regularly.
Secure backup storage location and restrict access.
Ensure continuous security audits and keep all systems updated.
