-- Migration: Add user tracking and purchase state to images_state table
-- This adds user_id for anonymous user tracking and purchased boolean for payment state

-- Add user_id column to track anonymous users
ALTER TABLE images_state ADD COLUMN user_id TEXT;

-- Add purchased column to track payment state (defaults to false)
ALTER TABLE images_state ADD COLUMN purchased BOOLEAN DEFAULT false;

-- Create index for user_id for faster user-specific queries
CREATE INDEX idx_images_state_user_id ON images_state(user_id);

-- Create composite index for user_id and purchased state for gallery queries
CREATE INDEX idx_images_state_user_purchased ON images_state(user_id, purchased);

-- Enable RLS (currently disabled)
ALTER TABLE images_state ENABLE ROW LEVEL SECURITY;

-- Update RLS policies to allow users to see their own images
-- Drop existing public read policy (none exist since RLS was disabled)
DROP POLICY IF EXISTS "Allow public read on images_state" ON images_state;

-- Allow authenticated users (including anonymous) to read their own images
CREATE POLICY "Allow users to read own images" 
ON images_state FOR SELECT 
USING (user_id = auth.uid()::text);

-- Allow public read for individual UUID lookups (needed for unlock API)
CREATE POLICY "Allow public read by UUID" 
ON images_state FOR SELECT 
USING (true);

-- Update service role policies to continue working
-- (These already exist but ensuring they remain functional)
CREATE POLICY "Allow service role all operations" 
ON images_state FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');