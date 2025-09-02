-- Fix RLS Policies for Cookie-Based Image Storage
-- This script adds support for cookie-based image creation while maintaining security

-- 1. Add policy to allow INSERT with NULL user_id (for cookie-based images)
CREATE POLICY "Allow public to insert cookie images"
ON public.images_state
FOR INSERT
TO public
WITH CHECK (user_id IS NULL);

-- 2. SECURITY FIX: The current "Allow public read by UUID" policy is too permissive
-- It allows anyone to read any image. Let's replace it with a more secure version.

-- First, drop the overly permissive policy
DROP POLICY IF EXISTS "Allow public read by UUID" ON public.images_state;

-- Replace with a policy that allows reading unclaimed images (for cookie users)
-- and own images (for authenticated users)
CREATE POLICY "Allow reading unclaimed images and own images"
ON public.images_state
FOR SELECT
TO public
USING (
  -- Allow reading unclaimed images (user_id IS NULL) - for cookie users
  user_id IS NULL 
  OR 
  -- Allow reading own images - for authenticated users
  user_id = (auth.uid())::text
);

-- 3. Optional: Clean up redundant anonymous INSERT policy if no longer needed
-- (Uncomment the line below if you're sure you don't need anonymous auth anymore)
-- DROP POLICY IF EXISTS "Allow anonymous users to insert images" ON public.images_state;

-- 4. Verification queries (run these after applying the policies to test)
/*
-- Test 1: Check that policies were created
SELECT policyname, cmd, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'images_state' 
ORDER BY cmd, policyname;

-- Test 2: Verify RLS is still enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'images_state';
*/

-- Summary of what this fixes:
-- ✅ Allows inserting records with user_id = NULL (cookie-based images)
-- ✅ Maintains security: users can only read their own images + unclaimed images
-- ✅ Unclaimed images (user_id = NULL) are readable by anyone (needed for cookie functionality)
-- ✅ Once claimed by a user, only that user can read the image
-- ✅ Existing authenticated user flows continue to work
-- ✅ Migration API can update user_id from NULL to real user ID