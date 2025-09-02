-- Migration to support cookie-based image storage
-- This allows images to be created without a user_id initially
-- and later claimed by users when they sign in

-- Step 1: Make user_id nullable in images_state table
ALTER TABLE images_state 
ALTER COLUMN user_id DROP NOT NULL;

-- Step 2: Add index on uuid for faster lookups during cookie-to-user migration
-- This helps with the batch operations when migrating cookie UUIDs to user accounts
CREATE INDEX IF NOT EXISTS idx_images_state_uuid ON images_state(uuid);

-- Step 3: Add index on user_id and created_at for efficient queries
-- This optimizes the getUserImages queries for authenticated users
CREATE INDEX IF NOT EXISTS idx_images_state_user_created ON images_state(user_id, created_at DESC);

-- Step 4: Add index for finding unclaimed images (user_id IS NULL)
-- This helps with cleanup operations and analytics
CREATE INDEX IF NOT EXISTS idx_images_state_unclaimed ON images_state(created_at) WHERE user_id IS NULL;

-- Comments for future reference:
-- - Images with user_id = NULL are "unclaimed" cookie-based generations
-- - When users sign in, we batch update these records to set their user_id
-- - Cleanup job should remove unclaimed images older than 30 days
-- - All existing records already have user_id set, so this is backwards compatible