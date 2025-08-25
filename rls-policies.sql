-- RLS Policies for images_state table
-- Apply these policies via Supabase UI to fix the INSERT violation error

-- 1. Allow authenticated users to insert their own image records
CREATE POLICY "Allow users to insert own images" 
ON public.images_state 
FOR INSERT 
TO public 
WITH CHECK (user_id = (auth.uid())::text);

-- 2. Allow anonymous users to insert image records
-- This allows anonymous users (who have auth.uid() set) to create records
CREATE POLICY "Allow anonymous users to insert images" 
ON public.images_state 
FOR INSERT 
TO anon 
WITH CHECK (user_id = (auth.uid())::text AND user_id IS NOT NULL);

-- Optional: Add UPDATE policy for users to update their own records
-- (This might be needed if users update their own image states)
CREATE POLICY "Allow users to update own images" 
ON public.images_state 
FOR UPDATE 
TO public 
USING (user_id = (auth.uid())::text)
WITH CHECK (user_id = (auth.uid())::text);

-- Note: The current SELECT policies are already sufficient:
-- - "Allow users to read own images" - for reading own data
-- - "Allow public read by UUID" - for public access by UUID
-- - "Allow service role all operations" - for server operations