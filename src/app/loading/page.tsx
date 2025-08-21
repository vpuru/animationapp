"use client";

import FadingImages from "@/components/FadingImages";
import ProgressBar from "@/components/ProgressBar";
import CyclingText from "@/components/CyclingText";
import StarRating from "@/components/StarRating";

export default function LoadingPage() {
  return (
    <div className="min-h-screen app-background flex flex-col items-center justify-start pt-46 px-4">
      <div className="w-full max-w-2xl mx-auto">
        {/* Fading Images at the top */}
        <div className="flex justify-center mb-8">
          <FadingImages />
        </div>

        {/* Progress Bar in the center */}
        <div className="flex justify-center">
          <ProgressBar />
        </div>

        {/* Cycling Text at the bottom */}
        <div className="flex justify-center mb-8">
          <CyclingText />
        </div>

        {/* Star Rating */}
        <div className="flex justify-center pt-20">
          <StarRating />
        </div>
      </div>
    </div>
  );
}
