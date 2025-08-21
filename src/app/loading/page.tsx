"use client";

import FadingImages from "@/components/FadingImages";
import ProgressBar from "@/components/ProgressBar";
import CyclingText from "@/components/CyclingText";

export default function LoadingPage() {
  return (
    <div className="min-h-screen app-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl mx-auto space-y-12">
        {/* Fading Images at the top */}
        <div className="flex justify-center">
          <FadingImages />
        </div>

        {/* Progress Bar in the center */}
        <div className="flex justify-center">
          <ProgressBar />
        </div>

        {/* Cycling Text at the bottom */}
        <div className="flex justify-center">
          <CyclingText />
        </div>
      </div>
    </div>
  );
}
