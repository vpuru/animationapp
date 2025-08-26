"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getImageState, getImageUrl, getImageDownloadUrl } from "@/services/supabase";
import type { ImageState } from "@/services/supabase";
import {
  DownloadIcon,
  QualityIcon,
  ShareIcon,
  LinkIcon,
  UserIcon,
  GoogleIcon,
} from "@/components/icons";
import { useAuth } from "@/hooks/useAuth";

interface DownloadPageProps {
  params: Promise<{
    uuid: string;
  }>;
}

export default function DownloadPage({ params }: DownloadPageProps) {
  const [image, setImage] = useState<ImageState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const { uuid: rawUuid } = React.use(params);
  // Extract UUID from filename if it contains _ghibli.png
  const uuid = rawUuid.replace(/_ghibli\.png$/, "");
  const { isAuthenticated, signInWithGoogle, getCurrentUserId } = useAuth();

  useEffect(() => {
    async function loadImage() {
      try {
        const imageState = await getImageState(uuid);
        const currentUserId = await getCurrentUserId();

        if (!imageState) {
          setError("Image not found");
          return;
        }

        if (imageState.user_id != currentUserId) {
          router.push(`/`);
          return;
        }

        if (!imageState.purchased) {
          // Image not purchased, redirect to paywall
          router.push(`/paywall/${uuid}`);
          return;
        }

        if (!imageState.output_bucket_id) {
          setError("Image not ready for download");
          return;
        }

        setImage(imageState);
      } catch (err) {
        console.error("Failed to load image:", err);
        setError(err instanceof Error ? err.message : "Failed to load image");
      } finally {
        setLoading(false);
      }
    }

    loadImage();
  }, [uuid, router]);

  const handleDownload = () => {
    if (!image) return;
    const imageUrl = getImageDownloadUrl(image);
    if (imageUrl) {
      window.open(imageUrl, "_blank");
    }
  };

  const handleCopyLink = async () => {
    if (!image) return;
    const imageUrl = getImageDownloadUrl(image);
    if (imageUrl) {
      try {
        await navigator.clipboard.writeText(imageUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy link:", err);
      }
    }
  };

  const handleHome = () => {
    router.push("/");
  };

  const handleSignIn = async () => {
    try {
      // Store return path for after auth
      sessionStorage.setItem("authReturnTo", window.location.pathname);

      const { error } = await signInWithGoogle();

      if (error) {
        console.error("Google sign-in error:", error);
        setError("Failed to sign in with Google. Please try again.");
      }
      // OAuth flow will redirect to callback page
    } catch (error) {
      console.error("Sign-in error:", error);
      setError("Failed to sign in with Google. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen app-background flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen app-background flex items-center justify-center">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  const imageUrl = image ? getImageUrl(image) : null;

  return (
    <div className="min-h-screen app-background flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-md mx-auto">
        {/* Hero Image - clean without overlay text */}
        {imageUrl && (
          <div className="mb-0">
            <Image
              src={imageUrl}
              alt="Generated headshot"
              width={288}
              height={288}
              className="w-full max-w-xs mx-auto rounded-2xl shadow-2xl"
            />
          </div>
        )}

        {/* White Container with Shadow - overlapping image slightly */}
        <div className="bg-white rounded-2xl p-6 shadow-2xl -mt-4 relative z-10">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Your Animation is Ready!</h2>
            <p className="text-gray-600 text-sm">
              High-quality headshot ready to download and share
            </p>
          </div>

          {/* Features List */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <DownloadIcon color="#8B5CF6" />
              </div>
              <div>
                <div className="font-semibold text-gray-800">Download anytime</div>
                <div className="text-sm text-gray-600">Yours forever, no subscription needed</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <QualityIcon color="#3B82F6" />
              </div>
              <div>
                <div className="font-semibold text-gray-800">High resolution quality</div>
                <div className="text-sm text-gray-600">Perfect for professional use</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <ShareIcon color="#10B981" />
              </div>
              <div>
                <div className="font-semibold text-gray-800">Perfect for sharing</div>
                <div className="text-sm text-gray-600">
                  Ready for social media & professional use
                </div>
              </div>
            </div>
          </div>

          {/* Download and Copy Link buttons */}
          <div className="space-y-3">
            {!isAuthenticated && (
              <button
                onClick={handleSignIn}
                className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200"
              >
                <GoogleIcon />
                <div className="flex flex-col items-start">
                  <span>Sign in</span>
                  <span className="text-xs text-gray-500 font-normal">sign in to save</span>
                </div>
              </button>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white px-6 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg transition-all duration-200"
              >
                <DownloadIcon />
                Download
              </button>

              <button
                onClick={handleCopyLink}
                className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-6 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200"
              >
                <LinkIcon />
                {copied ? "Link Copied!" : "Copy Link"}
              </button>
            </div>

            <button
              onClick={handleHome}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200"
            >
              <UserIcon />
              Create More Animations
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
