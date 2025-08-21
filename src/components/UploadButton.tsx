'use client'

import React from "react";
import { useRouter } from "next/navigation";

export default function UploadButton() {
  const router = useRouter();

  const handleClick = () => {
    router.push('/loading');
  };

  return (
    <button 
      onClick={handleClick}
      className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-all duration-200 shadow-lg active:scale-95"
    >
      Click here to upload!
    </button>
  );
}
