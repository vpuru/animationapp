import OpenAI from "openai";
import sharp from "sharp";

const openaiApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

if (!openaiApiKey) {
  throw new Error("Missing OPENAI_API_KEY environment variable");
}

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: openaiApiKey,
});

// Validate image format and size (keep modest limit client-side; API may allow larger)
const validateImageForOpenAI = (imageFile: Blob): void => {
  const maxSizeBytes = 20 * 1024 * 1024; // 20MB soft client cap
  const supportedTypes = ["image/png", "image/jpeg", "image/gif", "image/webp"];

  if (imageFile.size > maxSizeBytes) {
    throw new Error(
      `Image size (${(imageFile.size / 1024 / 1024).toFixed(1)}MB) exceeds the client limit of 20MB`
    );
  }

  if (!supportedTypes.includes(imageFile.type)) {
    throw new Error(
      `Image format (${imageFile.type}) is not supported. Supported: ${supportedTypes.join(", ")}`
    );
  }
};

// Convert blob to File object for OpenAI API
const blobToFile = (blob: Blob, filename: string): File => {
  return new File([blob], filename, { type: blob.type });
};

// Get image dimensions from blob using sharp (server-side)
const getImageDimensions = async (imageFile: Blob): Promise<{ width: number; height: number }> => {
  try {
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const metadata = await sharp(buffer).metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error("Could not determine image dimensions");
    }

    return { width: metadata.width, height: metadata.height };
  } catch (error) {
    throw new Error(
      "Failed to get image dimensions: " +
        (error instanceof Error ? error.message : "Unknown error")
    );
  }
};

// Generate a fully TRANSPARENT mask the same size as the image using sharp (server-side)
const generateFullTransparentMask = async (width: number, height: number): Promise<File> => {
  try {
    // Create a transparent PNG buffer using sharp
    const transparentBuffer = await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .png()
      .toBuffer();

    // Convert buffer to File
    const blob = new Blob([transparentBuffer], { type: "image/png" });
    return new File([blob], "mask.png", { type: "image/png" });
  } catch (error) {
    throw new Error(
      "Failed to generate transparent mask: " +
        (error instanceof Error ? error.message : "Unknown error")
    );
  }
};

// Ghibli-style transformation using gpt-image-1 with Images Edits API
export const transformImageToGhibli = async (imageFile: Blob): Promise<string> => {
  try {
    // Validate image
    validateImageForOpenAI(imageFile);

    // Get dimensions for mask generation
    const { width, height } = await getImageDimensions(imageFile);

    console.log("lkjaflksdjflkajflkdsja");

    // Convert to File for SDK
    const inputFile = blobToFile(imageFile, "input.png");

    // Transparent mask covering the entire image (edit the whole frame)
    const maskFile = await generateFullTransparentMask(width, height);

    // Call Images Edit endpoint
    const editResponse = await openai.images.edit({
      model: "gpt-image-1",
      image: inputFile,
      mask: maskFile,
      prompt:
        "Restyle this image in a Studio Ghibli–inspired look: hand-painted watercolor backgrounds, " +
        "soft pastel palette, warm golden lighting, gentle linework and subtle film-grain. " +
        "Maintain the subject’s identity, pose, camera framing, and overall scene composition.",
      n: 1,
      size: "1024x1024",
    });

    console.log(editResponse);
    console.log(editResponse.data);

    if (!editResponse.data || editResponse.data.length === 0) {
      throw new Error("No Ghibli-style image generated");
    }

    const editedImageUrl = editResponse.data[0]?.url;
    if (!editedImageUrl) {
      throw new Error("No image URL in edit response");
    }

    return editedImageUrl;
  } catch (error) {
    console.error("OpenAI Ghibli transformation error:", error);
    // Type-narrow OpenAI SDK errors
    if ((error as any)?.status || (error as any)?.error) {
      throw new Error(`OpenAI API Error: ${(error as any).message ?? "Request failed"}`);
    }
    throw new Error(
      `Failed to transform image to Ghibli style: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

// Download image from URL (for saving processed images)
export const downloadImageFromUrl = async (imageUrl: string): Promise<Blob> => {
  try {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();

    // Validate that we got an image
    if (!blob.type.startsWith("image/")) {
      throw new Error("Downloaded file is not an image");
    }

    return blob;
  } catch (error) {
    console.error("Image download error:", error);
    throw new Error(
      `Failed to download image: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

// Get file extension from blob type
export const getFileExtension = (blob: Blob): string => {
  const mimeType = blob.type;
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg"; // Default fallback
  }
};
