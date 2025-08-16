# SKOOT Transportation - Stripe Payment Integration

## Environment Variables Setup

Add the following environment variables to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...  # Your Stripe secret key (test or live)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Your Stripe publishable key (test or live)
STRIPE_WEBHOOK_SECRET=whsec_...  # Webhook signing secret from Stripe dashboard

# Email Configuration (for receipts)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@skoot.bike
```

## Stripe Dashboard Setup

### 1. Create Stripe Account
- Go to [Stripe Dashboard](https://dashboard.stripe.com)
- Create account or sign in
- Switch to test mode for development

### 2. Get API Keys
- Navigate to **Developers** → **API keys**
- Copy **Publishable key** (starts with `pk_test_`)
- Copy **Secret key** (starts with `sk_test_`)

### 3. Setup Webhooks
- Go to **Developers** → **Webhooks**
- Click **Add endpoint**
- Set endpoint URL: `https://your-domain.com/api/stripe/webhook`
- Select events to send:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed` 
  - `payment_intent.canceled`
- Copy the **Signing secret** (starts with `whsec_`)

### 4. Configure Payment Methods
- Go to **Settings** → **Payment methods**
- Enable desired payment methods:
  - Cards (Visa, Mastercard, American Express)
  - Apple Pay (optional)
  - Google Pay (optional)

## Features Implemented

### ✅ Core Payment Processing
- [x] Stripe Elements integration with secure card input
- [x] Payment intent creation and confirmation
- [x] 3D Secure authentication support
- [x] Real-time payment status updates via webhooks

### ✅ Transaction Management
- [x] Secure payment intent generation
- [x] Automatic payment confirmation
- [x] Transaction logging with detailed metadata
- [x] Booking status updates (PENDING → PAID → CONFIRMED)

### ✅ Pricing System
- [x] Dynamic pricing calculator with customer types
- [x] Student and military discounts
- [x] Round trip discounts
- [x] Extra luggage and pet fees
- [x] Promotional code system
- [x] Automatic tax and processing fee calculation

### ✅ Receipt & Email System
- [x] Professional HTML email receipts
- [x] Detailed payment breakdowns
- [x] Booking confirmation emails
- [x] Email delivery tracking and error handling

### ✅ Admin Features
- [x] Refund processing with partial refund support
- [x] Transaction audit logging
- [x] Payment status monitoring
- [x] Seat inventory management

### ✅ Security Features
- [x] Webhook signature verification
- [x] PCI DSS compliance via Stripe Elements
- [x] Secure payment metadata handling
- [x] Input validation and sanitization

## API Endpoints

### Payment Processing
- `POST /api/stripe/create-payment-intent` - Create payment intent
- `POST /api/stripe/webhook` - Handle Stripe webhooks
- `POST /api/stripe/refund` - Process refunds (admin only)

### Pricing
- `POST /api/pricing/calculate` - Calculate trip pricing
- `GET /api/pricing/calculate?routeId=xyz` - Get route pricing info

## Payment Flow

1. **Customer selects trip** → Trip details captured
2. **Customer enters info** → Personal details collected
3. **Payment step loads** → Booking created with PENDING status
4. **Payment intent created** → Stripe payment intent generated
5. **Customer pays** → Stripe Elements processes payment
6. **Webhook confirms** → Payment success triggers status update
7. **Booking confirmed** → Status changes to PAID, seats reserved
8. **Emails sent** → Confirmation and receipt emails dispatched

## Error Handling

### Payment Errors
- Card declined → User-friendly error message with retry option
- Insufficient funds → Clear error with alternative payment suggestion
- Network issues → Automatic retry with progress indication
- 3D Secure failure → Proper authentication flow handling

### System Errors
- Database connection issues → Graceful error handling
- Email delivery failures → Logged with retry mechanism
- Webhook signature failures → Security-focused error logging
- API rate limiting → Proper backoff and retry logic

## Testing

### Test Card Numbers (Stripe Test Mode)
```
Successful payment: 4242424242424242
Declined card: 4000000000000002
Insufficient funds: 4000000000009995
3D Secure required: 4000002760003184
```

### Test Scenarios
1. **Successful payment flow**
2. **Payment failure handling**
3. **Webhook delivery**
4. **Refund processing**
5. **Email delivery**
6. **Pricing calculations**

## Production Deployment

### 1. Switch to Live Mode
- Use live API keys (starts with `sk_live_` and `pk_live_`)
- Update webhook endpoints to production URLs
- Test with real (small amount) transactions

### 2. Security Checklist
- [ ] Webhook endpoints use HTTPS
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] Email credentials protected
- [ ] Admin routes properly secured

### 3. Monitoring
- Set up Stripe Dashboard alerts
- Monitor webhook delivery success
- Track payment success rates
- Monitor email delivery rates

## Support

For payment-related issues:
1. Check Stripe Dashboard for transaction details
2. Review webhook delivery logs
3. Verify email delivery in logs
4. Check database for booking/payment records

## Compliance

This implementation follows:
- PCI DSS compliance standards (via Stripe)
- GDPR data protection requirements
- SOX financial reporting standards
- Industry security best practices