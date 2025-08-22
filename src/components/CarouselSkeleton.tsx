import React from "react";

interface CarouselSkeletonProps {
  direction?: "left" | "right";
}

export default function CarouselSkeleton({}: CarouselSkeletonProps) {
  // Create 6 skeleton items to match the visual density
  const skeletonItems = Array.from({ length: 6 }, (_, index) => index);

  return (
    <div className="relative w-full overflow-hidden h-24 md:h-64">
      <div className="flex gap-2">
        {skeletonItems.map((index) => (
          <div
            key={index}
            className="flex-shrink-0 w-40 h-24 md:w-80 md:h-64 bg-gray-200 rounded-lg animate-pulse"
            style={{
              animationDelay: `${index * 0.1}s`,
              animationDuration: "1.5s",
            }}
          />
        ))}
      </div>

      {/* Gradient overlays matching the real carousel */}
      <div
        className="absolute inset-y-0 left-0 w-16 pointer-events-none z-10"
        style={{ background: "linear-gradient(to right, #EEF0EB, transparent)" }}
      />
      <div
        className="absolute inset-y-0 right-0 w-16 pointer-events-none z-10"
        style={{ background: "linear-gradient(to left, #EEF0EB, transparent)" }}
      />
    </div>
  );
}
