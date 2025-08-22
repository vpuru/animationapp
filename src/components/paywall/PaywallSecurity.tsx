import { Shield, Lock } from "lucide-react";

export default function PaywallSecurity() {
  return (
    <div className="flex items-center justify-center space-x-6 text-sm text-gray-600 mt-6">
      <div className="flex items-center space-x-1">
        <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
          <div className="w-2 h-2 text-white">✓</div>
        </div>
        <span>Protected by Stripe</span>
      </div>
      
      <div className="flex items-center space-x-1">
        <Lock className="w-4 h-4" />
        <span>256-bit SSL</span>
      </div>
    </div>
  );
}