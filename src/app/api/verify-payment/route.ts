import { NextRequest, NextResponse } from 'next/server';
import { getStripe, getAnimationImagePrice } from '@/services/stripe';
import { verifyPaymentAndUnlock } from '@/services/supabase';

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId, uuid } = await request.json();

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: { message: 'Payment intent ID is required' } },
        { status: 400 }
      );
    }

    if (!uuid) {
      return NextResponse.json(
        { error: { message: 'Image UUID is required' } },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: { message: `Payment status: ${paymentIntent.status}` } },
        { status: 400 }
      );
    }

    // Get current price to validate amount
    const currentPrice = await getAnimationImagePrice();
    
    // Verify payment amount matches current price
    if (paymentIntent.amount !== currentPrice.unit_amount!) {
      return NextResponse.json(
        { error: { message: 'Payment amount mismatch' } },
        { status: 400 }
      );
    }

    // Verify payment metadata matches the image
    if (paymentIntent.metadata?.uuid !== uuid) {
      return NextResponse.json(
        { error: { message: 'Payment does not match this image' } },
        { status: 400 }
      );
    }

    // Update database and unlock image
    const imageState = await verifyPaymentAndUnlock(uuid, paymentIntentId);

    return NextResponse.json({
      success: true,
      message: 'Payment verified and image unlocked',
      imageState,
    });

  } catch (error: unknown) {
    console.error('Error verifying payment:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Payment verification failed';
    return NextResponse.json(
      { error: { message: errorMessage } },
      { status: 400 }
    );
  }
}