'use client'

import { useEffect, useState } from "react";
import testimonialsData from "@/data/testimonials.json";

const gimmickyMessages = [
  "🎨 Animating your picture...",
  "✨ Perfecting the lines on your drawing...",
  "🖌️ Adding magical touches...", 
  "🎭 Enhancing facial expressions...",
  "🌟 Applying artistic filters...",
  "🎪 Creating visual magic...",
  "🖼️ Optimizing image quality...",
  "🎨 Fine-tuning artistic details...",
  "✨ Polishing final touches...",
  "🎭 Bringing your image to life..."
];

// Combine gimmicky messages with testimonials
const allMessages = [
  ...gimmickyMessages.map(msg => ({ type: 'gimmicky', content: msg })),
  ...testimonialsData.map(testimonial => ({
    type: 'testimonial',
    content: `"${testimonial.testimonial}" - ${testimonial.userName}`
  }))
];

export default function CyclingText() {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [fadeClass, setFadeClass] = useState("opacity-100");

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeClass("opacity-0");
      
      setTimeout(() => {
        setCurrentMessageIndex((prevIndex) => 
          prevIndex === allMessages.length - 1 ? 0 : prevIndex + 1
        );
        setFadeClass("opacity-100");
      }, 300); // Quick fade out, then fade in
      
    }, 3500); // Change text every 3.5 seconds

    return () => clearInterval(interval);
  }, []);

  const currentMessage = allMessages[currentMessageIndex];
  const isTestimonial = currentMessage.type === 'testimonial';

  return (
    <div className="w-full max-w-lg mx-auto text-center min-h-[100px] flex items-center justify-center">
      <div className={`transition-opacity duration-300 ${fadeClass}`}>
        {isTestimonial ? (
          <blockquote className="text-gray-600 text-sm md:text-base italic leading-relaxed px-4">
            {currentMessage.content}
          </blockquote>
        ) : (
          <p className="text-blue-600 text-lg md:text-xl font-medium">
            {currentMessage.content}
          </p>
        )}
      </div>
    </div>
  );
}