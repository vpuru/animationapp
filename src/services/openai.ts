import OpenAI from "openai";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { determineOptimalOpenAISize, type Dimensions } from "./dimensionUtils";

const openaiApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

if (!openaiApiKey) {
  throw new Error("Missing OPENAI_API_KEY environment variable");
}

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: openaiApiKey,
});

// Read prompt from file
const getPrompt = (): string => {
  try {
    const promptPath = path.join(process.cwd(), "src", "data", "prompt.txt");
    return fs.readFileSync(promptPath, "utf-8").trim();
  } catch (error) {
    console.error("Failed to read prompt file:", error);
    // Fallback prompt
    return "Convert the input photo into a Studio Ghibli–inspired, hand-drawn animation portrait with clean line art and soft cel shading.";
  }
};

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

// Debug: Save files for inspection (only in development)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const saveDebugFile = async (file: File, debugFilename: string): Promise<void> => {
  if (process.env.NODE_ENV !== "development") return;

  try {
    const debugDir = path.join(process.cwd(), "debug");
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(debugDir, debugFilename);
    fs.writeFileSync(filePath, buffer);
    console.log(`[DEBUG] Saved debug file: ${filePath}`);
  } catch (error) {
    console.warn(`[DEBUG] Failed to save debug file ${debugFilename}:`, error);
  }
};

// Get image dimensions from blob using sharp (server-side)
const getImageDimensions = async (imageFile: Blob): Promise<{ width: number; height: number }> => {
  try {
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    
    // Apply EXIF orientation correction to get visual dimensions
    const rotatedMetadata = await sharp(buffer)
      .rotate() // Auto-apply EXIF orientation
      .metadata();

    if (!rotatedMetadata.width || !rotatedMetadata.height) {
      throw new Error("Could not determine image dimensions");
    }

    console.log(`[DEBUG] Image dimensions after EXIF correction: ${rotatedMetadata.width}x${rotatedMetadata.height}`);
    return { width: rotatedMetadata.width, height: rotatedMetadata.height };
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
    const blob = new Blob([new Uint8Array(transparentBuffer)], { type: "image/png" });
    return new File([blob], "mask.png", { type: "image/png" });
  } catch (error) {
    throw new Error(
      "Failed to generate transparent mask: " +
        (error instanceof Error ? error.message : "Unknown error")
    );
  }
};

// Generate a SEMI-TRANSPARENT mask for gentler edits
const generateSemiTransparentMask = async (width: number, height: number): Promise<File> => {
  try {
    // Create a semi-transparent PNG buffer (50% alpha)
    const semiTransparentBuffer = await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0.5 },
      },
    })
      .png()
      .toBuffer();

    // Convert buffer to File
    const blob = new Blob([new Uint8Array(semiTransparentBuffer)], { type: "image/png" });
    return new File([blob], "mask.png", { type: "image/png" });
  } catch (error) {
    throw new Error(
      "Failed to generate semi-transparent mask: " +
        (error instanceof Error ? error.message : "Unknown error")
    );
  }
};

