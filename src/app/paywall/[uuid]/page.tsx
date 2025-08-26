"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { getImageState, getImageUrl } from "@/services/supabase";
import {
  PaywallHero,
  PaywallFeatures,
  PaywallPricing,
  PaywallSecurity,
} from "@/components/paywall";

interface PaywallPageProps {
  params: Promise<{
    uuid: string;
  }>;
}

export default function PaywallPage({ params }: PaywallPageProps) {
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { uuid: rawUuid } = use(params);
  // Extract UUID from filename if it contains _ghibli.png
  const uuid = rawUuid.replace(/_ghibli\.png$/, '');

  useEffect(() => {
    if (!uuid) {
      router.push("/");
      return;
    }

    const checkImageExists = async () => {
      try {
        // Check if image processing is complete
        const imageState = await getImageState(uuid);

        if (!imageState) {
          router.push("/");
          return;
        }

        if (!imageState.preview_bucket_id) {
          // Preview not ready yet, redirect to loading
          router.push(`/loading/${uuid}`);
          return;
        }

        if (imageState.purchased) {
          // Image already purchased, redirect to download page
          router.push(`/download/${uuid}`);
          return;
        }

        // Get preview image URL using the same method as gallery
        const previewUrl = getImageUrl(imageState);

        if (!previewUrl) {
          setError("Preview image URL could not be generated");
          return;
        }

        setPreviewImageUrl(previewUrl);
      } catch (err) {
        console.error("Error checking image:", err);
        setError("Failed to load preview image");
      }
    };

    checkImageExists();
  }, [uuid, router]);

  // Removed handleUnlock function - now handled by Stripe payment flow

  if (error) {
    return (
      <div className="min-h-screen app-background flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-4">
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p>{error}</p>
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

  if (!previewImageUrl) {
    return (
      <div className="min-h-screen app-background flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading preview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-background flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-md mx-auto">
        {/* Hero Image with Overlay */}
        <PaywallHero
          previewImageUrl={previewImageUrl}
          imageLoaded={imageLoaded}
          onImageLoad={() => setImageLoaded(true)}
          onImageError={() => setError("Failed to load preview image")}
        />

        {/* White Container with Shadow - overlapping image slightly */}
        <div className="bg-white rounded-2xl p-6 shadow-2xl -mt-4 relative z-10">
          {/* Features List */}
          <PaywallFeatures />

          {/* Pricing and Payment */}
          <PaywallPricing uuid={uuid} />

          {/* Security Badges */}
          <PaywallSecurity />
        </div>
      </div>
    </div>
  );
}
