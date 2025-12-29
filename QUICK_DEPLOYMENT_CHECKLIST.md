# Quick Deployment Checklist for Hostinger

## ⚠️ BEFORE YOU START

**You MUST have Hostinger VPS or Cloud Hosting** - Shared hosting will NOT work!

---

## Pre-Deployment Setup (Do This First)

### 1. Install Dependencies Locally
```bash
# Backend
cd nestjs-add-to-cart-backend
npm install

# Frontend  
cd ../frontend-project
npm install
```

### 2. Create Environment Files

**Backend `.env` file** (`nestjs-add-to-cart-backend/.env`):
```env
PORT=8000
NODE_ENV=production

DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=your_db_user_from_hostinger
DB_PASSWORD=your_db_password_from_hostinger
DB_DATABASE=your_db_name_from_hostinger

JWT_SECRET=generate-a-random-secret-key-here-min-32-characters
JWT_EXPIRES_IN=24h

FRONTEND_URL=https://yourdomain.com
```

**Frontend `.env` file** (`frontend-project/.env`):
```env
REACT_APP_API_URL=https://yourdomain.com/api
```

---

## Database Setup in Hostinger

1. **Login to Hostinger hPanel**
2. Go to **Databases** → **MySQL Databases**
3. Click **Create Database**
4. **Write down these credentials:**
   - Database name
   - Database username  
   - Database password
   - Database host (usually `localhost`)

---

## Upload Files to Server

### Option 1: Using FTP (FileZilla)
1. Download FileZilla
2. Get FTP credentials from Hostinger hPanel → FTP Accounts
3. Connect and upload:
   - Upload entire `nestjs-add-to-cart-backend` folder
   - Upload `frontend-project/build` folder contents to `public_html/`

### Option 2: Using Git + SSH (Recommended)
```bash
# SSH into server
ssh username@your-server-ip

# Clone repository
cd /home/username
git clone https://github.com/yourusername/your-repo.git
cd your-repo
```

---

## Server Setup Commands

```bash
# 1. Install Node.js (if not installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install PM2 (process manager)
sudo npm install -g pm2

# 3. Install MySQL client (if needed)
sudo apt-get update
sudo apt-get install mysql-client
```

---

## Deploy Backend

```bash
# Navigate to backend
cd nestjs-add-to-cart-backend

# Install dependencies
npm install --production

# Create .env file with your database credentials
nano .env
# (Paste your .env content, save with Ctrl+X, Y, Enter)

# Build backend
npm run build

# Start with PM2
pm2 start dist/main.js --name "backend-api"
pm2 save
pm2 startup
# (Run the command PM2 shows you)

# Check status
pm2 status
pm2 logs backend-api
```

---

## Deploy Frontend

### On Your Local Machine:
```bash
cd frontend-project

# Create .env file
echo "REACT_APP_API_URL=https://yourdomain.com/api" > .env

# Build
npm run build
```

### Upload to Server:
Upload the entire `build/` folder contents to:
- `/public_html/` (for main domain)
- Or `/public_html/subdomain/` (for subdomain)

### Create .htaccess (for Apache):
Create `.htaccess` in `public_html/`:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## Configure Reverse Proxy (Optional but Recommended)

If you want backend at `https://yourdomain.com/api`:

**For Apache** - Add to `.htaccess` or virtual host:
```apache
ProxyPass /api http://localhost:8000
ProxyPassReverse /api http://localhost:8000
```

**For Nginx** - Add to server config:
```nginx
location /api {
  proxy_pass http://localhost:8000;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection 'upgrade';
  proxy_set_header Host $host;
  proxy_cache_bypass $http_upgrade;
}
```

---

## SSL Certificate

1. In Hostinger hPanel → **SSL**
2. Install **Let's Encrypt** (free SSL)
3. Enable **Force HTTPS**

---

## Testing

1. **Test Backend:**
   ```bash
   curl http://localhost:8000
   # Or visit: https://yourdomain.com/api
   ```

2. **Test Frontend:**
   Visit: `https://yourdomain.com`

3. **Check Database:**
   - Try logging in/registering
   - Check if data saves correctly

---

## Common Issues & Fixes

### Backend won't start
```bash
pm2 logs backend-api
# Check for errors in logs
```

### Database connection error
- Verify credentials in `.env`
- Check MySQL is running: `sudo systemctl status mysql`
- Test connection: `mysql -u your_user -p your_database`

### Frontend can't connect to backend
- Check CORS in backend `.env`: `FRONTEND_URL=https://yourdomain.com`
- Verify API URL in frontend `.env`
- Check browser console for errors

### 502 Bad Gateway
- Backend might be down: `pm2 restart backend-api`
- Check if port 8000 is accessible

---

## Maintenance Commands

```bash
# View logs
pm2 logs backend-api

# Restart backend
pm2 restart backend-api

# Stop backend
pm2 stop backend-api

# Update application
cd /path/to/nestjs-add-to-cart-backend
git pull
npm install --production
npm run build
pm2 restart backend-api
```

---

## Security Checklist

- [ ] Changed JWT_SECRET to a strong random string
- [ ] Using strong database passwords
- [ ] SSL certificate installed
- [ ] CORS configured for your domain only
- [ ] `.env` file not in Git (should be in .gitignore)
- [ ] Database synchronize set to false in production (will be handled automatically)

---

## Need Help?

Refer to the detailed `DEPLOYMENT_GUIDE.md` for step-by-step instructions with explanations.

