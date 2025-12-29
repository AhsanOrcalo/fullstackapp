# Deployment Guide for NestJS Backend on Hostinger VPS (Ubuntu)

This guide will help you deploy your NestJS MongoDB backend application on a Hostinger VPS running Ubuntu.

## Prerequisites

- Hostinger VPS with Ubuntu (20.04 or later recommended)
- SSH access to your VPS
- Domain name (optional but recommended)
- Basic knowledge of Linux commands

## Step 1: Initial Server Setup

### 1.1 Connect to Your VPS

```bash
ssh root@your-server-ip
```

### 1.2 Update System Packages

```bash
apt update && apt upgrade -y
```

### 1.3 Install Required Software

```bash
# Install Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update
apt install -y mongodb-org

# Install PM2 (Process Manager)
npm install -g pm2

# Install Nginx (Reverse Proxy)
apt install -y nginx

# Install Git
apt install -y git
```

### 1.4 Start MongoDB

```bash
systemctl start mongod
systemctl enable mongod
```

### 1.5 Configure MongoDB (Optional but Recommended)

Edit MongoDB config to allow external connections (if needed):

```bash
nano /etc/mongod.conf
```

Change `bindIp` from `127.0.0.1` to `0.0.0.0` (only if you need external access - be careful with security!)

Restart MongoDB:
```bash
systemctl restart mongod
```

## Step 2: Deploy Your Application

### 2.1 Create Application Directory

```bash
mkdir -p /var/www/nestjs-backend
cd /var/www/nestjs-backend
```

### 2.2 Clone Your Repository

```bash
# Option 1: Clone from Git
git clone https://github.com/yourusername/your-repo.git .

# Option 2: Upload files via SCP from your local machine
# On your local machine:
# scp -r nestjs-add-to-cart-backend/* root@your-server-ip:/var/www/nestjs-backend/
```

### 2.3 Install Dependencies

```bash
cd /var/www/nestjs-backend/nestjs-add-to-cart-backend
npm install --production
```

### 2.4 Create Environment File

```bash
nano .env
```

Add the following content:

```env
# MongoDB Connection (use localhost since MongoDB is on same server)
MONGODB_URI=mongodb://localhost:27017/cart-backend

# JWT Secret (USE A STRONG RANDOM STRING!)
JWT_SECRET=your-very-strong-random-secret-key-here

# Server Port
PORT=8000

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# CORS Origin (your frontend domain)
CORS_ORIGIN=https://your-frontend-domain.com
```

**Important:** Generate a strong JWT secret:
```bash
openssl rand -base64 32
```

### 2.5 Build the Application

```bash
npm run build
```

## Step 3: Configure PM2

### 3.1 Create PM2 Ecosystem File

```bash
nano ecosystem.config.js
```

Add the following:

```javascript
module.exports = {
  apps: [{
    name: 'nestjs-backend',
    script: 'dist/main.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 8000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
```

### 3.2 Start Application with PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

The last command will show you a command to run - execute it to enable PM2 on system startup.

### 3.3 Check Application Status

```bash
pm2 status
pm2 logs nestjs-backend
```

## Step 4: Configure Nginx as Reverse Proxy

### 4.1 Create Nginx Configuration

```bash
nano /etc/nginx/sites-available/nestjs-backend
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect HTTP to HTTPS (after SSL setup)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4.2 Enable the Site

```bash
ln -s /etc/nginx/sites-available/nestjs-backend /etc/nginx/sites-enabled/
nginx -t  # Test configuration
systemctl restart nginx
```

## Step 5: Configure SSL with Let's Encrypt (Recommended)

### 5.1 Install Certbot

```bash
apt install -y certbot python3-certbot-nginx
```

### 5.2 Obtain SSL Certificate

```bash
certbot --nginx -d your-domain.com -d www.your-domain.com
```

Follow the prompts. Certbot will automatically configure Nginx for HTTPS.

### 5.3 Auto-Renewal

Certbot sets up auto-renewal automatically. Test it:

```bash
certbot renew --dry-run
```

## Step 6: Configure Firewall

### 6.1 Set Up UFW (Uncomplicated Firewall)

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

### 6.2 Verify Firewall Status

```bash
ufw status
```

## Step 7: MongoDB Security (Important!)

### 7.1 Create MongoDB Admin User

```bash
mongosh
```

In MongoDB shell:

```javascript
use admin
db.createUser({
  user: "admin",
  pwd: "your-strong-password",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
})
exit
```

### 7.2 Enable MongoDB Authentication

```bash
nano /etc/mongod.conf
```

Add/update:

```yaml
security:
  authorization: enabled
