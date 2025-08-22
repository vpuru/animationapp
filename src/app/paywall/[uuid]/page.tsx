"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getPreviewUrl, getImageState } from "@/services/supabase";

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
        window.open(result.fullImageUrl, '_blank');
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
    <div className="min-h-screen app-background flex flex-col items-center justify-center px-4">
      <div className="text-center">
        <div className="rounded-lg shadow-lg mb-8">
          {/* Skeleton placeholder */}
          {!imageLoaded && (
            <div className="w-96 h-96 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center mx-auto">
              <div className="text-gray-400">
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          )}
          
          {/* Actual preview image */}
          {previewImageUrl && (
            <Image
              src={previewImageUrl}
              alt="Preview of your processed image"
              width={0}
              height={0}
              className={`w-auto h-auto max-w-full max-h-[80vh] rounded-lg mx-auto block transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setError("Failed to load preview image")}
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, auto"
              style={{ width: 'auto', height: 'auto' }}
            />
          )}
        </div>
        
        <div className="space-y-4">
          <p className="text-gray-600 text-lg">
            Your animated image is ready! Unlock the full resolution version below.
          </p>
          
          <button
            onClick={handleUnlock}
            disabled={isUnlocking}
            className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 ${
              isUnlocking
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
            }`}
          >
            {isUnlocking ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Unlocking...</span>
              </div>
            ) : (
              '🔓 Unlock Full Resolution'
            )}
          </button>

          <button
            onClick={() => router.push("/")}
            className="block mx-auto text-blue-600 hover:text-blue-800 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
