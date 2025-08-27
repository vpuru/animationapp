"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { StripeProvider, PaymentForm } from "@/components/stripe";
import { trackEvent } from "@/lib/analytics";
import PaywallExpressCheckout from "./PaywallExpressCheckout";

interface PaywallPricingProps {
  uuid: string;
}

export default function PaywallPricing({ uuid }: PaywallPricingProps) {
  const [timeLeft, setTimeLeft] = useState({ minutes: 4, seconds: 49 });
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const { getCurrentUserId } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { minutes, seconds } = prev;

        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        }

        return { minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (num: number) => num.toString().padStart(2, "0");

  const createPaymentIntent = async () => {
    setIsLoading(true);
    setError(null);

    // Track payment initiation
    trackEvent.paymentInitiated({
      amount: 299, // $2.99 in cents
      currency: "USD",
      uuid: uuid,
    });

    try {
      const userId = await getCurrentUserId();

      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uuid: uuid,
          userId: userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to create payment intent");
      }

      const { clientSecret: secret } = await response.json();
      setClientSecret(secret);
      setShowPaymentForm(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to initialize payment";

      // Track payment error
      trackEvent.paymentError(errorMessage, uuid);

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
    setShowPaymentForm(false);
    setClientSecret(null);
  };

  if (showPaymentForm && clientSecret) {
    return (
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <StripeProvider clientSecret={clientSecret}>
          <PaymentForm clientSecret={clientSecret} uuid={uuid} onError={handlePaymentError} />
        </StripeProvider>

        <button
          onClick={() => {
            setShowPaymentForm(false);
            setClientSecret(null);
            setError(null);
          }}
          className="w-full text-gray-500 text-sm hover:text-gray-700 transition-colors"
        >
          ← Back to payment options
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Countdown Timer */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <div className="flex items-center justify-center space-x-2 text-red-600">
          <div className="w-4 h-4 rounded-full border-2 border-red-600 flex items-center justify-center">
            <div className="w-2 h-2 bg-red-600 rounded-full"></div>
          </div>
          <span className="font-semibold">
            Offer ends in {formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
          </span>
        </div>
      </div>

      {/* Pricing */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Regular price</span>
          <span className="text-gray-500 line-through">$5.99</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-gray-800 font-semibold">Special offer</span>
            <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded font-semibold">
              50% OFF
            </span>
          </div>
          <span className="text-2xl font-bold text-gray-800">$2.99</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Express Checkout (Apple Pay, Google Pay) */}
      <PaywallExpressCheckout uuid={uuid} />

      {/* Card Payment Button */}
      <button
        onClick={createPaymentIntent}
        disabled={isLoading}
        className={`w-full py-4 rounded-lg font-semibold text-white transition-all duration-200 flex items-center justify-center space-x-2 ${
          isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600"
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Processing...</span>
          </div>
        ) : (
          <>
            <span>Continue to Payment</span>
            <span className="text-lg">›</span>
          </>
        )}
      </button>
    </div>
  );
}
