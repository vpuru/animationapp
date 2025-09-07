"use client";

import { useEffect, useState } from "react";

export default function ProgressBar() {
  const [progress, setProgress] = useState(0);
  const updateInterval = 100; // Update every 100ms

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 99) {
          // Hang at 99%
          return 99;
        } else if (prevProgress < 65) {
          // First 30 seconds: 0% to 65% (65% in 30 seconds = ~0.217% per 100ms)
          return Math.min(prevProgress + 0.217, 65);
        } else {
          // Next 30 seconds: 65% to 99% (34% in 30 seconds = ~0.113% per 100ms)
          return Math.min(prevProgress + 0.113, 99);
        }
      });
    }, updateInterval);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-md mx-auto space-y-3 ">
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
        <span className="text-lg font-semibold text-gray-700">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}
