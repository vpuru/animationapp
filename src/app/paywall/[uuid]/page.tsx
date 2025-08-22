"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getPublicUrl } from "@/services/supabase";

interface PaywallPageProps {
  params: Promise<{
    uuid: string;
  }>;
}

export default function PaywallPage({ params }: PaywallPageProps) {
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const router = useRouter();
  const { uuid } = use(params);

  useEffect(() => {
    if (!uuid) {
      router.push("/");
      return;
    }

    const checkImageExists = async () => {
      try {
        const imageUrl = getPublicUrl(uuid);

        const response = await fetch(imageUrl, { method: "HEAD" });

        if (response.ok) {
          setProcessedImageUrl(imageUrl);
        } else {
          // Image doesn't exist, redirect to home
          router.push("/");
          return;
        }
      } catch (err) {
        console.error("Error checking image:", err);
        router.push("/");
        return;
      }
    };

    checkImageExists();
  }, [uuid, router]);

  if (!processedImageUrl) {
    return null; // Will redirect to home if image doesn't exist
  }

  return (
    <div className="min-h-screen app-background flex flex-col items-center justify-center px-4">
      <div className="text-center">
        <div className="relative rounded-lg shadow-lg mb-8 overflow-hidden">
          {/* Skeleton placeholder */}
          {!imageLoaded && (
            <div className="w-full h-96 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
              <div className="text-gray-400">
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          )}
          
          {/* Actual image */}
          <Image
            src={processedImageUrl}
            alt="Your processed image"
            width={1024}
            height={1024}
            className={`w-auto h-auto max-w-full rounded-lg transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            } ${!imageLoaded ? 'absolute inset-0' : ''}`}
            onLoad={() => setImageLoaded(true)}
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1024px"
          />
        </div>
        
        <button
          onClick={() => router.push("/")}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
