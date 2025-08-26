"use client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { ReactNode } from "react";

// Load Stripe outside component to avoid recreating on every render
const stripePromise = loadStripe(process.env.STRIPE_PUBLISHABLE_KEY!);

interface StripeProviderProps {
  children: ReactNode;
  clientSecret: string;
}

export default function StripeProvider({ children, clientSecret }: StripeProviderProps) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret: clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#f97316", // Orange-500 to match your app theme
            colorBackground: "#ffffff",
            colorText: "#374151", // Gray-700
            colorDanger: "#ef4444", // Red-500
            fontFamily: "system-ui, sans-serif",
            spacingUnit: "4px",
            borderRadius: "8px",
          },
        },
      }}
    >
      {children}
    </Elements>
  );
}
