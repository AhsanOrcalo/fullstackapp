# Plisio Payment Gateway Integration Setup

## Overview
This application uses Plisio as the cryptocurrency payment gateway for accepting payments from users.

## Prerequisites
1. Create a Plisio account at https://plisio.net/
2. Complete merchant registration
3. Obtain your Secret Key from the API section

## Environment Variables

Add the following environment variable to your `.env` file in the `nestjs-add-to-cart-backend` directory:

```env
# Plisio Configuration
PLISIO_SECRET_KEY=your_secret_key_here

# Plisio URLs (optional - will use defaults if not set)
PLISIO_STATUS_URL=https://yourdomain.com/api/payments/webhook  # Webhook URL (Status URL)
PLISIO_SUCCESS_URL=https://yourdomain.com/payment-success      # Success redirect URL
PLISIO_FAIL_URL=https://yourdomain.com/payment-failed          # Failed redirect URL

# Application URLs (for webhooks and redirects - used as defaults if Plisio URLs not set)
FRONTEND_URL=http://localhost:3001
BACKEND_URL=http://localhost:8000
```

## Getting Plisio Credentials

1. **Log in to Plisio Dashboard**
   - Visit https://plisio.net/ and log in

2. **Navigate to API Settings**
   - Go to your account settings
   - Find the API section
   - Copy your Secret Key

3. **Set URLs in Plisio Dashboard**
   - **Status URL** (Webhook): Set to `{BACKEND_URL}/payments/webhook`
     - Example: `https://yourdomain.com/api/payments/webhook`
     - This is where Plisio sends payment status updates
   - **Success URL**: Set to your frontend success page
     - Example: `https://yourdomain.com/payment-success`
     - Users are redirected here after successful payment
   - **Failed URL**: Set to your frontend failure page
     - Example: `https://yourdomain.com/payment-failed`
     - Users are redirected here after failed payment
   
   **Note:** You can also set these URLs via environment variables (PLISIO_STATUS_URL, PLISIO_SUCCESS_URL, PLISIO_FAIL_URL) and they will override the dashboard settings.

## Features Implemented

### Backend
- ✅ Plisio service with API integration
- ✅ Payment creation endpoint
- ✅ Payment status checking
- ✅ Webhook handler for payment confirmations
- ✅ Automatic balance updates on successful payment
- ✅ Payment history tracking

### Frontend
- ✅ Payment invoice creation form
- ✅ Payment status display
- ✅ Payment address and QR code display
- ✅ Automatic payment status checking
- ✅ Copy to clipboard functionality

## API Endpoints

### Create Payment
```
POST /payments
Authorization: Bearer {token}
Body: {
  "amount": 100.00,
  "currency": "USD",
  "paymentMethod": "plisio"
}
```

### Get Payment Status
```
GET /payments/:paymentId
Authorization: Bearer {token}
```

### Get User Payments
```
GET /payments
Authorization: Bearer {token}
```

### Webhook (Plisio → Backend)
```
POST /payments/webhook
Body: {webhook data from Plisio}
```

## Payment Flow

1. User enters amount on Funds page
2. Frontend calls `POST /payments` with amount
3. Backend creates Plisio payment invoice
4. Backend returns payment URL, address, and details
5. User completes payment via Plisio
6. Plisio sends webhook to backend
7. Backend verifies webhook signature
8. Backend updates payment status and user balance
9. Frontend polls payment status or receives update

## Supported Cryptocurrencies

Plisio supports 15+ cryptocurrencies including:
- Bitcoin (BTC)
- Ethereum (ETH)
- Litecoin (LTC)
- USDT
- And many more

## Testing

1. Use Plisio test mode (if available) for development
2. Test with small amounts first
3. Verify webhook is receiving requests (check server logs)
4. Test payment expiration handling
5. Test failed payment scenarios

## Security Notes

- Never commit `.env` file with real credentials
- Keep Secret Key secure
- Webhook signature verification is implemented
- Use HTTPS in production for webhook endpoint

## Troubleshooting

### Payment not creating
- Check Plisio secret key in `.env`
- Verify merchant account is active
- Check backend logs for API errors

### Webhook not working
- Verify webhook URL in Plisio dashboard
- Check backend is accessible from internet (use ngrok for local testing)
- Verify webhook signature verification

### Payment status not updating
- Check webhook is being received
- Verify signature verification is working
- Check payment status polling on frontend

## Support

For Plisio API issues, refer to:
- Plisio Website: https://plisio.net/
- Plisio API Documentation: Check their dashboard for API docs
- Plisio Support: Contact through their dashboard

