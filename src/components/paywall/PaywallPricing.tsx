"use client";

import { useState, useEffect } from "react";
import { CreditCard } from "lucide-react";

interface PaywallPricingProps {
  onUnlock: () => void;
  isUnlocking: boolean;
}

export default function PaywallPricing({ onUnlock, isUnlocking }: PaywallPricingProps) {
  const [timeLeft, setTimeLeft] = useState({ minutes: 4, seconds: 49 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
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

  const formatTime = (num: number) => num.toString().padStart(2, '0');

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

      {/* Payment Buttons */}
      <div className="space-y-3">
        {/* Apple Pay Button */}
        <button
          onClick={onUnlock}
          disabled={isUnlocking}
          className={`w-full py-4 rounded-lg font-semibold text-white transition-all duration-200 ${
            isUnlocking
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-black hover:bg-gray-800'
          }`}
        >
          {isUnlocking ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Processing...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <span>Buy with</span>
              <span className="font-bold">🍎 Pay</span>
            </div>
          )}
        </button>

        {/* Card Payment Button */}
        <button
          onClick={onUnlock}
          disabled={isUnlocking}
          className={`w-full py-4 rounded-lg font-semibold text-white transition-all duration-200 flex items-center justify-center space-x-2 ${
            isUnlocking
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-orange-500 hover:bg-orange-600'
          }`}
        >
          <CreditCard className="w-5 h-5" />
          <span>Pay Securely with Card</span>
          <span className="text-lg">›</span>
        </button>
      </div>
    </div>
  );
}