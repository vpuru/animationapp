"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserImages, getImageUrl } from '@/services/supabase';
import type { ImageState } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function GalleryPage() {
  const [images, setImages] = useState<ImageState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user, isAuthenticated, getCurrentUserId, signOut } = useAuth();

  useEffect(() => {
    async function loadUserImages() {
      try {
        const userId = await getCurrentUserId();
        if (!userId) {
          router.push('/');
          return;
        }

        const userImages = await getUserImages(userId);
        setImages(userImages);
      } catch (err) {
        console.error('Failed to load images:', err);
        setError(err instanceof Error ? err.message : 'Failed to load images');
      } finally {
        setLoading(false);
      }
    }

    loadUserImages();
  }, [router]);


  if (error) {
    return (
      <div className="min-h-screen app-background flex items-center justify-center">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }


  return (
    <div className="min-h-screen app-background">
      <div className="container mx-auto px-4 py-8">
        <div className="w-full flex justify-between items-center mb-8">
          <button
            onClick={() => router.push('/')}
            className="w-10 h-10 rounded-full bg-white hover:bg-gray-50 flex items-center justify-center transition-colors shadow-sm border border-gray-200"
            title="Home"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800">My Gallery</h1>
            {isAuthenticated && user && (
              <p className="text-sm text-gray-600 mt-1">
                Signed in as {user.email}
              </p>
            )}
          </div>
          
          {isAuthenticated ? (
            <button
              onClick={async () => {
                await signOut();
                router.push('/');
              }}
              className="px-4 py-2 text-sm bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg transition-colors shadow-sm"
              title="Sign out"
            >
              Sign out
            </button>
          ) : (
            <div className="w-10"></div>
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {loading ? (
            // Skeleton loaders
            Array.from({ length: 8 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="relative">
                <div className="w-full aspect-square bg-gray-200 animate-pulse rounded-lg"></div>
                <div className="absolute bottom-2 right-2 bg-gray-300 animate-pulse rounded w-16 h-4"></div>
              </div>
            ))
          ) : images.length === 0 ? (
            <div className="col-span-full text-center text-gray-600 py-16">
              No images found. Create your first headshot!
            </div>
          ) : (
            images.map((image) => {
            const imageUrl = getImageUrl(image);

            return (
              <div key={image.uuid} className="relative group">
                <div 
                  onClick={() => {
                    if (image.purchased) {
                      router.push(`/download/${image.uuid}`);
                    } else {
                      router.push(`/paywall/${image.uuid}`);
                    }
                  }}
                  className="cursor-pointer"
                >
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={`Generated headshot ${image.uuid}`}
                      className="w-full aspect-square object-cover rounded-lg shadow-md"
                    />
                  )}
                </div>
                
                {!image.purchased && (
                  <div className="absolute bottom-2 left-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/paywall/${image.uuid}`);
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium"
                    >
                      Unlock
                    </button>
                  </div>
                )}
                
                <div className="absolute bottom-2 right-2 bg-white bg-opacity-80 rounded px-2 py-1 text-xs">
                  {new Date(image.created_at).toLocaleDateString()}
                </div>
              </div>
            );
          })
          )}
        </div>
      </div>
    </div>
  );
}