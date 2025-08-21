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
  state: "in_progress" | "completed" | "failed";
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
  const { data, error } = await supabaseAdmin
    .from("images_state")
    .insert([
      {
        uuid,
        input_bucket_id: inputBucketId,
        state: "in_progress",
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create image state: ${error.message}`);
  }

  return data as ImageState;
};

export const updateImageState = async (
  uuid: string,
  updates: Partial<Pick<ImageState, "state" | "output_bucket_id" | "error_message">>
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

export const getPublicUrl = (bucketName: string, fileName: string) => {
  const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);

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
