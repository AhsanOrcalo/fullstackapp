# Complete Deployment Guide for Hostinger

## ⚠️ CRITICAL REQUIREMENT

**You MUST have Hostinger VPS or Cloud Hosting** - Shared hosting will NOT work for Node.js/NestJS backend.

If you only have shared hosting, you have two options:
1. Upgrade to VPS/Cloud hosting (recommended)
2. Deploy backend separately (e.g., Railway, Render, Heroku) and frontend on Hostinger

---

## Prerequisites

1. **Hostinger VPS/Cloud Hosting Account** with:
   - SSH access
   - Node.js support (v18+)
   - MySQL database
   - Domain name configured

2. **Local Setup:**
   - Git installed
   - SSH key pair (for secure server access)

---

## Part 1: Database Setup (MySQL Migration)

### Step 1.1: Create MySQL Database in Hostinger

1. Log into Hostinger control panel (hPanel)
2. Go to **Databases** → **MySQL Databases**
3. Click **Create Database**
4. Note down:
   - Database name: `your_db_name`
   - Database username: `your_db_user`
   - Database password: `your_db_password`
   - Database host: Usually `localhost` or `127.0.0.1`

### Step 1.2: Update Backend to Use MySQL

We need to migrate from SQLite to MySQL. The backend code will be updated to support MySQL.

---

## Part 2: Prepare Your Code for Deployment

### Step 2.1: Update Backend Configuration

The backend needs environment variables and MySQL configuration. We'll create:
- `.env` file for production
- Updated database configuration

### Step 2.2: Update Frontend API URL

The frontend needs to point to your production backend URL instead of `localhost:8000`.

---

## Part 3: Upload Files to Hostinger

### Option A: Using FTP/SFTP (FileZilla)

