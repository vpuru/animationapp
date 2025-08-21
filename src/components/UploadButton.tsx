"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { uploadToInputBucket, validateImageFile } from "@/services/supabase";

export default function UploadButton() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const getFileExtension = (file: File) => {
    // Use the MIME type to get the correct extension
    switch (file.type) {
      case "image/jpeg":
        return "jpg";
      case "image/png":
        return "png";
      case "image/webp":
        return "webp";
      case "image/heic":
        return "jpg"; // HEIC will be converted to JPEG
      default:
        return "jpg"; // fallback
    }
  };

  const convertHeicToJpeg = async (file: File): Promise<File> => {
    try {
      // Dynamically import heic2any to avoid SSR issues
      const heic2any = (await import("heic2any")).default;
      
      const convertedBlob = (await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.8,
      })) as Blob;

      // Create a new File object from the converted blob
      return new File([convertedBlob], file.name.replace(/\.heic$/i, ".jpg"), {
        type: "image/jpeg",
        lastModified: file.lastModified,
      });
    } catch (error) {
      console.error("HEIC conversion error:", error);
      throw new Error("Failed to convert HEIC image. Please try a different format.");
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Validate file
      validateImageFile(file);

      // Convert HEIC to JPEG if needed
      let fileToUpload = file;
      if (file.type === "image/heic") {
        fileToUpload = await convertHeicToJpeg(file);
      }

      // Generate UUID for this upload
      const imageUuid = uuidv4();
      const fileExtension = getFileExtension(fileToUpload);
      const fileName = `${imageUuid}.${fileExtension}`;

      // Simulate upload progress (Supabase doesn't provide real progress)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload to Supabase
      await uploadToInputBucket(fileToUpload, fileName);

      // Complete progress
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Small delay to show 100% progress
      setTimeout(() => {
        // Navigate to loading page with UUID
        router.push(`/loading/${imageUuid}`);
      }, 500);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Upload failed");
      setIsUploading(false);
      setUploadProgress(0);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInputRef.current.files = dataTransfer.files;

      // Trigger the change event
      const changeEvent = new Event("change", { bubbles: true });
      fileInputRef.current.dispatchEvent(changeEvent);
    }
  };

  if (isUploading) {
    return (
      <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold px-8 py-4 rounded-lg text-lg shadow-lg min-w-[200px]">
        <div className="flex flex-col items-center space-y-2">
          <div className="text-sm">Uploading... {uploadProgress}%</div>
          <div className="w-full bg-blue-300 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Upload image file"
      />

      {/* Upload button / drop zone */}
      <div
        onClick={handleButtonClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-all duration-200 shadow-lg active:scale-95 cursor-pointer border-2 border-dashed border-transparent hover:border-blue-300"
      >
        <div className="flex flex-col items-center space-y-2">
          <div>Click here to upload!</div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm max-w-md">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
}
