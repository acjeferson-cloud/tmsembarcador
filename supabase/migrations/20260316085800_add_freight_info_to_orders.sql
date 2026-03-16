-- Migration to add freight details to orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS weight numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS volume_qty integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS cubic_meters numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS freight_results jsonb,
ADD COLUMN IF NOT EXISTS best_carrier_id uuid;
