# Quick Start Guide

## Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up MongoDB

**Option A: Local MongoDB**
```bash
# Install MongoDB locally
# macOS: brew install mongodb-community
# Ubuntu: sudo apt install mongodb
# Windows: Download from mongodb.com

# Start MongoDB
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
# Windows: Start MongoDB service
```

**Option B: MongoDB Atlas (Cloud)**
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string

### 3. Configure Environment

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` and set:
```env
MONGODB_URI=mongodb://localhost:27017/cart-backend
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cart-backend

JWT_SECRET=your-secret-key-change-in-production
PORT=8000
```

### 4. Build and Run

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

### 5. Verify Installation

- API: http://localhost:8000
- Swagger Docs: http://localhost:8000/api
- Default Admin: username: `admin`, password: `admin123`

## Common Issues

### MongoDB Connection Error

**Error:** `MongooseError: connect ECONNREFUSED`

**Solution:**
1. Ensure MongoDB is running: `mongosh` (should connect)
2. Check connection string in `.env`
3. For MongoDB Atlas: Check IP whitelist and credentials

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::8000`

**Solution:**
```bash
# Find process using port 8000
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Kill the process or change PORT in .env
```

### Module Not Found Errors

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Testing the API

### 1. Register a User

```bash
curl -X POST http://localhost:8000/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "testuser",
    "email": "test@example.com",
    "phoneNumber": "+1234567890",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:8000/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "testuser",
    "password": "password123"
  }'
```

Save the `access_token` from the response.

### 3. Access Protected Route

```bash
curl -X GET http://localhost:8000/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Next Steps

1. Review `DEPLOYMENT.md` for production deployment
2. Review `MIGRATION_SUMMARY.md` for migration details
3. Update `.env` with production values
4. Set up MongoDB backups
5. Configure SSL/HTTPS for production