```

Restart MongoDB:
```bash
systemctl restart mongod
```

### 7.3 Update Application Connection String

Update your `.env` file:

```env
MONGODB_URI=mongodb://admin:your-strong-password@localhost:27017/cart-backend?authSource=admin
```

Restart your application:
```bash
pm2 restart nestjs-backend
```

## Step 8: Monitoring and Maintenance

### 8.1 PM2 Commands

```bash
pm2 status              # Check status
pm2 logs nestjs-backend # View logs
pm2 restart nestjs-backend # Restart app
pm2 stop nestjs-backend    # Stop app
pm2 delete nestjs-backend # Remove from PM2
```

### 8.2 Check Application Health

```bash
# Check if app is running
curl http://localhost:8000

# Check MongoDB
systemctl status mongod
mongosh --eval "db.adminCommand('ping')"
```

### 8.3 Set Up Log Rotation

PM2 handles log rotation, but you can configure it:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## Step 9: Updating Your Application

When you need to update your application:

```bash
cd /var/www/nestjs-backend/nestjs-add-to-cart-backend
git pull  # or upload new files
npm install --production
npm run build
pm2 restart nestjs-backend
```

## Troubleshooting

### Application Won't Start

1. Check PM2 logs: `pm2 logs nestjs-backend`
2. Check if port is in use: `netstat -tulpn | grep 8000`
3. Verify environment variables: `pm2 env nestjs-backend`

### MongoDB Connection Issues

1. Check MongoDB status: `systemctl status mongod`
2. Check MongoDB logs: `tail -f /var/log/mongodb/mongod.log`
3. Test connection: `mongosh "mongodb://localhost:27017"`

### Nginx Issues

1. Check Nginx status: `systemctl status nginx`
2. Test configuration: `nginx -t`
3. Check error logs: `tail -f /var/log/nginx/error.log`

### Permission Issues

If you encounter permission issues:

```bash
chown -R $USER:$USER /var/www/nestjs-backend
chmod -R 755 /var/www/nestjs-backend
```

## Security Checklist

- [ ] Changed default MongoDB admin password
- [ ] Enabled MongoDB authentication
- [ ] Set strong JWT_SECRET in .env
- [ ] Configured firewall (UFW)
- [ ] Installed SSL certificate
- [ ] Set up log rotation
- [ ] Configured CORS properly
- [ ] Regular system updates: `apt update && apt upgrade`
- [ ] Backed up MongoDB database regularly

## Backup Strategy

### MongoDB Backup

Create a backup script:

```bash
nano /root/backup-mongodb.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/root/mongodb-backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
mongodump --out $BACKUP_DIR/backup_$DATE
# Keep only last 7 days
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} +
```

Make it executable:
```bash
chmod +x /root/backup-mongodb.sh
```

Add to crontab (daily at 2 AM):
```bash
crontab -e
# Add this line:
0 2 * * * /root/backup-mongodb.sh
```

## Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

## Support

If you encounter issues:
1. Check application logs: `pm2 logs nestjs-backend`
2. Check system logs: `journalctl -xe`
3. Verify all services are running: `systemctl status mongod nginx`

---

**Note:** Replace all placeholder values (your-domain.com, your-email@gmail.com, etc.) with your actual values.

