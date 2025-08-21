import React from "react";
import StarIcon from "@/components/ui/star-icon";

export default function StarRating() {
  return (
    <div className="flex items-center justify-center bg-blue-100 rounded-lg px-4 py-3 mx-auto w-fit">
      <div className="flex items-center gap-2">
        <StarIcon />
        <span className="font-semibold text-gray-800">
          4.9/5 <span className="text-gray-600 font-normal">(40,000+ reviews)</span>
        </span>
      </div>
    </div>
  );
}
