import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export const getStripe = (): Stripe => {
  if (!_stripe) {
    if (!process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY) {
      throw new Error('NEXT_PUBLIC_STRIPE_SECRET_KEY environment variable is not set');
    }

    _stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY, {
      apiVersion: '2025-07-30.basil',
      maxNetworkRetries: 2,
      timeout: 20000,
    });
  }
  
  return _stripe;
};

export const getAnimationImagePrice = async () => {
  if (!process.env.STRIPE_ANIMATION_IMAGE_SINGLE_PRICE_ID) {
    throw new Error('STRIPE_ANIMATION_IMAGE_SINGLE_PRICE_ID environment variable is not set');
  }

  const stripe = getStripe();
  const price = await stripe.prices.retrieve(process.env.STRIPE_ANIMATION_IMAGE_SINGLE_PRICE_ID);
  
  return price;
};