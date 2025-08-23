"use client";

import React, { useState, useEffect } from 'react';

export default function StatsCard() {
  const [count, setCount] = useState(156234);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(prev => prev + Math.floor(Math.random() * 3) + 1);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="inline-flex items-center gap-3 px-4 py-3 bg-blue-50 rounded-full shadow-sm border border-blue-200">
      <span className="text-gray-800 font-medium text-base">
        <span className="text-blue-500 font-bold">{count.toLocaleString()}</span> Animations so far ✨
      </span>
    </div>
  );
}