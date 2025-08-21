'use client'

import Image from "next/image";
import { useEffect, useState } from "react";

const images = [
  "/photos/ChatGPT Image Aug 20, 2025, 10_34_17 AM.png",
  "/photos/ChatGPT Image Aug 20, 2025, 10_34_19 AM.png", 
  "/photos/ChatGPT Image Aug 20, 2025, 10_34_20 AM.png",
  "/photos/ChatGPT Image Aug 20, 2025, 10_34_21 AM.png",
];

export default function FadingImages() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fadeClass, setFadeClass] = useState("opacity-100");

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeClass("opacity-0");
      
      setTimeout(() => {
        setCurrentImageIndex((prevIndex) => 
          prevIndex === images.length - 1 ? 0 : prevIndex + 1
        );
        setFadeClass("opacity-100");
      }, 500); // Half second fade out, then fade in
      
    }, 4000); // Change image every 4 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-2xl overflow-hidden shadow-2xl">
      <Image
        src={images[currentImageIndex]}
        alt={`Headshot preview ${currentImageIndex + 1}`}
        fill
        className={`object-cover transition-opacity duration-500 ${fadeClass}`}
        priority
        sizes="(max-width: 768px) 256px, 320px"
      />
      
      {/* Subtle gradient overlay for better visual appeal */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
    </div>
  );
}