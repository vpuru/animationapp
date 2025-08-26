import { NextRequest, NextResponse } from 'next/server';
import { getStripe, getAnimationImagePrice } from '@/services/stripe';
import { validateImageForPayment, createPaymentIntent } from '@/services/supabase';

export async function POST(request: NextRequest) {
  try {
    const { uuid, userId } = await request.json();

    if (!uuid) {
      return NextResponse.json(
        { error: { message: 'Image UUID is required' } },
        { status: 400 }
      );
    }

    // Validate image exists and is ready for purchase
    const imageState = await validateImageForPayment(uuid);

    // Get current price from Stripe
    const price = await getAnimationImagePrice();

    const stripe = getStripe();

    // Check if there's already a pending payment intent
    if (imageState.payment_intent_id && imageState.payment_status === 'pending') {
      try {
        // TypeScript now knows payment_intent_id is not null due to the guard clause above
        const existingPaymentIntent = await stripe.paymentIntents.retrieve(imageState.payment_intent_id);
        if (existingPaymentIntent.status === 'requires_payment_method') {
          return NextResponse.json({
            clientSecret: existingPaymentIntent.client_secret,
          });
        }
      } catch (error) {
        console.warn('Existing payment intent not found or invalid:', error);
      }
    }

    // Create new payment intent using price from Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: price.unit_amount!,
      currency: price.currency,
      payment_method_types: ['card'],
      metadata: {
        uuid: uuid,
        userId: userId || 'anonymous',
        productType: 'animation_image',
        price_id: price.id,
        product_id: price.product as string,
      },
    });

    // Update image state with payment intent
    await createPaymentIntent(uuid, paymentIntent.id, price.unit_amount!);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });

  } catch (error: unknown) {
    console.error('Error creating payment intent:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unable to create payment intent';
    return NextResponse.json(
      { error: { message: errorMessage } },
      { status: 400 }
    );
  }
}