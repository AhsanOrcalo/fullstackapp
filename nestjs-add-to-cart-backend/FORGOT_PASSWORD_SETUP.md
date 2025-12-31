# Forgot Password Implementation Guide

## Overview

The forgot password functionality allows users to request a temporary password via email when they forget their password. The system generates a secure random temporary password, updates the user's account, and sends it via email.

## How It Works

### Flow:
1. User enters their email address on the "Forgot Password" page
2. Backend validates the email and finds the user
3. System generates a random 10-character temporary password (letters, numbers, special chars)
4. Temporary password is hashed and saved to the user's account
5. Email is sent to the user with the temporary password
6. User logs in with the temporary password
7. User should change password after logging in (via Change Password feature)

### Security Features:
- **Email Enumeration Protection**: Always returns the same success message regardless of whether email exists
- **Secure Password Generation**: Uses cryptographically secure random password generation
- **Password Hashing**: Temporary password is hashed using bcrypt before storage
- **One-time Use**: Each request generates a new temporary password, invalidating the previous one

## Environment Variables for Production

To enable email sending in production, you **MUST** set the following environment variables in your `.env` file:

### Required SMTP Configuration

```env
# SMTP Server Configuration
SMTP_HOST=smtp.gmail.com          # Your SMTP server host (Gmail, SendGrid, etc.)
SMTP_PORT=587                     # SMTP port (587 for TLS, 465 for SSL)
SMTP_USER=your-email@gmail.com    # Your SMTP username/email
SMTP_PASS=your-app-password       # Your SMTP password or app password
SMTP_FROM=noreply@yourdomain.com  # From email address (optional, defaults to SMTP_USER)

# Environment Mode
NODE_ENV=production                # Set to 'production' for production mode
```

### Example Configurations

#### Gmail Configuration:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password  # Use App Password, not regular password
SMTP_FROM=noreply@yourdomain.com
NODE_ENV=production
```

**Note for Gmail**: You need to:
1. Enable 2-Step Verification
2. Generate an "App Password" (not your regular password)
3. Use the App Password as `SMTP_PASS`

#### SendGrid Configuration:
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=noreply@yourdomain.com
NODE_ENV=production
```

#### Custom SMTP Server:
```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-email-password
SMTP_FROM=noreply@yourdomain.com
NODE_ENV=production
```

## Development vs Production Behavior

### Development Mode (`NODE_ENV !== 'production'`):
- ✅ Temporary passwords are **logged to console** for testing
- ✅ Email sending is attempted but errors are logged (not thrown)
- ✅ Useful for testing without configuring SMTP

### Production Mode (`NODE_ENV=production`):
- ❌ Temporary passwords are **NOT logged** (security)
- ✅ Email sending is **required** - errors are thrown
- ✅ SMTP credentials **must** be configured

## API Endpoint

### Request Password Reset
```
POST /auth/forget-password
Content-Type: application/json

Body:
{
  "email": "user@example.com"
}

Response:
{
  "message": "If the email exists, a temporary password has been sent to your email address."
}
```

## Email Template

The system sends an HTML email with:
- Subject: "Password Reset - Temporary Password"
- Temporary password displayed prominently
- Security instructions
- Reminder to change password after login

## Testing in Production

1. **Set all required environment variables** in your production `.env` file
2. **Test SMTP connection** - The system will verify connection on startup
3. **Test password reset flow**:
   - Request password reset with a test email
   - Check email inbox for temporary password
   - Login with temporary password
   - Change password after login

## Troubleshooting

### Email Not Sending

**Check:**
1. ✅ All SMTP environment variables are set
2. ✅ `NODE_ENV=production` is set
3. ✅ SMTP credentials are correct
4. ✅ SMTP server allows connections from your server IP
5. ✅ Check server logs for SMTP errors

### Common SMTP Errors:

- **EAUTH**: Authentication failed - Check `SMTP_USER` and `SMTP_PASS`
- **ECONNECTION**: Connection failed - Check `SMTP_HOST` and `SMTP_PORT`
- **ETIMEDOUT**: Connection timeout - Check firewall/network settings

### Gmail Specific Issues:

- Use **App Password**, not regular password
- Enable "Less secure app access" OR use App Password
- Check if account has 2-Step Verification enabled

## Security Best Practices

1. ✅ **Never log temporary passwords in production**
2. ✅ **Use strong SMTP credentials** (App Passwords for Gmail)
3. ✅ **Set `NODE_ENV=production`** in production
4. ✅ **Use HTTPS** for all API calls
5. ✅ **Monitor email sending** for suspicious activity
6. ✅ **Rate limit** password reset requests (future enhancement)

## Frontend Integration

The frontend has a "Forgot Password" page at `/forget` that:
- Collects user email
- Calls the API endpoint
- Shows success message
- Redirects to login page

## Related Features

- **Change Password**: After logging in with temporary password, users should change it via `/auth/change-password`
- **Login**: Users can login with temporary password using normal login flow

