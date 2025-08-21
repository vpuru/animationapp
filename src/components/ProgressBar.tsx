'use client'

import { useEffect, useState } from "react";

export default function ProgressBar() {
  const [progress, setProgress] = useState(0);
  const totalDuration = 60000; // 60 seconds in milliseconds
  const updateInterval = 100; // Update every 100ms for smooth animation
  const increment = 100 / (totalDuration / updateInterval); // Calculate increment per update

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(interval);
          return 100;
        }
        return Math.min(prevProgress + increment, 100);
      });
    }, updateInterval);

    return () => clearInterval(interval);
  }, [increment]);

  return (
    <div className="w-full max-w-md mx-auto space-y-3">
      {/* Progress bar container */}
      <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
        {/* Progress fill */}
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-100 ease-linear rounded-full relative overflow-hidden"
          style={{ width: `${progress}%` }}
        >
          {/* Animated shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine" />
        </div>
      </div>
      
      {/* Percentage text */}
      <div className="text-center">
        <span className="text-lg font-semibold text-gray-700">
          {Math.round(progress)}%
        </span>
        <p className="text-sm text-gray-500 mt-1">
          Creating your perfect headshot...
        </p>
      </div>
    </div>
  );
}