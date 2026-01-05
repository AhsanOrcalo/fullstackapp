# NOWPayments Integration Setup and Testing Guide

## Overview
This application now uses NOWPayments (https://nowpayments.io/) as the payment gateway for cryptocurrency payments. When users make payments, the funds are automatically added to their account balance upon successful payment confirmation.

## Setup Instructions

### 1. Create NOWPayments Account
1. Go to https://nowpayments.io/
2. Sign up for an account
3. Complete KYC/verification process
4. Get your API credentials from the dashboard

### 2. Environment Variables
Add the following environment variables to your `.env` file:

```env
# NOWPayments Configuration
NOWPAYMENTS_API_KEY=your_api_key_here
NOWPAYMENTS_IPN_SECRET_KEY=your_ipn_secret_key_here

# Backend URL (for webhook callbacks)
BACKEND_URL=https://your-domain.com
# or for local development:
# BACKEND_URL=http://localhost:8000

# Frontend URL (for success/failure redirects)
FRONTEND_URL=https://your-domain.com
# or for local development:
# FRONTEND_URL=http://localhost:3001
```

### 3. Configure Webhook (IPN) in NOWPayments Dashboard
1. Log in to your NOWPayments dashboard
2. Go to Settings → IPN (Instant Payment Notification)
3. Set the IPN URL to: `https://your-domain.com/payments/webhook`
   - For local testing, use a service like ngrok: `https://your-ngrok-url.ngrok.io/payments/webhook`
4. Save your IPN Secret Key (this is what you'll use for `NOWPAYMENTS_IPN_SECRET_KEY`)

## How It Works

### Payment Flow
1. **User Initiates Payment**: User enters an amount on the Funds page and clicks "Add Funds"
2. **Payment Creation**: Backend creates a payment record and calls NOWPayments API to create an invoice
3. **Payment URL**: User is redirected to NOWPayments payment page with a unique payment ID
4. **User Pays**: User completes payment using their cryptocurrency wallet
5. **Webhook Notification**: NOWPayments sends an IPN (webhook) to your backend when payment status changes
6. **Funds Added**: Backend verifies the webhook signature, updates payment status, and adds funds to user's balance

### Webhook Processing
- **Status: `finished` or `confirmed`**: Payment successful → Funds added to user balance
- **Status: `failed` or `refunded`**: Payment failed → Payment marked as failed
- **Status: `expired`**: Payment expired → Payment marked as expired
- **Other statuses**: Payment still processing → Status remains as processing

## Testing Instructions

### Prerequisites
1. Ensure all environment variables are set correctly
2. Backend server is running
3. Frontend is running
4. NOWPayments account is set up and verified

### Test Scenario 1: Add Funds via NOWPayments

#### Steps:
1. **Login as a user** (not admin)
2. **Navigate to Funds page**
3. **Enter an amount** (minimum $10.00)
4. **Click "Add Funds"**
5. **Verify Payment Creation**:
   - You should see a payment invoice with:
     - Payment address (crypto address to send funds to)
     - Payment URL (link to NOWPayments payment page)
     - Currency information
     - Expiration time
6. **Click the payment URL** or copy the address
7. **Complete Payment** (in NOWPayments test/sandbox mode):
   - Use test cryptocurrency if available
   - Or use NOWPayments test payment simulator
8. **Wait for Webhook**:
   - NOWPayments will send a webhook to your backend
   - Check backend logs for webhook processing
9. **Verify Funds Added**:
   - Refresh the Funds page
   - Check that:
     - Current Balance has increased by the payment amount
     - Total Deposits has increased
     - Payment status shows as "Paid"

### Test Scenario 2: Webhook Verification

#### Manual Webhook Testing:
You can test the webhook endpoint manually using a tool like Postman or curl:

```bash
curl -X POST https://your-domain.com/payments/webhook \
  -H "Content-Type: application/json" \
  -H "x-nowpayments-sig: your_signature_here" \
  -d '{
    "payment_id": 123456,
    "order_id": "payment_id_from_database",
    "payment_status": "finished",
    "price_amount": 100.00,
    "price_currency": "USD",
    "pay_amount": 0.001,
    "pay_currency": "BTC",
    "pay_address": "bc1q...",
    "purchase_id": "purchase_123"
  }'
```

**Note**: The signature must be calculated correctly using HMAC SHA512 with your IPN secret key.

### Test Scenario 3: Payment Status Check

#### Steps:
1. Create a payment (as in Test Scenario 1)
2. **Don't complete the payment** (leave it in processing state)
3. **Check Payment Status**:
   - The frontend polls the payment status every 10 seconds
   - Or manually call: `GET /payments/:paymentId`
4. **Verify Status Updates**:
   - Status should update automatically when payment is completed
   - Or when webhook is received

### Test Scenario 4: Failed Payment

#### Steps:
1. Create a payment
2. **Let it expire** (don't pay within the time limit)
3. **Verify**:
   - Payment status changes to "Expired"
   - Funds are NOT added to balance
   - Payment shows in payment history as expired

## Troubleshooting

### Issue: Payment created but webhook not received
**Solutions**:
1. Check that webhook URL is correctly configured in NOWPayments dashboard
2. Verify `BACKEND_URL` environment variable is correct
3. For local testing, use ngrok to expose your local server
4. Check backend logs for webhook attempts
5. Verify IPN secret key matches in both places

### Issue: Webhook signature verification fails
**Solutions**:
1. Ensure `NOWPAYMENTS_IPN_SECRET_KEY` matches the one in NOWPayments dashboard
2. Check that the signature header is `x-nowpayments-sig`
3. Verify the webhook data structure matches expected format

### Issue: Funds not added after payment
**Solutions**:
1. Check webhook was received (check backend logs)
2. Verify payment status in database is "paid"
3. Check user balance was updated
4. Verify webhook processing didn't throw errors
5. Check that payment status is `finished` or `confirmed` (not just `waiting`)

### Issue: Payment URL not working
**Solutions**:
1. Check NOWPayments API response includes payment URL
2. Verify payment was created successfully in NOWPayments
3. Check payment ID is valid
4. Try accessing payment directly via NOWPayments dashboard

## API Endpoints

### Create Payment
```
POST /payments
Headers: Authorization: Bearer <token>
Body: {
  "amount": 100.00,
  "currency": "USD",
  "paymentMethod": "nowpayments"
}
```

### Get Payment Status
```
GET /payments/:paymentId
Headers: Authorization: Bearer <token>
```

### Webhook Endpoint (NOWPayments calls this)
```
POST /payments/webhook
Headers: x-nowpayments-sig: <signature>
Body: <webhook data from NOWPayments>
```

## Database Schema

### Payment Document Fields (NOWPayments)
- `nowpaymentsPaymentId`: Payment ID from NOWPayments
- `nowpaymentsPayAddress`: Crypto address to send payment to
- `nowpaymentsPayCurrency`: Cryptocurrency to pay with
- `nowpaymentsPriceCurrency`: Fiat currency (USD)
- `nowpaymentsPaymentUrl`: URL to complete payment
- `nowpaymentsOrderId`: Your order ID
- `nowpaymentsOrderDescription`: Description (e.g., "Account top-up")
- `nowpaymentsExpiredAt`: Payment expiration date
- `nowpaymentsResponse`: Full response from NOWPayments API

## Security Notes

1. **Webhook Signature Verification**: Always verify webhook signatures to prevent fraud
2. **HTTPS Required**: Webhooks must use HTTPS in production
3. **IPN Secret Key**: Keep your IPN secret key secure and never expose it
4. **API Key Security**: Store API keys in environment variables, never in code

## Support

- NOWPayments Documentation: https://documenter.getpostman.com/view/7907941/T1LJjU52
- NOWPayments Support: Contact through their dashboard
- Check backend logs for detailed error messages

## Migration Notes

- Old Cryptomus and Plisio payment records will remain in the database but won't be processed
- New payments will only use NOWPayments
- User balance calculation includes all payment methods (backward compatible)

