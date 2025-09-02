"use client";

// Cookie name for storing generated image UUIDs
export const GENERATED_IMAGES_COOKIE = 'generated_images';

// Maximum number of UUIDs to store (to stay within 4KB cookie limit)
const MAX_UUIDS_IN_COOKIE = 50;

// Cookie expiration (30 days)
const COOKIE_EXPIRATION_DAYS = 30;

/**
 * Client-side utility to add a UUID to the generated images cookie
 */
export function addImageUuidToCookie(uuid: string): boolean {
  if (typeof window === 'undefined') {
    console.warn('addImageUuidToCookie called on server side');
    return false;
  }

  try {
    const currentUuids = getImageUuidsFromCookie();
    
    // Avoid duplicates
    if (currentUuids.includes(uuid)) {
      return true;
    }

    // Add new UUID to the beginning of the array (most recent first)
    const updatedUuids = [uuid, ...currentUuids];

    // Trim to maximum length if necessary
    const trimmedUuids = updatedUuids.slice(0, MAX_UUIDS_IN_COOKIE);

    // Set cookie with proper options
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + COOKIE_EXPIRATION_DAYS);

    const cookieValue = encodeURIComponent(JSON.stringify(trimmedUuids));
    
    // Check if cookie size would exceed limits (rough estimate)
    if (cookieValue.length > 3500) {
      console.warn('Cookie size approaching limit, trimming further');
      const safeTrimmedUuids = trimmedUuids.slice(0, 30);
      const safeCookieValue = encodeURIComponent(JSON.stringify(safeTrimmedUuids));
      
      document.cookie = `${GENERATED_IMAGES_COOKIE}=${safeCookieValue}; path=/; expires=${expirationDate.toUTCString()}; secure; samesite=lax`;
    } else {
      document.cookie = `${GENERATED_IMAGES_COOKIE}=${cookieValue}; path=/; expires=${expirationDate.toUTCString()}; secure; samesite=lax`;
    }

    return true;
  } catch (error) {
    console.error('Failed to add UUID to cookie:', error);
    return false;
  }
}

/**
 * Client-side utility to get all UUIDs from the generated images cookie
 */
export function getImageUuidsFromCookie(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const cookies = document.cookie.split(';');
    const generatedImagesCookie = cookies
      .find(cookie => cookie.trim().startsWith(`${GENERATED_IMAGES_COOKIE}=`));

    if (!generatedImagesCookie) {
      return [];
    }

    const cookieValue = generatedImagesCookie.split('=')[1];
    if (!cookieValue) {
      return [];
    }

    const decodedValue = decodeURIComponent(cookieValue);
    const uuids = JSON.parse(decodedValue);

    // Validate that it's an array of strings
    if (!Array.isArray(uuids)) {
      console.warn('Invalid cookie format, expected array');
      return [];
    }

    // Validate UUIDs format (basic validation)
    const validUuids = uuids.filter((uuid: unknown) => {
      return typeof uuid === 'string' && uuid.length >= 32; // Basic UUID length check
    });

    return validUuids;
  } catch (error) {
    console.error('Failed to get UUIDs from cookie:', error);
    return [];
  }
}

/**
 * Client-side utility to clear the generated images cookie
 */
export function clearImageUuidsCookie(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    // Set cookie to expire in the past to delete it
    document.cookie = `${GENERATED_IMAGES_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=lax`;
    return true;
  } catch (error) {
    console.error('Failed to clear cookie:', error);
    return false;
  }
}

/**
 * Server-side utility to get UUIDs from cookie using Next.js cookies API
 * Use this in Server Components, Server Actions, or Route Handlers
 */
export async function getImageUuidsFromServerCookie(): Promise<string[]> {
  if (typeof window !== 'undefined') {
    throw new Error('getImageUuidsFromServerCookie should only be called on server side');
  }

  try {
    // Dynamic import to avoid issues with Next.js cookies on client
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const generatedImagesCookie = cookieStore.get(GENERATED_IMAGES_COOKIE);

    if (!generatedImagesCookie?.value) {
      return [];
    }

    const decodedValue = decodeURIComponent(generatedImagesCookie.value);
    const uuids = JSON.parse(decodedValue);

    // Validate that it's an array of strings
    if (!Array.isArray(uuids)) {
      console.warn('Invalid cookie format, expected array');
      return [];
    }

    // Validate UUIDs format
    const validUuids = uuids.filter((uuid: unknown) => {
      return typeof uuid === 'string' && uuid.length >= 32;
    });

    return validUuids;
  } catch (error) {
    console.error('Failed to get UUIDs from server cookie:', error);
    return [];
  }
}

/**
 * Server-side utility to clear the generated images cookie
 * Use this in Server Actions or Route Handlers
 */
export async function clearImageUuidsServerCookie(): Promise<boolean> {
  if (typeof window !== 'undefined') {
    throw new Error('clearImageUuidsServerCookie should only be called on server side');
  }

  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    cookieStore.delete(GENERATED_IMAGES_COOKIE);
    return true;
  } catch (error) {
    console.error('Failed to clear server cookie:', error);
    return false;
  }
}

/**
 * Utility to check if cookies are enabled in the browser
 */
export function areCookiesEnabled(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    // Try to set a test cookie
    const testCookieName = 'cookie_test';
    document.cookie = `${testCookieName}=test; path=/; secure; samesite=lax`;
    
    // Check if we can read it back
    const cookieEnabled = document.cookie.includes(`${testCookieName}=test`);
    
    // Clean up test cookie
    if (cookieEnabled) {
      document.cookie = `${testCookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=lax`;
    }
    
    return cookieEnabled;
  } catch (error) {
    console.error('Failed to test cookie support:', error);
    return false;
  }
}

/**
 * Get the count of stored UUIDs without loading all of them
 */
export function getStoredImageCount(): number {
  return getImageUuidsFromCookie().length;
}

/**
 * Remove a specific UUID from the cookie
 */
export function removeImageUuidFromCookie(uuidToRemove: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const currentUuids = getImageUuidsFromCookie();
    const filteredUuids = currentUuids.filter(uuid => uuid !== uuidToRemove);

    if (filteredUuids.length === currentUuids.length) {
      // UUID not found, nothing to remove
      return true;
    }

    // Update cookie with filtered list
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + COOKIE_EXPIRATION_DAYS);

    const cookieValue = encodeURIComponent(JSON.stringify(filteredUuids));
    document.cookie = `${GENERATED_IMAGES_COOKIE}=${cookieValue}; path=/; expires=${expirationDate.toUTCString()}; secure; samesite=lax`;

    return true;
  } catch (error) {
    console.error('Failed to remove UUID from cookie:', error);
    return false;
  }
}