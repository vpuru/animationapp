import React from 'react';
import Image from 'next/image';

interface MyPicturesProps {
  images?: string[];
}

export default function MyPictures({ 
  images = [
    "/photos/ChatGPT Image Aug 20, 2025, 10_34_17 AM.png",
    "/photos/ChatGPT Image Aug 20, 2025, 10_34_19 AM.png",
    "/photos/ChatGPT Image Aug 20, 2025, 10_34_20 AM.png"
  ]
}: MyPicturesProps) {
  return (
    <div className="inline-flex items-center gap-3 px-4 py-3 bg-white rounded-full shadow-sm border border-gray-200">
      {/* Back Arrow */}
      <div className="text-gray-600">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      
      {/* Title */}
      <span className="text-gray-800 font-medium text-base">
        My Pictures
      </span>
      
      {/* Image Bubbles */}
      <div className="flex -space-x-2">
        {images.slice(0, 3).map((image, index) => (
          <div key={index} className="relative">
            <div className="w-8 h-8 rounded-lg overflow-hidden border-2 border-white shadow-sm">
              <Image
                src={image}
                alt={`Picture ${index + 1}`}
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ))}
        
        {/* Counter bubble */}
        <div className="w-8 h-8 rounded-lg bg-pink-400 border-2 border-white shadow-sm flex items-center justify-center">
          <span className="text-white text-xs font-semibold">9</span>
        </div>
      </div>
    </div>
  );
}