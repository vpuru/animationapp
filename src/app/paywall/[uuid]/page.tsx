"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { getPreviewUrl, getImageState } from "@/services/supabase";
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
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { uuid } = use(params);

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

        // Get preview image URL and set it directly
        const previewUrl = getPreviewUrl(uuid);
        setPreviewImageUrl(previewUrl);
      } catch (err) {
        console.error("Error checking image:", err);
        setError("Failed to load preview image");
      }
    };

    checkImageExists();
  }, [uuid, router]);

  const handleUnlock = async () => {
    if (isUnlocking) return;

    setIsUnlocking(true);
    setError(null);

    try {
      const response = await fetch(`/api/unlock/${uuid}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to unlock image");
      }

      const result = await response.json();

      if (result.success && result.fullImageUrl) {
        // Redirect to the full resolution image
        window.open(result.fullImageUrl, "_blank");
      } else {
        throw new Error(result.error || "Unlock failed");
      }
    } catch (err) {
      console.error("Unlock error:", err);
      setError(err instanceof Error ? err.message : "Failed to unlock image");
    } finally {
      setIsUnlocking(false);
    }
  };

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
    <div className="min-h-screen app-background flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md mx-auto">
        {/* Hero Image with Overlay */}
        <PaywallHero
          previewImageUrl={previewImageUrl}
          imageLoaded={imageLoaded}
          onImageLoad={() => setImageLoaded(true)}
          onImageError={() => setError("Failed to load preview image")}
        />

        {/* Features List */}
        <PaywallFeatures />

        {/* Pricing and Payment */}
        <PaywallPricing onUnlock={handleUnlock} isUnlocking={isUnlocking} />

        {/* Security Badges */}
        <PaywallSecurity />

        {/* Back to Home Link */}
        {/* <div className="text-center mt-6">
          <button
            onClick={() => router.push("/")}
            className="text-blue-600 hover:text-blue-800 transition-colors text-sm"
          >
            Back to Home
          </button>
        </div> */}
      </div>
    </div>
  );
}
