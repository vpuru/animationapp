
import Image from 'next/image';

interface PaywallHeroProps {
  previewImageUrl: string;
  imageLoaded: boolean;
  onImageLoad: () => void;
  onImageError: () => void;
}

export default function PaywallHero({
  previewImageUrl,
  imageLoaded,
  onImageLoad,
  onImageError,
}: PaywallHeroProps) {
  return (
    <div className="relative mb-0">
      {/* Skeleton placeholder */}
      {!imageLoaded && (
        <div className="w-96 h-96 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center mx-auto">
          <div className="text-gray-400">
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Preview image with overlay */}
      {previewImageUrl && (
        <div className="relative w-full max-w-60 mx-auto aspect-square overflow-hidden rounded-lg">
          <Image
            src={previewImageUrl}
            alt="Preview of your processed image"
            width={240}
            height={240}
            className={`w-full h-full object-contain transition-opacity duration-300 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={onImageLoad}
            onError={onImageError}
          />

          {/* Overlay text - positioned at bottom */}
          {imageLoaded && (
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 z-20">
              <div className="bg-white rounded-lg px-3 py-1.5 shadow-xl border-2 border-gray-800 transform -rotate-1 min-w-max">
                <h2 className="text-lg font-black text-gray-800 text-center leading-tight whitespace-pre-line">
                  {"Unlock Your\nAnimation Now!"}
                </h2>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
