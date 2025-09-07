"use client";

import InfiniteSlider from "@/components/InfiniteSlider";
import UploadButton from "@/components/UploadButton";
import MyPictures from "@/components/MyPictures";
import StatsCard from "@/components/StatsCard";
import TestimonialCard, { TestimonialCardProps } from "@/components/TestimonialCard";
import testimonialsData from "@/data/testimonials.json";
import { useAuth } from "@/hooks/useAuth";
import { getStoredImageCount } from "@/lib/cookieUtils";
import { useEffect, useState } from "react";

export default function Home() {
  const { loading, isAuthenticated, signInWithGoogle } = useAuth();
  const [hasCookieImages, setHasCookieImages] = useState(false);

  useEffect(() => {
    // Check if user has any cookie-stored images
    const cookieImageCount = getStoredImageCount();
    setHasCookieImages(cookieImageCount > 0);
  }, []);

  const mockHeadshots = [
    "asset_images/chatgpt-image-1.png",
    "asset_images/chatgpt-image-2.png",
    "asset_images/chatgpt-image-3.png",
    "asset_images/chatgpt-image-4.png",
  ];

  return (
    <div className="text-gray-900 overflow-x-hidden">
      <div className="container mx-auto px-4 pt-8 pb-8 flex flex-col items-center">
        <div className="mb-4">
          {loading ? (
            // Loading skeleton
            <div className="w-64 h-12 bg-gray-200 animate-pulse rounded-full"></div>
          ) : isAuthenticated || hasCookieImages ? (
            // Show MyPictures for authenticated users OR users with cookie images
            <MyPictures />
          ) : (
            // Only show StatsCard when no user session and no cookie images
            <StatsCard />
          )}
        </div>
        <div className="relative mb-8 mt-10">
          <div className="space-y-20 md:space-y-12">
            <InfiniteSlider images={mockHeadshots} speed={30} direction="left" />
            <InfiniteSlider images={mockHeadshots} speed={30} direction="right" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-full px-8 py-4"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 40%, rgba(255, 255, 255, 0.2) 80%, rgba(255, 255, 255, 0) 100%)",
              }}
            >
              <h1 className="text-3xl md:text-5xl font-bold text-gray-900 text-center leading-tight">
                Turn Your Pictures Into
                <br />
                An <span className="text-blue-600">Animation</span>!
              </h1>
            </div>
          </div>
        </div>
        <div className="text-center">
          <UploadButton />
          {!loading && !isAuthenticated && (
            <div className="mt-4">
              <button
                onClick={signInWithGoogle}
                className="text-blue-600 hover:text-blue-800 text-sm underline transition-colors"
              >
                click here to login
              </button>
            </div>
          )}
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {testimonialsData.map((testimonial: TestimonialCardProps, index: number) => (
            <TestimonialCard
              key={index}
              testimonial={testimonial.testimonial}
              userName={testimonial.userName}
              userImage={testimonial.userImage}
              rating={testimonial.rating}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
