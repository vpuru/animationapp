import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getStripe } from '@/services/stripe';
import { verifyPaymentAndUnlock } from '@/services/supabase';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;
  const stripe = getStripe();

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Signature verification failed';
    console.error('Webhook signature verification failed:', errorMessage);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handleSuccessfulPayment(paymentIntent);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        await handleFailedPayment(failedPayment);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleSuccessfulPayment(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment succeeded: ${paymentIntent.id}`);
  
  const uuid = paymentIntent.metadata?.uuid;
  if (!uuid) {
    console.error('Payment intent missing UUID metadata');
    return;
  }

  try {
    // Unlock the image
    await verifyPaymentAndUnlock(uuid, paymentIntent.id);
    console.log(`Successfully unlocked image ${uuid} for payment ${paymentIntent.id}`);
  } catch (error) {
    console.error('Failed to unlock image after successful payment:', error);
  }
}

async function handleFailedPayment(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment failed: ${paymentIntent.id}`);
  
  // Log the failure for monitoring
  const uuid = paymentIntent.metadata?.uuid;
  if (uuid) {
    console.log(`Payment failed for image ${uuid}: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`);
  }
}