import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
}

if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable");
}

// Client-side Supabase client (uses anon key, runs in browser)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client (uses service role key, bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Types for our database tables
export interface ImageState {
  uuid: string;
  input_bucket_id: string;
  output_bucket_id: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// Utility functions for common operations
export const uploadToInputBucket = async (file: File, fileName: string) => {
  const { data, error } = await supabase.storage.from("input_images").upload(fileName, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  return data;
};

export const createImageState = async (uuid: string, inputBucketId: string) => {
  // First, try to insert a new record
  const { data: insertData, error: insertError } = await supabaseAdmin
    .from("images_state")
    .insert({
      uuid,
      input_bucket_id: inputBucketId,
    })
    .select()
    .single();

  // If insert succeeded, return the new record
  if (!insertError) {
    return insertData as ImageState;
  }

  // If the error is due to duplicate key (UUID already exists), fetch the existing record
  if (insertError.code === "23505") {
    // PostgreSQL unique violation error code
    console.log(`UUID ${uuid} already exists, fetching existing record`);

    const existingRecord = await getImageState(uuid);
    if (existingRecord) {
      return existingRecord;
    }

    // This shouldn't happen, but just in case
    throw new Error(`UUID ${uuid} exists but could not be retrieved`);
  }

  // For any other error, throw it
  throw new Error(`Failed to create image state: ${insertError.message}`);
};

export const updateImageState = async (
  uuid: string,
  updates: Partial<Pick<ImageState, "output_bucket_id" | "error_message">>
) => {
  const { data, error } = await supabaseAdmin
    .from("images_state")
    .update(updates)
    .eq("uuid", uuid)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update image state: ${error.message}`);
  }

  return data as ImageState;
};

export const getImageState = async (uuid: string) => {
  const { data, error } = await supabase.from("images_state").select("*").eq("uuid", uuid).single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    throw new Error(`Failed to get image state: ${error.message}`);
  }

  return data as ImageState;
};

export const downloadFromInputBucket = async (fileName: string) => {
  const { data, error } = await supabaseAdmin.storage.from("input_images").download(fileName);

  if (error) {
    throw new Error(`Download failed: ${error.message}`);
  }

  return data;
};

export const uploadToOutputBucket = async (fileName: string, file: Blob) => {
  const { data, error } = await supabaseAdmin.storage.from("output_images").upload(fileName, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    throw new Error(`Upload to output bucket failed: ${error.message}`);
  }

  return data;
};

export const getPublicUrl = (uuid: string) => {
  const outputBucketId = `${uuid}_ghibli.png`;
  const { data } = supabase.storage.from("output_images").getPublicUrl(outputBucketId);

  return data.publicUrl;
};

// Validation helpers
export const validateImageFile = (file: File) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];

  if (file.size > maxSize) {
    throw new Error("File size must be less than 10MB");
  }

  if (!allowedTypes.includes(file.type)) {
    throw new Error("File must be a JPEG, PNG, WebP, or HEIC image");
  }

  return true;
};
