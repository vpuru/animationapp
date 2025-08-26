/**
 * Image processing utilities for adding overlays and manipulating images
 * Server-side implementation using Sharp
 */

import sharp from 'sharp';
import { readFile } from 'fs/promises';
import path from 'path';

/**
 * Adds a padlock overlay to an image using Sharp
 * @param imageBlob - The original image blob
 * @returns Promise<Blob> - The image with padlock overlay
 */
export const addPadlockOverlay = async (imageBlob: Blob): Promise<Blob> => {
  try {
    // Convert blob to buffer
    const imageBuffer = Buffer.from(await imageBlob.arrayBuffer());
    
    // Get image metadata to determine size
    const metadata = await sharp(imageBuffer).metadata();
    const { width = 1024, height = 1024 } = metadata;
    
    // Calculate padlock size (20% of image width, max 200px, min 100px)
    const padlockSize = Math.max(Math.min(width * 0.2, 200), 100);
    
    // Position padlock in center
    const left = Math.round((width - padlockSize) / 2);
    const top = Math.round((height - padlockSize) / 2);
    
    // Read padlock image from public directory
    const padlockPath = path.join(process.cwd(), 'public', 'padlock.png');
    const padlockBuffer = await readFile(padlockPath);
    
    // Resize padlock to desired size
    const resizedPadlock = await sharp(padlockBuffer)
      .resize(padlockSize, padlockSize)
      .png()
      .toBuffer();
    
    // Create semi-transparent dark overlay
    const overlay = await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0.5 }
      }
    })
    .png()
    .toBuffer();
    
    // Composite: original image + dark overlay + padlock
    const result = await sharp(imageBuffer)
      .composite([
        {
          input: overlay,
          blend: 'over'
        },
        {
          input: resizedPadlock,
          left,
          top,
          blend: 'over'
        }
      ])
      .png()
      .toBuffer();
    
    // Convert buffer back to blob
    return new Blob([new Uint8Array(result)], { type: 'image/png' });
    
  } catch (error) {
    console.error('Sharp image processing error:', error);
    throw new Error(`Failed to add padlock overlay: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Converts any image format to PNG using Sharp
 * Handles HEIC, JPEG, WebP, PNG automatically with optimal compression
 * @param imageBlob - The original image blob in any supported format
 * @returns Promise<Blob> - PNG image blob
 */
export const convertImageToPNG = async (imageBlob: Blob): Promise<Blob> => {
  try {
    // Convert blob to buffer
    const imageBuffer = Buffer.from(await imageBlob.arrayBuffer());
    
    // Get metadata to understand the input image
    const metadata = await sharp(imageBuffer).metadata();
    console.log(`Converting ${metadata.format} image - Original: ${metadata.width}x${metadata.height}, EXIF orientation: ${metadata.orientation || 'none'}`);
    
    // Apply EXIF orientation and convert to PNG
    const sharpPipeline = sharp(imageBuffer)
      .rotate() // Auto-apply EXIF orientation to preserve visual appearance
      .png({
        compressionLevel: 6, // Good balance of size vs speed
        adaptiveFiltering: true, // Better compression for complex images
        force: true // Force PNG output regardless of input format
      });
    
    // Get final dimensions after rotation
    const rotatedMetadata = await sharpPipeline.clone().metadata();
    console.log(`After orientation correction: ${rotatedMetadata.width}x${rotatedMetadata.height}`);
    
    // Convert to buffer
    const pngBuffer = await sharpPipeline.toBuffer();
    
    console.log(`Conversion complete: ${imageBuffer.length} bytes → ${pngBuffer.length} bytes`);
    
    // Convert buffer back to blob
    return new Blob([new Uint8Array(pngBuffer)], { type: 'image/png' });
    
  } catch (error) {
    console.error('Sharp image conversion error:', error);
    throw new Error(`Failed to convert image to PNG: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Utility function to convert a blob to base64
 * @param blob - The blob to convert
 * @returns Promise<string> - Base64 encoded string
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
};