// Generate a CENTER-PRESERVING mask (opaque center, transparent edges)
const generateCenterPreservingMask = async (width: number, height: number): Promise<File> => {
  try {
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const preserveRadius = Math.min(width, height) * 0.3; // Preserve 30% of the smaller dimension

    // Create a mask with radial gradient
    const maskBuffer = await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }, // Start transparent
      },
    })
      .composite([
        {
          input: await sharp({
            create: {
              width,
              height,
              channels: 4,
              background: { r: 255, g: 255, b: 255, alpha: 1 }, // Opaque white center
            },
          })
            .resize(Math.floor(preserveRadius * 2), Math.floor(preserveRadius * 2))
            .extend({
              top: centerY - Math.floor(preserveRadius),
              bottom: height - (centerY + Math.floor(preserveRadius)),
              left: centerX - Math.floor(preserveRadius),
              right: width - (centerX + Math.floor(preserveRadius)),
              background: { r: 0, g: 0, b: 0, alpha: 0 },
            })
            .blur(Math.floor(preserveRadius * 0.3)) // Smooth edges
            .png()
            .toBuffer(),
          blend: "over",
        },
      ])
      .png()
      .toBuffer();

    // Convert buffer to File
    const blob = new Blob([new Uint8Array(maskBuffer)], { type: "image/png" });
    return new File([blob], "mask.png", { type: "image/png" });
  } catch (error) {
    throw new Error(
      "Failed to generate center-preserving mask: " +
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
    const dimensions: Dimensions = { width, height };

    console.log(
      `[DEBUG] Input image - Size: ${imageFile.size} bytes, Type: ${imageFile.type}, Dimensions: ${width}x${height}`
    );

    // Determine optimal OpenAI size using smart dimension analysis
    const sizeDecision = determineOptimalOpenAISize(dimensions);
    console.log(`[DEBUG] Size decision: ${sizeDecision.reasoning}`);

    // Convert to File for SDK
    const inputFile = blobToFile(imageFile, "input.png");

    // Debug: Save input image for inspection
    // await saveDebugFile(inputFile, `debug-input-${Date.now()}.png`);

    // Generate mask for editing - configurable strategy
    const maskStrategy = process.env.MASK_STRATEGY || "semi-transparent"; // Options: 'full-transparent', 'semi-transparent', 'center-preserving'
    console.log(`[DEBUG] Using mask strategy: ${maskStrategy}`);

    let maskFile: File;
    switch (maskStrategy) {
      case "center-preserving":
        maskFile = await generateCenterPreservingMask(width, height);
        break;
      case "full-transparent":
        maskFile = await generateFullTransparentMask(width, height);
        break;
      case "semi-transparent":
      default:
        maskFile = await generateSemiTransparentMask(width, height);
        break;
    }

    console.log(
      `[DEBUG] Generated mask - Size: ${maskFile.size} bytes, Dimensions: ${width}x${height}`
    );

    // Debug: Save mask for inspection
    // await saveDebugFile(maskFile, `debug-mask-${Date.now()}.png`);

    console.log(
      `[DEBUG] Calling OpenAI images.edit API with model: gpt-image-1, size: ${sizeDecision.size}, input dimensions: ${width}x${height}`
    );

    // Call Images Edit endpoint with smart size selection
    const editResponse = await openai.images.edit({
      model: "gpt-image-1",
      image: inputFile,
      mask: maskFile,
      prompt: getPrompt(),
      n: 1,
      size: sizeDecision.size,
    });

    console.log(
      `[DEBUG] OpenAI API response - Data items: ${
        editResponse.data?.length || 0
      }, Output format: ${editResponse.output_format || "unknown"}`
    );

    // Log successful processing with dimension info
    console.log(`[DEBUG] Successfully processed image with ${sizeDecision.size} dimensions (confidence: ${(sizeDecision.confidence * 100).toFixed(1)}%)`);

    if (!editResponse.data || editResponse.data.length === 0) {
      throw new Error("No Ghibli-style image generated");
    }

    const imageData = editResponse.data[0];
    if (!imageData) {
      throw new Error("No image data in edit response");
    }

    // Handle base64 response
    if (imageData.b64_json) {
      const base64Data = imageData.b64_json;
      const dataUrl = `data:image/png;base64,${base64Data}`;
      return dataUrl;
    }

    // Fallback to URL if provided
    if (imageData.url) {
      return imageData.url;
    }

    throw new Error("No image URL or base64 data in edit response");
  } catch (error) {
    console.error("OpenAI Ghibli transformation error:", error);
    // Type-narrow OpenAI SDK errors
    if (
      (error as { status?: number; error?: string })?.status ||
      (error as { status?: number; error?: string })?.error
    ) {
      throw new Error(
        `OpenAI API Error: ${(error as { message?: string }).message ?? "Request failed"}`
      );
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