1. **Download FileZilla** (https://filezilla-project.org/)
2. **Get FTP credentials from Hostinger:**
   - Go to hPanel → **FTP Accounts**
   - Note: FTP host, username, password
3. **Connect to server:**
   - Host: Your FTP host
   - Username: Your FTP username
   - Password: Your FTP password
   - Port: 21 (FTP) or 22 (SFTP - recommended)
4. **Upload structure:**
   ```
   /public_html/
   ├── api/          (backend files)
   └── frontend/     (built frontend files)
   ```

### Option B: Using Git (Recommended)

1. **SSH into your server:**
   ```bash
   ssh username@your-server-ip
   ```

2. **Clone your repository:**
   ```bash
   cd /home/username
   git clone https://github.com/yourusername/your-repo.git
   cd your-repo
   ```

---

## Part 4: Server Setup

### Step 4.1: Install Node.js (if not pre-installed)

```bash
# Check Node.js version
node -v

# If not installed or wrong version, install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node -v
npm -v
```

### Step 4.2: Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

PM2 will keep your backend running even after you disconnect.

### Step 4.3: Install MySQL Client (if needed)

```bash
sudo apt-get update
sudo apt-get install mysql-client
```

---

## Part 5: Backend Deployment

### Step 5.1: Navigate to Backend Directory

```bash
cd /path/to/your/project/nestjs-add-to-cart-backend
```

### Step 5.2: Install Dependencies

```bash
npm install --production
```

### Step 5.3: Install MySQL Driver

```bash
npm install mysql2
```

### Step 5.4: Create Production Environment File

Create `.env` file in backend directory:

```bash
nano .env
```

Add these variables (replace with your actual values):

```env
# Server Configuration
PORT=8000
NODE_ENV=production

# Database Configuration
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_DATABASE=your_db_name

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# CORS - Your frontend domain
FRONTEND_URL=https://yourdomain.com

# Email Configuration (if using email features)
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=465
EMAIL_USER=your-email@yourdomain.com
EMAIL_PASS=your-email-password
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

### Step 5.5: Build Backend

```bash
npm run build
```

This creates the `dist/` folder with compiled JavaScript.

### Step 5.6: Start Backend with PM2

```bash
pm2 start dist/main.js --name "backend-api"
pm2 save
pm2 startup
```

The last command will show you a command to run - copy and execute it to enable auto-start on server reboot.

### Step 5.7: Check Backend Status

```bash
pm2 status
pm2 logs backend-api
```

Your backend should now be running on port 8000.

---

## Part 6: Frontend Deployment

### Step 6.1: Build Frontend Locally (or on server)

**Option A: Build on your local machine:**

```bash
cd frontend-project
npm install
npm run build
```

This creates a `build/` folder with production-ready files.

**Option B: Build on server:**

```bash
cd /path/to/your/project/frontend-project
npm install
npm run build
```

### Step 6.2: Update API URL Before Building

Before building, update `frontend-project/src/services/api.js`:

Change:
```javascript
const API_BASE_URL = 'http://localhost:8000';
```

To:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://yourdomain.com/api';
```

Or create `.env` file in `frontend-project/`:
```
REACT_APP_API_URL=https://yourdomain.com/api
```

### Step 6.3: Upload Frontend Build

Upload the entire `build/` folder contents to:
```
/public_html/          (or /home/username/public_html/)
```

Or if using subdomain:
```
/public_html/frontend/
```

### Step 6.4: Configure Web Server (Apache/Nginx)

**For Apache (.htaccess in public_html):**

Create `.htaccess` file in `public_html/`:

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

**For Nginx (if you have access):**

Add to your Nginx config:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

---

## Part 7: Database Migration

### Step 7.1: Update Backend Database Configuration

The backend code needs to be updated to use MySQL instead of SQLite. This will be done in the code changes.

### Step 7.2: Run Database Migrations

Once the backend is updated, the database tables will be created automatically on first run (if `synchronize: true` is set) OR you can use TypeORM migrations.

**Important:** For production, set `synchronize: false` and use migrations instead.

### Step 7.3: Verify Database Connection

Check backend logs:
```bash
pm2 logs backend-api
```

You should see successful database connection messages.

---

## Part 8: Configure Domain & SSL

### Step 8.1: Point Domain to Server

1. In Hostinger hPanel, go to **Domains**
2. Point your domain to your server IP
3. Wait for DNS propagation (can take up to 48 hours, usually faster)

### Step 8.2: Install SSL Certificate

1. In hPanel, go to **SSL**
2. Install free Let's Encrypt SSL certificate
3. Force HTTPS redirect

---

## Part 9: Final Configuration

### Step 9.1: Update CORS in Backend

Ensure backend `main.ts` allows your frontend domain:

```typescript
app.enableCors({
  origin: ['https://yourdomain.com', 'https://www.yourdomain.com'],
  credentials: true,
});
```

Rebuild and restart:
```bash
cd nestjs-add-to-cart-backend
npm run build
pm2 restart backend-api
```

### Step 9.2: Configure Reverse Proxy (if needed)

If you want backend at `https://yourdomain.com/api`, configure reverse proxy in Apache/Nginx.

**Apache (.htaccess or virtual host):**

```apache
ProxyPass /api http://localhost:8000
ProxyPassReverse /api http://localhost:8000
```

**Nginx:**

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

## Part 10: Testing & Verification

### Step 10.1: Test Backend

```bash
curl https://yourdomain.com/api
# Or
curl http://localhost:8000
```

### Step 10.2: Test Frontend

Visit `https://yourdomain.com` in browser

### Step 10.3: Test Database

Check if data is being saved/retrieved correctly through the application.

---

## Troubleshooting

### Backend won't start
- Check logs: `pm2 logs backend-api`
- Verify Node.js version: `node -v`
- Check port availability: `netstat -tulpn | grep 8000`

### Database connection errors
- Verify database credentials in `.env`
- Check if MySQL is running: `sudo systemctl status mysql`
- Test connection: `mysql -u your_db_user -p your_db_name`

### Frontend can't connect to backend
- Check CORS configuration
- Verify API URL in frontend code
- Check browser console for errors
- Verify backend is running: `pm2 status`

### 502 Bad Gateway
- Backend might not be running: `pm2 restart backend-api`
- Check firewall settings
- Verify reverse proxy configuration

### Port already in use
- Change port in `.env` file
- Or kill process using port: `sudo lsof -ti:8000 | xargs kill -9`

---

## Maintenance Commands

```bash
# View backend logs
pm2 logs backend-api

# Restart backend
pm2 restart backend-api

# Stop backend
pm2 stop backend-api

# View backend status
pm2 status

# Update application
cd /path/to/project
git pull
cd nestjs-add-to-cart-backend
npm install --production
npm run build
pm2 restart backend-api
```

---

## Security Checklist

- [ ] Changed default JWT_SECRET
- [ ] Using strong database passwords
- [ ] SSL certificate installed
- [ ] CORS configured for specific domains only
- [ ] Environment variables not committed to Git
- [ ] Database `synchronize` set to `false` in production
- [ ] Firewall configured (if applicable)
- [ ] Regular backups scheduled

---

## Next Steps

After deployment, you should:
1. Set up automated backups for database
2. Configure monitoring (PM2 monitoring or external service)
3. Set up error tracking (Sentry, etc.)
4. Configure CDN for frontend assets (optional)
5. Set up CI/CD pipeline for future deployments

