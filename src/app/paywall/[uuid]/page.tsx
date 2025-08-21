"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { getPublicUrl } from "@/services/supabase";

interface PaywallPageProps {
  params: Promise<{
    uuid: string;
  }>;
}

export default function PaywallPage({ params }: PaywallPageProps) {
  const [loading, setLoading] = useState(true);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
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
      } finally {
        setLoading(false);
      }
    };

    checkImageExists();
  }, [uuid, router]);

  if (loading) {
    return (
      <div className="min-h-screen app-background flex flex-col items-center justify-center px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your image...</p>
      </div>
    );
  }

  if (!processedImageUrl) {
    return null; // Will redirect to home if image doesn't exist
  }

  return (
    <div className="min-h-screen app-background flex flex-col items-center justify-center px-4">
      <div className="text-center">
        <img
          src={processedImageUrl}
          alt="Your processed image"
          className="max-w-2xl max-h-96 w-auto h-auto rounded-lg shadow-lg mb-8"
        />
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
