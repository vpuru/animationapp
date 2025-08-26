import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  if (typeof window === 'undefined') {
    // Only throw on server-side, not client-side
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
  }
}

if (!supabaseAnonKey) {
  if (typeof window === 'undefined') {
    // Only throw on server-side, not client-side
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable");
  }
}

// Client-side Supabase client (uses anon key, runs in browser)
export function createSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Singleton instance for client-side usage  
let _supabaseClient: ReturnType<typeof createSupabaseClient> | null = null;

export function getSupabaseClient(): ReturnType<typeof createSupabaseClient> {
  if (!_supabaseClient) {
    _supabaseClient = createSupabaseClient();
  }
  return _supabaseClient!;
}

// Server-only admin client (only use in API routes)
let _supabaseAdmin: ReturnType<typeof createClient> | null = null;

export const getSupabaseAdmin = () => {
  if (typeof window !== 'undefined') {
    throw new Error('Admin client should not be used on the client side');
  }
  
  if (!_supabaseAdmin) {
    const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      throw new Error('Service role key not available');
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('Supabase URL not available');
    }
    
    _supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  
  return _supabaseAdmin;
};


// Types for our database tables
export interface ImageState {
  uuid: string;
  input_bucket_id: string;
  output_bucket_id: string | null;
  preview_bucket_id: string | null;
  error_message: string | null;
  user_id: string | null;
  purchased: boolean;
  payment_intent_id: string | null;
  payment_status: string | null;
  payment_amount: number | null;
  purchased_at: string | null;
  created_at: string;
  updated_at: string;
}

// Utility functions for common operations
export const uploadToInputBucket = async (file: File, fileName: string) => {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase.storage.from("input_images").upload(fileName, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  return data;
};

export const createImageState = async (uuid: string, inputBucketId: string, userId: string) => {
  const supabase = getSupabaseClient();
  
  // First, try to insert a new record
  const { data: insertData, error: insertError } = await supabase
    .from("images_state")
    .insert({
      uuid,
      input_bucket_id: inputBucketId,
      user_id: userId,
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
  updates: Partial<Pick<ImageState, "output_bucket_id" | "preview_bucket_id" | "error_message" | "purchased" | "payment_intent_id" | "payment_status" | "payment_amount" | "purchased_at">>
) => {
  const admin = getSupabaseAdmin();
  
  const { data, error } = await admin
    .from("images_state")
    .update(updates)
    .eq("uuid", uuid)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update image state: ${error.message}`);
  }

  return data as unknown as ImageState;
};

export const getImageState = async (uuid: string) => {
  const supabase = getSupabaseClient();
  
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
  const admin = getSupabaseAdmin();
  
  const { data, error } = await admin.storage.from("input_images").download(fileName);

  if (error) {
    throw new Error(`Download failed: ${error.message}`);
  }

  return data;
};

export const uploadToOutputBucket = async (fileName: string, file: Blob) => {
  const admin = getSupabaseAdmin();
  
  const { data, error } = await admin.storage.from("output_images").upload(fileName, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    throw new Error(`Upload to output bucket failed: ${error.message}`);
  }

  return data;
};

export const uploadToPreviewBucket = async (fileName: string, file: Blob) => {
  const admin = getSupabaseAdmin();
  
  const { data, error } = await admin.storage
    .from("preview_images")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload to preview bucket failed: ${error.message}`);
  }

  return data;
};

export const getPublicUrl = (uuid: string) => {
  const supabase = getSupabaseClient();
  
  const outputBucketId = `${uuid}_ghibli.png`;
  const { data } = supabase.storage.from("output_images").getPublicUrl(outputBucketId);

  return data.publicUrl;
};

export const getPreviewUrl = (uuid: string) => {
  const supabase = getSupabaseClient();
  
  const previewBucketId = `${uuid}.png`;
  const { data } = supabase.storage.from("preview_images").getPublicUrl(previewBucketId);

  return data.publicUrl;
};

export const getImageUrl = (image: ImageState): string | null => {
  if (image.purchased && image.output_bucket_id) {
    return `output_images/${image.output_bucket_id}`;
  } else if (image.preview_bucket_id) {
    return `preview_images/${image.preview_bucket_id}`;
  }
  return null;
};

export const getImageDownloadUrl = (image: ImageState): string | null => {
  const supabase = getSupabaseClient();
  
  if (image.purchased && image.output_bucket_id) {
    // Return full Supabase URL for purchased output image download
    const { data } = supabase.storage.from("output_images").getPublicUrl(image.output_bucket_id);
    return data.publicUrl;
  } else if (image.preview_bucket_id) {
    // Return full Supabase URL for preview image download
    const { data } = supabase.storage.from("preview_images").getPublicUrl(image.preview_bucket_id);
    return data.publicUrl;
  }
  return null;
};

export const getUserImages = async (userId: string): Promise<ImageState[]> => {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from("images_state")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to get user images: ${error.message}`);
  }

  return data as ImageState[];
};

// Validation helpers
export const validateImageFile = (file: File) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.heic'];

  if (file.size > maxSize) {
    throw new Error("File size must be less than 10MB");
  }

  // Check both MIME type and file extension for better HEIC support
  const fileName = file.name.toLowerCase();
  const hasValidType = allowedTypes.includes(file.type);
  const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));

  if (!hasValidType && !hasValidExtension) {
    throw new Error("File must be a JPEG, PNG, WebP, or HEIC image");
  }

  return true;
};

// Payment-related functions
export const validateImageForPayment = async (uuid: string): Promise<ImageState> => {
  const admin = getSupabaseAdmin();
  
  const { data: imageState, error } = await admin
    .from('images_state')
    .select('*')
    .eq('uuid', uuid)
    .single();

  if (error || !imageState) {
    throw new Error('Image not found');
  }

  if (!imageState.preview_bucket_id) {
    throw new Error('Image not ready for purchase');
  }

  if (imageState.purchased) {
    throw new Error('Image already purchased');
  }

  return imageState as unknown as ImageState;
};

export const createPaymentIntent = async (uuid: string, paymentIntentId: string, amount: number) => {
  const admin = getSupabaseAdmin();
  
  const { error } = await admin
    .from('images_state')
    .update({
      payment_intent_id: paymentIntentId,
      payment_status: 'pending',
      payment_amount: amount,
    })
    .eq('uuid', uuid);

  if (error) {
    throw new Error(`Failed to update image state with payment intent: ${error.message}`);
  }
};

export const verifyPaymentAndUnlock = async (uuid: string, paymentIntentId: string) => {
  const admin = getSupabaseAdmin();
  
  // First verify the payment intent matches the image
  const imageState = await getImageState(uuid);
  if (!imageState) {
    throw new Error('Image not found');
  }

  if (imageState.payment_intent_id !== paymentIntentId) {
    throw new Error('Payment intent does not match this image');
  }

  // Update the image as purchased
  const { error } = await admin
    .from('images_state')
    .update({
      purchased: true,
      payment_status: 'succeeded',
      purchased_at: new Date().toISOString(),
    })
    .eq('uuid', uuid);

  if (error) {
    throw new Error(`Failed to unlock image: ${error.message}`);
  }

  return imageState;
};
