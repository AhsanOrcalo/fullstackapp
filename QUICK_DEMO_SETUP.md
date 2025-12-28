# Quick Demo Setup with ngrok

## Prerequisites
1. Install ngrok from https://ngrok.com/download
2. Sign up at https://dashboard.ngrok.com/signup
3. Run: `ngrok authtoken YOUR_TOKEN` (get token from ngrok dashboard)

## Step-by-Step Instructions

### Terminal 1: Start Backend
```powershell
cd nestjs-add-to-cart-backend
npm run start:prod
```
Backend will run on http://localhost:8000

### Terminal 2: Expose Backend with ngrok
```powershell
ngrok http 8000
```
**Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)
You'll see something like:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:8000
```

### Terminal 3: Update Frontend .env file
1. Create/edit `frontend-project/.env` file
2. Add this line (replace with your actual ngrok URL):
```
REACT_APP_API_URL=https://abc123.ngrok.io
```

### Terminal 4: Start Frontend
```powershell
cd frontend-project
npm start
```
Frontend will run on http://localhost:3000

### Terminal 5: Expose Frontend with ngrok
```powershell
ngrok http 3000
```
**Copy the HTTPS URL** (e.g., `https://xyz789.ngrok.io`)

## Share with Client
Share the **Terminal 5 HTTPS URL** with your client!

## Important Notes
- Keep all 5 terminals running while demo is active
- ngrok free URLs change every time you restart ngrok
- Free tier has connection limits
- Backend CORS is already configured to accept any origin

## Troubleshooting
- If frontend can't connect: Check that `.env` file has correct ngrok backend URL
- If CORS errors: Backend should accept all origins, but check Terminal 1 for errors
- Restart frontend after changing `.env` file

