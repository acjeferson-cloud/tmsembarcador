-- Add created_by column to pickups table to track user creator
ALTER TABLE public.pickups ADD COLUMN IF NOT EXISTS created_by integer;