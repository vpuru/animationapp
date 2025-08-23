"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getImageState, getImageUrl } from '@/services/supabase';
import type { ImageState } from '@/services/supabase';

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
  const { uuid } = React.use(params);

  useEffect(() => {
    async function loadImage() {
      try {
        const imageState = await getImageState(uuid);
        if (!imageState) {
          setError('Image not found');
          return;
        }

        if (!imageState.purchased) {
          setError('Image not purchased');
          return;
        }

        if (!imageState.output_bucket_id) {
          setError('Image not ready for download');
          return;
        }

        setImage(imageState);
      } catch (err) {
        console.error('Failed to load image:', err);
        setError(err instanceof Error ? err.message : 'Failed to load image');
      } finally {
        setLoading(false);
      }
    }

    loadImage();
  }, [uuid]);

  const handleDownload = () => {
    if (!image) return;
    const imageUrl = getImageUrl(image);
    if (imageUrl) {
      window.open(imageUrl, '_blank');
    }
  };

  const handleCopyLink = async () => {
    if (!image) return;
    const imageUrl = getImageUrl(image);
    if (imageUrl) {
      try {
        await navigator.clipboard.writeText(imageUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    }
  };

  const handleHome = () => {
    router.push('/');
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
    <div className="min-h-screen app-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Your Generated Image</h1>
          
          {imageUrl && (
            <div className="mb-8">
              <img
                src={imageUrl}
                alt="Generated headshot"
                className="w-full max-w-md mx-auto rounded-lg shadow-lg"
              />
            </div>
          )}

          {/* Download and Copy Link buttons */}
          <div className="flex gap-4 justify-center mb-4">
            <button
              onClick={handleDownload}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15V19C21 19.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Download
            </button>

            <button
              onClick={handleCopyLink}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 13C10.4295 13.5741 10.9774 14.0491 11.6066 14.3929C12.2357 14.7367 12.9315 14.9411 13.6467 14.9923C14.3618 15.0435 15.0796 14.9403 15.7513 14.6897C16.4231 14.4392 17.0331 14.047 17.54 13.54L20.54 10.54C21.4508 9.59695 21.9548 8.33394 21.9434 7.02296C21.932 5.71198 21.4061 4.45791 20.4791 3.53087C19.5521 2.60383 18.298 2.07799 16.987 2.0666C15.676 2.0552 14.413 2.55918 13.47 3.47L11.75 5.18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 11C13.5705 10.4259 13.0226 9.9509 12.3934 9.60714C11.7643 9.26339 11.0685 9.05895 10.3533 9.00775C9.63819 8.95655 8.92037 9.05973 8.24864 9.31028C7.5769 9.56084 6.9669 9.95303 6.46 10.46L3.46 13.46C2.54918 14.403 2.04520 15.6661 2.05661 16.977C2.06801 18.288 2.59385 19.5421 3.52089 20.4691C4.44793 21.3962 5.70199 21.922 7.01297 21.9334C8.32395 21.9448 9.58701 21.4408 10.53 20.53L12.24 18.82" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>

          {/* Home button */}
          <button
            onClick={handleHome}
            className="w-full bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}