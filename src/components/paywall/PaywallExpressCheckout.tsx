"use client";

import { useState } from "react";
import { Elements, ExpressCheckoutElement } from "@stripe/react-stripe-js";
import { loadStripe, StripeExpressCheckoutElementReadyEvent } from "@stripe/stripe-js";
import { useAuth } from "@/hooks/useAuth";
import { trackEvent } from "@/lib/analytics";
import { useStripe, useElements } from "@stripe/react-stripe-js";

// Load Stripe outside component to avoid recreating on every render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaywallExpressCheckoutProps {
  uuid: string;
}

interface ExpressCheckoutFormProps {
  uuid: string;
}

function ExpressCheckoutForm({ uuid }: ExpressCheckoutFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasExpressPaymentMethods, setHasExpressPaymentMethods] = useState<boolean | null>(null);
  const { getCurrentUserId } = useAuth();
  const stripe = useStripe();
  const elements = useElements();

  const handleExpressCheckout = async () => {
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Track Express Checkout initiation
      trackEvent.paymentInitiated({
        amount: 299, // $2.99 in cents
        currency: 'USD',
        uuid: uuid
      });

      // Submit the form data first
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message || 'Failed to submit payment data');
      }

      // Get current user ID
      const userId = await getCurrentUserId();

      // Create payment intent when Express Checkout is triggered
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uuid: uuid,
          userId: userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create payment intent');
      }

      const { clientSecret } = await response.json();

      // Complete the payment with the payment intent
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret: clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/download/${uuid}`,
        },
      });

      if (confirmError) {
        // Track payment error
        trackEvent.paymentError(confirmError.message || 'Express checkout failed', uuid);
        throw new Error(confirmError.message || 'Payment failed');
      }

      // Track successful Express Checkout
      trackEvent.paymentSuccess({
        amount: 299,
        currency: 'USD',
        paymentMethod: 'express_checkout',
        uuid: uuid
      });

      // Payment succeeded, verify on server side
      // Note: For Express Checkout, we rely on webhooks for final verification
      // The return_url will handle the redirect after successful payment

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Express checkout failed';
      
      // Track error
      trackEvent.paymentError(errorMessage, uuid);
      
      setError(errorMessage);
      console.error('Express checkout error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExpressCheckoutCancel = () => {
    setIsProcessing(false);
    setError(null);
    
    // Track cancellation
    trackEvent.featureUsed('Express Checkout Cancelled', { uuid });
  };

  const handleExpressCheckoutReady = (event: StripeExpressCheckoutElementReadyEvent) => {
    // Check if any express payment methods are available
    const hasPaymentMethods = Boolean(event.availablePaymentMethods && Object.keys(event.availablePaymentMethods).length > 0);
    
    setHasExpressPaymentMethods(hasPaymentMethods);
    
    if (hasPaymentMethods) {
      // Track that Express Checkout is available
      trackEvent.featureUsed('Express Checkout Available', { 
        uuid,
        paymentMethods: Object.keys(event.availablePaymentMethods || {}).join(',') || 'unknown'
      });
    } else {
      // Track that Express Checkout is not available
      trackEvent.featureUsed('Express Checkout Not Available', { uuid });
    }
  };

  return (
    <>
      {/* Only render if we have confirmed express payment methods are available */}
      {hasExpressPaymentMethods === true && (
        <div className="mb-4">
          {/* Express Checkout Element */}
          <div className="express-checkout-container">
            <ExpressCheckoutElement
              onConfirm={handleExpressCheckout}
              onCancel={handleExpressCheckoutCancel}
              onReady={handleExpressCheckoutReady}
              options={{
                paymentMethods: {
                  applePay: 'always',
                  googlePay: 'always',
                  link: 'never', // Disable Stripe Link for cleaner UI
                  amazonPay: 'never', // Disable Amazon Pay
                },
                layout: {
                  maxColumns: 1,
                  maxRows: 1,
                },
                buttonTheme: {
                  applePay: 'black',
                  googlePay: 'black',
                },
                buttonType: {
                  applePay: 'buy',
                  googlePay: 'buy',
                },
                buttonHeight: 48,
              }}
            />
          </div>
        </div>
      )}
      
      {/* Hidden element to check for payment method availability */}
      {hasExpressPaymentMethods === null && (
        <div style={{ 
          position: 'absolute',
          top: '-9999px',
          left: '-9999px',
          width: '1px',
          height: '1px',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: -1
        }}>
          <ExpressCheckoutElement
            onConfirm={handleExpressCheckout}
            onReady={handleExpressCheckoutReady}
            options={{
              paymentMethods: {
                applePay: 'always',
                googlePay: 'always',
                link: 'never',
                amazonPay: 'never',
              },
            }}
          />
        </div>
      )}

      {/* Processing State */}
      {isProcessing && (
        <div className="flex items-center justify-center py-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500 mr-2"></div>
          <span className="text-sm text-gray-600">Processing payment...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm text-center">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 text-xs underline mt-1 block mx-auto"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Styling for Express Checkout Element */}
      <style jsx>{`        
        /* Ensure proper styling of Stripe elements */
        .express-checkout-container :global(.StripeElement) {
          border-radius: 8px;
        }
      `}</style>
    </>
  );
}

export default function PaywallExpressCheckout({ uuid }: PaywallExpressCheckoutProps) {
  return (
    <Elements 
      stripe={stripePromise}
      options={{
        mode: 'payment',
        currency: 'usd',
        amount: 299, // $2.99 in cents
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#f97316', // Orange-500 to match your app theme
          },
        },
      }}
    >
      <ExpressCheckoutForm uuid={uuid} />
    </Elements>
  );
}