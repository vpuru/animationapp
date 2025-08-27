'use client';

import React, { useState } from 'react';
import {
  useStripe,
  useElements,
  PaymentElement,
} from '@stripe/react-stripe-js';
import { CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';

interface PaymentFormProps {
  clientSecret: string;
  uuid: string;
  onError: (error: string) => void;
}

export default function PaymentForm({ 
  clientSecret, 
  uuid,
  onError 
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/download/${uuid}`,
        },
        redirect: 'if_required', // Only redirect if 3D Secure is required
      });

      if (error) {
        // Track payment error
        trackEvent.paymentError(error.message || 'An error occurred', uuid);
        onError(error.message || 'An error occurred');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Track payment success
        trackEvent.paymentSuccess({
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          paymentMethod: paymentIntent.payment_method?.type || 'unknown',
          uuid: uuid
        });
        // Verify payment on server side before redirecting
        try {
          const verifyResponse = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paymentIntentId: paymentIntent.id,
              uuid: uuid,
            }),
          });

          if (verifyResponse.ok) {
            // Redirect to download page
            router.push(`/download/${uuid}`);
          } else {
            const errorData = await verifyResponse.json();
            throw new Error(errorData.error?.message || 'Payment verification failed');
          }
        } catch (err: unknown) {
          onError('Payment succeeded but verification failed. Please contact support.');
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement 
        options={{
          layout: 'tabs',
          paymentMethodOrder: ['apple_pay', 'google_pay', 'card'],
        }}
      />
      <button
        disabled={!stripe || !elements || isLoading}
        className={`w-full py-4 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center space-x-2 ${
          isLoading || !stripe
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-orange-500 hover:bg-orange-600'
        }`}
        type="submit"
      >
        {isLoading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Processing...</span>
          </div>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            <span>Complete Payment</span>
          </>
        )}
      </button>
    </form>
  );
}