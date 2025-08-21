"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { getImageState, getPublicUrl } from "@/services/supabase";
import type { ImageState } from "@/services/supabase";

interface PaywallPageProps {
  params: Promise<{
    uuid: string;
  }>;
}

export default function PaywallPage({ params }: PaywallPageProps) {
  const [imageState, setImageState] = useState<ImageState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const router = useRouter();
  const { uuid } = use(params);

  useEffect(() => {
    if (!uuid) {
      setError("Invalid image ID");
      setLoading(false);
      return;
    }

    const fetchImageState = async () => {
      try {
        const state = await getImageState(uuid);
        
        if (!state) {
          setError("Image not found");
          return;
        }

        setImageState(state);

        if (state.state === 'failed') {
          setError(state.error_message || "Image processing failed");
          return;
        }

        if (state.state === 'in_progress') {
          setError("Image is still being processed. Please wait and try again.");
          return;
        }

        if (state.state === 'completed' && state.output_bucket_id) {
          // Get the public URL for the processed image
          const publicUrl = getPublicUrl('output_images', state.output_bucket_id);
          setProcessedImageUrl(publicUrl);
        } else {
          setError("Processed image not available");
        }

      } catch (err) {
        console.error('Error fetching image state:', err);
        setError(err instanceof Error ? err.message : 'Failed to load image');
      } finally {
        setLoading(false);
      }
    };

    fetchImageState();
  }, [uuid]);

  if (loading) {
    return (
      <div className="min-h-screen app-background flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your processed image...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen app-background flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md mx-auto text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="text-sm mb-4">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Start Over
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-background flex flex-col items-center justify-start pt-8 px-4">
      <div className="w-full max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            ✨ Your Ghibli Transformation is Ready! ✨
          </h1>
          <p className="text-lg text-gray-600">
            Your image has been transformed into beautiful Studio Ghibli style
          </p>
        </div>

        {/* Processed Image Display */}
        {processedImageUrl && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Your Ghibli Masterpiece</h2>
            </div>
            
            <div className="flex justify-center mb-6">
              <div className="relative rounded-lg overflow-hidden shadow-lg max-w-2xl">
                <img
                  src={processedImageUrl}
                  alt="Ghibli-style processed image"
                  className="w-full h-auto max-h-96 object-contain"
                  onError={() => setError("Failed to load processed image")}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href={processedImageUrl}
                download={`ghibli-${uuid}.jpg`}
                className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg"
              >
                📱 Download Your Image
              </a>
              
              <button
                onClick={() => router.push('/')}
                className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg"
              >
                🎨 Transform Another Image
              </button>
            </div>
          </div>
        )}

        {/* Processing Info */}
        {imageState && (
          <div className="bg-gray-100 rounded-lg p-4 text-center text-sm text-gray-600">
            <p>Processed on {new Date(imageState.created_at).toLocaleDateString()}</p>
            <p className="mt-1">Transformation ID: {uuid}</p>
          </div>
        )}
      </div>
    </div>
  );
}