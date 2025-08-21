import React from "react";
import Image from "next/image";

export interface TestimonialCardProps {
  testimonial?: string;
  userName?: string;
  userImage?: string;
  rating?: number;
}

const StarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-4 h-4"
  >
    <path
      fillRule="evenodd"
      d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
      clipRule="evenodd"
    />
  </svg>
);

export default function TestimonialCard({
  testimonial = "I was pretty skeptical, but this sticker turned out super cute! I use it as my FaceBook profile pic and friends keep asking where I made",
  userName = "Maria C.",
  userImage = "/photos/ChatGPT Image Aug 20, 2025, 10_34_17 AM.png",
  rating = 5,
}: TestimonialCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg max-w-md mx-auto">
      <div className="flex items-start gap-4">
        {/* User Info Section - Image, Stars, Name */}
        <div className="flex flex-col items-center flex-shrink-0">
          {/* User Image */}
          <div className="w-16 h-16 rounded-xl overflow-hidden mb-2">
            <Image
              src={userImage}
              alt={userName}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Stars */}
          <div className="flex text-yellow-400">
            {Array.from({ length: rating }, (_, index) => (
              <StarIcon key={index} />
            ))}
          </div>

          {/* User Name */}
          <span className="text-gray-600 text-sm font-medium">{userName}</span>
        </div>

        {/* Testimonial Text */}
        <div className="flex-1">
          <p className="text-gray-800 text-md leading-relaxed">"{testimonial}"</p>
        </div>
      </div>
    </div>
  );
}
