-- Add payment tracking fields to images_state table
-- Run this migration manually in your Supabase SQL editor

ALTER TABLE images_state 
ADD COLUMN payment_intent_id TEXT,
ADD COLUMN payment_status TEXT DEFAULT 'pending',
ADD COLUMN payment_amount INTEGER,
ADD COLUMN purchased_at TIMESTAMPTZ;

-- Add index on payment_intent_id for faster lookups
CREATE INDEX idx_images_state_payment_intent_id ON images_state(payment_intent_id);

-- Add index on payment_status for filtering
CREATE INDEX idx_images_state_payment_status ON images_state(payment_status);