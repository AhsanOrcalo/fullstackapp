# Cryptomus Payment Gateway Integration Setup

## Overview
This application uses Cryptomus as the cryptocurrency payment gateway for accepting payments from users.

## Prerequisites
1. Create a Cryptomus account at https://cryptomus.com/
2. Complete merchant registration and KYB (Know Your Business) verification
3. Obtain your Merchant ID and Payment API Key

## Environment Variables

Add the following environment variables to your `.env` file in the `nestjs-add-to-cart-backend` directory:

```env
# Cryptomus Configuration
CRYPTOMUS_MERCHANT_ID=your_merchant_id_here
CRYPTOMUS_PAYMENT_API_KEY=your_payment_api_key_here

# Application URLs (for webhooks and redirects)
FRONTEND_URL=http://localhost:3001
BACKEND_URL=http://localhost:8000
```

## Getting Cryptomus Credentials

1. **Log in to Cryptomus Dashboard**
   - Visit https://cryptomus.com/ and log in

2. **Navigate to Merchant Settings**
   - Go to 'Business' → 'Merchants'
   - Select your merchant account
   - Go to 'Merchant Settings' → 'API Integration'

3. **Copy Credentials**
   - **Merchant ID**: Found in the API Integration section
   - **Payment API Key**: Generate or copy your Payment API Key

4. **Set Webhook URL**
   - In Cryptomus dashboard, set webhook URL to: `{BACKEND_URL}/payments/webhook`
   - Example: `http://localhost:8000/payments/webhook` (for development)
   - For production: `https://yourdomain.com/payments/webhook`

## Features Implemented

### Backend
- ✅ Cryptomus service with API integration
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
  "paymentMethod": "cryptomus"
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

### Webhook (Cryptomus → Backend)
```
POST /payments/webhook
Headers: {
  "sign": "{signature}"
}
Body: {webhook data from Cryptomus}
```

## Payment Flow

1. User enters amount on Funds page
2. Frontend calls `POST /payments` with amount
3. Backend creates Cryptomus payment invoice
4. Backend returns payment URL, address, and details
5. User completes payment via Cryptomus
6. Cryptomus sends webhook to backend
7. Backend verifies webhook signature
8. Backend updates payment status and user balance
9. Frontend polls payment status or receives update

## Testing

1. Use Cryptomus test mode (if available) for development
2. Test with small amounts first
3. Verify webhook is receiving requests (check server logs)
4. Test payment expiration handling
5. Test failed payment scenarios

## Security Notes

- Never commit `.env` file with real credentials
- Keep Payment API Key secure
- Webhook signature verification is mandatory
- Use HTTPS in production for webhook endpoint

## Troubleshooting

### Payment not creating
- Check Cryptomus credentials in `.env`
- Verify merchant account is active
- Check backend logs for API errors

### Webhook not working
- Verify webhook URL in Cryptomus dashboard
- Check backend is accessible from internet (use ngrok for local testing)
- Verify webhook signature verification

### Payment status not updating
- Check webhook is being received
- Verify signature verification is working
- Check payment status polling on frontend

## Support

For Cryptomus API issues, refer to:
- Cryptomus API Documentation: https://doc.cryptomus.com/
- Cryptomus Support: Contact through their dashboard

