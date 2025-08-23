"use client";

import { useState, useEffect } from 'react';
import { getCurrentUserId } from '@/lib/auth';
import { getUserImages, supabase } from '@/services/supabase';
import type { ImageState } from '@/services/supabase';

export default function GalleryPage() {
  const [images, setImages] = useState<ImageState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUserImages() {
      try {
        const userId = await getCurrentUserId();
        if (!userId) {
          setError('No user session found');
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
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen app-background flex items-center justify-center">
        <div className="text-gray-600">Loading your gallery...</div>
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

  if (images.length === 0) {
    return (
      <div className="min-h-screen app-background flex items-center justify-center">
        <div className="text-gray-600">No images found. Create your first headshot!</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">My Gallery</h1>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => {
            let imageUrl = '';
            if (image.purchased && image.output_bucket_id) {
              const { data } = supabase.storage.from("output_images").getPublicUrl(image.output_bucket_id);
              imageUrl = data.publicUrl;
            } else if (image.preview_bucket_id) {
              const { data } = supabase.storage.from("preview_images").getPublicUrl(image.preview_bucket_id);
              imageUrl = data.publicUrl;
            }

            return (
              <div key={image.uuid} className="relative group">
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt={`Generated headshot ${image.uuid}`}
                    className="w-full aspect-square object-cover rounded-lg shadow-md"
                  />
                )}
                
                {!image.purchased && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                    <div className="text-white text-center">
                      <div className="text-sm font-semibold mb-2">Preview</div>
                      <button className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded text-sm">
                        Unlock $2.99
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="absolute bottom-2 right-2 bg-white bg-opacity-80 rounded px-2 py-1 text-xs">
                  {new Date(image.created_at).toLocaleDateString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}