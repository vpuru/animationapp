"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import imageCompression from "browser-image-compression";
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

  const compressImageToPNG = async (file: File): Promise<File> => {
    try {
      // First, convert to PNG using canvas if not already PNG
      let pngFile = file;

      if (file.type !== "image/png") {
        // Convert to PNG using canvas
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        // Create image from file
        const imageUrl = URL.createObjectURL(file);

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imageUrl;
        });

        // Set canvas size to image size
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw image to canvas
        ctx?.drawImage(img, 0, 0);

        // Convert canvas to PNG blob
        const pngBlob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => resolve(blob!), "image/png", 1.0);
        });

        // Clean up
        URL.revokeObjectURL(imageUrl);

        // Create new PNG file
        pngFile = new File([pngBlob], file.name.replace(/\.[^/.]+$/, ".png"), {
          type: "image/png",
          lastModified: file.lastModified,
        });
      }

      // Check if already under 4MB
      const maxSizeBytes = 4 * 1024 * 1024; // 4MB
      if (pngFile.size <= maxSizeBytes) {
        return pngFile;
      }

      // Compress the PNG to get under 4MB
      const options = {
        maxSizeMB: 3.8, // Target slightly under 4MB to be safe
        maxWidthOrHeight: 1024, // Match OpenAI's expected size
        useWebWorker: true,
        fileType: "image/png" as const,
      };

      const compressedFile = await imageCompression(pngFile, options);

      // Ensure it's still a PNG with correct extension
      return new File([compressedFile], file.name.replace(/\.[^/.]+$/, ".png"), {
        type: "image/png",
        lastModified: file.lastModified,
      });
    } catch (error) {
      console.error("PNG compression error:", error);
      throw new Error("Failed to compress image to PNG format. Please try a smaller image.");
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

      // Step 1: Convert HEIC to JPEG if needed
      let processedFile = file;
      if (file.type === "image/heic") {
        setUploadProgress(20);
        processedFile = await convertHeicToJpeg(file);
      }

      // Step 2: Compress to PNG format < 4MB for OpenAI compatibility
      setUploadProgress(40);
      const pngFile = await compressImageToPNG(processedFile);

      // Generate UUID for this upload
      const imageUuid = uuidv4();
      const fileName = `${imageUuid}.png`; // Always PNG now

      setUploadProgress(60);

      // Upload to Supabase
      await uploadToInputBucket(pngFile, fileName);

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
