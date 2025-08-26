# Stripe Integration Setup Instructions

This document provides step-by-step instructions to complete the Stripe payment integration for your AI Animation Image application.

## 1. Database Migration

First, run the SQL migration to add payment tracking fields:

1. Open your Supabase Dashboard
2. Navigate to SQL Editor
3. Run the migration script from `/migrations/add_payment_tracking_fields.sql`:

```sql
-- Add payment tracking fields to images_state table
ALTER TABLE images_state 
ADD COLUMN payment_intent_id TEXT,
ADD COLUMN payment_status TEXT DEFAULT 'pending',
ADD COLUMN payment_amount INTEGER,
ADD COLUMN purchased_at TIMESTAMPTZ;

-- Add index on payment_intent_id for faster lookups
CREATE INDEX idx_images_state_payment_intent_id ON images_state(payment_intent_id);

-- Add index on payment_status for filtering
CREATE INDEX idx_images_state_payment_status ON images_state(payment_status);
```

## 2. Create Stripe Product and Price

1. **Login to Stripe Dashboard**: Go to [dashboard.stripe.com](https://dashboard.stripe.com)

2. **Create a Product**:
   - Navigate to **Products** in your Stripe Dashboard
   - Click **"Add product"**
   - Fill in product details:
     - Name: "AI Animation Image"
     - Description: "Professional AI-generated animation images"
   - Configure the price:
     - Type: "One time"
     - Amount: $2.99
     - Currency: USD
   - Click **"Save product"**

3. **Copy the Price ID**:
   - After creating the product, you'll see a Price ID (format: `price_xxxxxxxxxxxxx`)
   - Copy this Price ID for the next step

## 3. Configure Environment Variables

Update your `.env` file with the following values:

```bash
# Replace with your actual Stripe Price ID from step 2
STRIPE_ANIMATION_IMAGE_SINGLE_PRICE_ID=price_your_actual_price_id_here

# Replace with your actual webhook secret from step 4
STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret_here
```

## 4. Set Up Stripe Webhooks

1. **Create Webhook Endpoint**:
   - In Stripe Dashboard, go to **Developers** → **Webhooks**
   - Click **"Add endpoint"**
   - Endpoint URL: `https://your-domain.com/api/webhooks/stripe`
   - Select events to send:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
   - Click **"Add endpoint"**

2. **Get Webhook Secret**:
   - Click on your newly created webhook
   - In the "Signing secret" section, click **"Reveal"**
   - Copy the webhook secret (starts with `whsec_`)
   - Add it to your `.env` file as `STRIPE_WEBHOOK_SECRET`

## 5. Test the Integration

### Test in Development Mode

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Use Stripe Test Cards**:
   - **Successful payment**: `4242 4242 4242 4242`
   - **Payment requires authentication**: `4000 0025 0000 3155`
   - **Payment is declined**: `4000 0000 0000 0002`
   - Use any future expiry date, any CVC, and any postal code

3. **Test the complete flow**:
   - Upload an image
   - Wait for processing to complete
   - Navigate to the paywall page
   - Click "Pay Securely with Card"
   - Enter test card details
   - Verify successful payment and redirect to download page

### Test Webhooks Locally

1. **Install Stripe CLI** (if not already installed):
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Or download from https://github.com/stripe/stripe-cli/releases
   ```

2. **Login to Stripe CLI**:
   ```bash
   stripe login
   ```

3. **Forward webhooks to your local server**:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. **Copy the webhook signing secret** displayed in the terminal and update your `.env` file

## 6. Production Deployment Checklist

Before deploying to production:

### Environment Variables
- [ ] Update `STRIPE_ANIMATION_IMAGE_SINGLE_PRICE_ID` with production price ID
- [ ] Update `STRIPE_WEBHOOK_SECRET` with production webhook secret
- [ ] Ensure `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` uses live keys (starts with `pk_live_`)
- [ ] Ensure `NEXT_PUBLIC_STRIPE_SECRET_KEY` uses live keys (starts with `sk_live_`)

### Stripe Dashboard Configuration
- [ ] Create production product and price
- [ ] Set up production webhook endpoint with your live domain
- [ ] Test with real payment methods (small amounts)
- [ ] Configure Stripe account settings (business details, bank account, etc.)

### Security Considerations
- [ ] Webhook endpoint is using HTTPS
- [ ] All environment variables are properly secured
- [ ] Test webhook signature verification
- [ ] Monitor Stripe Dashboard for any errors or failed payments

## 7. Monitoring and Maintenance

### Regular Checks
- Monitor Stripe Dashboard for failed payments
- Check webhook delivery status in Stripe Dashboard
- Monitor application logs for payment-related errors
- Review successful payment notifications

### Error Handling
- Failed payments are logged in Stripe Dashboard
- Webhook failures are retried automatically by Stripe
- Application errors are logged to console (configure proper logging in production)

## 8. Common Issues and Solutions

### Payment Intent Creation Fails
- **Issue**: "Price not found" error
- **Solution**: Verify `STRIPE_ANIMATION_IMAGE_SINGLE_PRICE_ID` is correct and active

### Webhooks Not Working
- **Issue**: Payments succeed but images aren't unlocked
- **Solution**: Check webhook endpoint URL and signing secret

### Payment Form Not Loading
- **Issue**: Stripe Elements not appearing
- **Solution**: Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is correct

### Database Errors
- **Issue**: Payment tracking fields not found
- **Solution**: Ensure database migration was run successfully

## 9. Support and Resources

- **Stripe Documentation**: [docs.stripe.com](https://docs.stripe.com)
- **Stripe Test Cards**: [stripe.com/docs/testing](https://stripe.com/docs/testing)
- **Stripe Webhooks Guide**: [stripe.com/docs/webhooks](https://stripe.com/docs/webhooks)
- **Stripe Dashboard**: [dashboard.stripe.com](https://dashboard.stripe.com)

## Next Steps

After completing this setup:
1. Test the complete payment flow thoroughly
2. Monitor the first few real transactions closely
3. Consider adding additional payment methods (Apple Pay, Google Pay) in the future
4. Set up automated monitoring and alerting for payment failures

Your Stripe integration is now complete and ready for production use!