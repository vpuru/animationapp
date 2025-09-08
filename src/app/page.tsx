"use client";

import UploadButton from "@/components/UploadButton";
import MyPictures from "@/components/MyPictures";
import StatsCard from "@/components/StatsCard";
import TestimonialCard, { TestimonialCardProps } from "@/components/TestimonialCard";
import ImageCarousel from "@/components/ImageCarousel";
import HeroText from "@/components/HeroText";
import ContactButton from "@/components/ContactButton";
import testimonialsData from "@/data/testimonials.json";
import { useAuth } from "@/hooks/useAuth";
import { getStoredImageCount } from "@/lib/cookieUtils";
import { useEffect, useState } from "react";
import tracking from "@/lib/tracking";

export default function Home() {
  const { loading, isAuthenticated, signInWithGoogle } = useAuth();
  const [hasCookieImages, setHasCookieImages] = useState(false);

  useEffect(() => {
    // Check if user has any cookie-stored images
    const cookieImageCount = getStoredImageCount();
    setHasCookieImages(cookieImageCount > 0);

    // Track landing page engagement
    tracking.trackCustomEvent('landing_page_loaded', {
      hasAuth: isAuthenticated,
      hasCookieImages: cookieImageCount > 0,
      cookieImageCount,
    });
  }, [isAuthenticated]);

  const topRowImages = [
    "asset_images/gallery-1.png",
    "asset_images/gallery-2.png",
    "asset_images/gallery-3.png",
    "asset_images/gallery-4.png",
    "asset_images/gallery-5.png",
    "asset_images/gallery-6.png",
  ];

  const bottomRowImages = [
    "asset_images/gallery-7.png",
    "asset_images/gallery-8.png",
    "asset_images/gallery-9.png",
    "asset_images/gallery-10.png",
    "asset_images/gallery-11.png",
    "asset_images/gallery-12.png",
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
          <ImageCarousel topRowImages={topRowImages} bottomRowImages={bottomRowImages} />
          <HeroText />
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
        <ContactButton />
      </div>
    </div>
  );
}
