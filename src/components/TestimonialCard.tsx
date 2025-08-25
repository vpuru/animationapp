import React from "react";
import Image from "next/image";
import StarIcon from "@/components/ui/star-icon";

export interface TestimonialCardProps {
  testimonial?: string;
  userName?: string;
  userImage?: string;
  rating?: number;
}

export default function TestimonialCard({
  testimonial = "I was pretty skeptical, but this sticker turned out super cute! I use it as my FaceBook profile pic and friends keep asking where I made",
  userName = "Maria C.",
  userImage = "asset_images/chatgpt-image-1.png",
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
          <p className="text-gray-800 text-md leading-relaxed">&ldquo;{testimonial}&rdquo;</p>
        </div>
      </div>
    </div>
  );
}
