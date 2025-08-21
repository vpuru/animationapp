# Supabase Setup Instructions

This document contains the SQL commands and configuration steps needed to set up your Supabase project for the headshots application.

## Prerequisites

1. Create a new Supabase project at https://supabase.com
2. Copy your project URL and anon key
3. Copy your service role key (found in Settings → API)

## Environment Variables

Create a `.env.local` file in the root directory with:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
```

## Storage Setup

### 1. Create Storage Buckets

Go to Storage → Buckets in your Supabase dashboard and run these SQL commands in the SQL Editor:

```sql
-- Create input_images bucket for user uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'input_images', 
  'input_images', 
  true, 
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Create output_images bucket for processed images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'output_images', 
  'output_images', 
  true, 
  10485760, -- 10MB limit  
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);
```

### 2. Set Up Storage Policies

**Important:** Storage policies must be created through the Supabase Dashboard UI, not SQL commands.

Go to **Storage → Policies** in your Supabase dashboard and create these policies:

**For input_images bucket:**
1. Click "New Policy" → "Get started quickly" → "Allow access to a bucket"
2. Policy name: `Allow public uploads to input_images`
3. Allowed operation: `INSERT` 
4. Target roles: `public`
5. Bucket ID: `input_images`

6. Create another policy:
   - Policy name: `Allow public reads from input_images`
   - Allowed operation: `SELECT`
   - Target roles: `public` 
   - Bucket ID: `input_images`

7. Create a third policy:
   - Policy name: `Allow service role reads from input_images`
   - Allowed operation: `SELECT`
   - Target roles: `service_role`
   - Bucket ID: `input_images`

**For output_images bucket:**
8. Create policy:
   - Policy name: `Allow service role uploads to output_images`
   - Allowed operation: `INSERT`
   - Target roles: `service_role`
   - Bucket ID: `output_images`

9. Create final policy:
   - Policy name: `Allow public reads from output_images`
   - Allowed operation: `SELECT`
   - Target roles: `public`
   - Bucket ID: `output_images`

## Database Setup

### 1. Create Images State Table

```sql
-- Create the main table to track image processing state
CREATE TABLE images_state (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  input_bucket_id TEXT NOT NULL,
  output_bucket_id TEXT,
  state TEXT CHECK (state IN ('in_progress', 'completed', 'failed')) DEFAULT 'in_progress',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index for faster lookups by UUID
CREATE INDEX idx_images_state_uuid ON images_state(uuid);

-- Create an index for state filtering
CREATE INDEX idx_images_state_state ON images_state(state);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_images_state_updated_at 
  BEFORE UPDATE ON images_state 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

### 2. Set Up RLS Policies for Images State Table

```sql
-- Enable RLS
ALTER TABLE images_state ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read image states (for status checking)
CREATE POLICY "Allow public read on images_state" 
ON images_state FOR SELECT 
USING (true);

-- Only allow service role to insert/update (API operations)
CREATE POLICY "Allow service role insert on images_state" 
ON images_state FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow service role update on images_state" 
ON images_state FOR UPDATE 
USING (auth.role() = 'service_role');
```

## Verification

After running all the above commands, verify your setup:

### 1. Check Buckets
```sql
SELECT * FROM storage.buckets WHERE id IN ('input_images', 'output_images');
```

### 2. Check Policies
```sql
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects';
```

### 3. Test Table
```sql
-- Insert a test record
INSERT INTO images_state (input_bucket_id) VALUES ('test-image.jpg');

-- Check if it was created
SELECT * FROM images_state WHERE input_bucket_id = 'test-image.jpg';

-- Clean up
DELETE FROM images_state WHERE input_bucket_id = 'test-image.jpg';
```

## Security Notes

- The `service_role` key should never be exposed to the client
- Input validation should be performed on both client and server
- File uploads are limited to 10MB and specific image types
- All operations are logged and can be monitored through Supabase dashboard

## Troubleshooting

**If uploads fail:**
1. Check that buckets exist and are public
2. Verify RLS policies are correctly set
3. Check file size and type restrictions

**If API processing fails:**
1. Verify service role key is correct
2. Check that service role has proper permissions
3. Monitor database logs for errors

## Next Steps

After completing this setup:
1. Test file upload to `input_images` bucket
2. Verify database table operations
3. Test the complete flow with a sample image