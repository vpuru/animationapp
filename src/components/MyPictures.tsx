"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getCurrentUserId, ensureAnonymousUser } from "@/lib/auth";
import { getUserImages, getImageUrl } from "@/services/supabase";
import type { ImageState } from "@/services/supabase";

interface MyPicturesProps {
  images?: string[];
}

export default function MyPictures({
  images = [
    "/photos/chatgpt-image-1.png",
    "/photos/chatgpt-image-2.png",
    "/photos/chatgpt-image-3.png",
  ],
}: MyPicturesProps) {
  const [userImages, setUserImages] = useState<ImageState[]>([]);
  const [imageCount, setImageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadUserImages() {
      try {
        const userId = await getCurrentUserId();
        if (userId) {
          const images = await getUserImages(userId);
          setUserImages(images.slice(0, 3));
          setImageCount(images.length);
        }
      } catch (err) {
        console.error("Failed to load user images:", err);
      } finally {
        setLoading(false);
      }
    }

    loadUserImages();
  }, []);

  const handleClick = () => {
    router.push("/gallery");
  };

  const displayImages = userImages.map(getImageUrl).filter(Boolean);

  return (
    <div
      onClick={handleClick}
      className="inline-flex items-center gap-3 px-4 py-3 bg-white rounded-full shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
    >
      {/* Back Arrow */}
      <div className="text-gray-600">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15 18L9 12L15 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Title */}
      <span className="text-gray-800 font-medium text-base">My Pictures</span>

      {/* Image Bubbles */}
      <div className="flex -space-x-2">
        {loading ? (
          // Skeleton loaders
          Array.from({ length: 3 }).map((_, index) => (
            <div key={`skeleton-${index}`} className="relative">
              <div className="w-8 h-8 rounded-lg bg-gray-200 animate-pulse border-2 border-white shadow-sm"></div>
            </div>
          ))
        ) : (
          displayImages.slice(0, 3).map((image, index) => (
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
          ))
        )}

        {/* Counter bubble */}
        <div className="w-8 h-8 rounded-lg bg-pink-400 border-2 border-white shadow-sm flex items-center justify-center">
          <span className="text-white text-xs font-semibold">
            {userImages.length > 0 ? imageCount : "9"}
          </span>
        </div>
      </div>
    </div>
  );
}
