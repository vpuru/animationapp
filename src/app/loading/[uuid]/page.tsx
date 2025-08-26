"use client";

import { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FadingImages from "@/components/FadingImages";
import ProgressBar from "@/components/ProgressBar";
import CyclingText from "@/components/CyclingText";
import StarRating from "@/components/StarRating";
import { getImageState, createImageState } from "@/services/supabase";
import { useAuth } from "@/hooks/useAuth";

interface LoadingPageProps {
  params: Promise<{
    uuid: string;
  }>;
}

export default function LoadingPage({ params }: LoadingPageProps) {
  const [error, setError] = useState<string | null>(null);
  const [processingStage, setProcessingStage] = useState("Initializing...");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { uuid } = use(params);
  const { ensureAnonymousUser, getCurrentUserId } = useAuth();

  useEffect(() => {
    if (!uuid) {
      setError("Invalid image ID");
      return;
    }

    const checkDatabaseState = async () => {
      try {
        const existingState = await getImageState(uuid);

        if (!existingState) {
          // No database entry - this is first time, create entry and start processing
          // Check if user is already authenticated before creating anonymous user
          const currentUserId = await getCurrentUserId();
          const userId = currentUserId || await ensureAnonymousUser();
          
          // Get file extension from URL params, validate it, and reconstruct filename
          const fileExtension = searchParams.get('ext') || 'png';
          const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'heic'];
          
          if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
            throw new Error(`Invalid file extension: ${fileExtension}`);
          }
          
          const inputBucketId = `${uuid}.${fileExtension}`;
          await createImageState(uuid, inputBucketId, userId);
          // Continue to processImage()
          return false; // Indicates we should proceed with processing
        }

        if (existingState.output_bucket_id) {
          // Image already completed, redirect to paywall
          router.push(`/paywall/${uuid}`);
          return true; // Indicates we handled the request
        } else {
          // Entry exists but no output - processing in progress or failed (refresh case)
          setError("Processing is already in progress. Please wait or try again later.");
          setTimeout(() => {
            router.push("/");
          }, 3000);
          return true; // Indicates we handled the request
        }
      } catch (err) {
        console.error("Database check error:", err);
        setError("Failed to check processing status");
        setTimeout(() => {
          router.push("/");
        }, 3000);
        return true; // Indicates we handled the request
      }
    };

    const processImage = async () => {
      try {
        setProcessingStage("Processing your image...");

        const response = await fetch(`/api/process-image/${uuid}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || `Processing failed: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          router.push(`/paywall/${uuid}`);
        } else {
          throw new Error(result.error || "Processing failed");
        }
      } catch (err) {
        console.error("Processing error:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred");

        setTimeout(() => {
          router.push("/");
        }, 3000);
      }
    };

    const handleRequest = async () => {
      const shouldSkipProcessing = await checkDatabaseState();
      if (!shouldSkipProcessing) {
        // Only call processImage if database check says we should proceed
        processImage();
      }
    };

    handleRequest();
  }, [uuid, router]);

  if (error) {
    return (
      <div className="min-h-screen app-background flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md mx-auto text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Processing Failed</h2>
            <p className="text-sm mb-4">{error}</p>
            <p className="text-sm mb-4">Please try again. Redirecting to home in 3 seconds...</p>
            <button
              onClick={() => router.push("/")}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-background flex flex-col items-center justify-start pt-16 px-4">
      <div className="w-full max-w-2xl mx-auto">
        {/* Fading Images at the top */}
        <div className="flex justify-center mb-8">
          <FadingImages />
        </div>

        {/* Progress Bar in the center */}
        <div className="flex justify-center mb-4">
          <ProgressBar />
        </div>

        {/* Processing stage indicator */}
        <div className="flex justify-center mb-8">
          <div className="text-center">
            <p className="text-blue-600 font-medium text-lg">{processingStage}</p>
            <p className="text-gray-600 text-sm mt-1">This usually takes 30-60 seconds</p>
          </div>
        </div>

        {/* Cycling Text at the bottom */}
        <div className="flex justify-center mb-8">
          <CyclingText />
        </div>

        {/* Star Rating */}
        <div className="flex justify-center">
          <StarRating />
        </div>
      </div>
    </div>
  );
}
