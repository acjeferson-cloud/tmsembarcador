-- Create "pickup-proofs" bucket for storing pickup photos and signatures
INSERT INTO storage.buckets (id, name, public)
VALUES ('pickup-proofs', 'pickup-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS (already enabled on storage.objects, but ensuring policies are applied)
-- Remove existing policies if they exist to allow clean recreation
DROP POLICY IF EXISTS "Public Access for pickup-proofs images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to pickup-proofs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update pickup-proofs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete from pickup-proofs" ON storage.objects;

-- RLS Policies for pickup-proofs bucket
CREATE POLICY "Public Access for pickup-proofs images"
ON storage.objects FOR SELECT
USING (bucket_id = 'pickup-proofs');

CREATE POLICY "Authenticated users can upload to pickup-proofs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'pickup-proofs');

CREATE POLICY "Authenticated users can update pickup-proofs"
ON storage.objects FOR UPDATE
USING (bucket_id = 'pickup-proofs');

CREATE POLICY "Authenticated users can delete from pickup-proofs"
ON storage.objects FOR DELETE
USING (bucket_id = 'pickup-proofs');

-- Create pickup_proofs table if it does not exist
CREATE TABLE IF NOT EXISTS public.pickup_proofs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pickup_id uuid NOT NULL REFERENCES public.pickups(id) ON DELETE CASCADE,
  collected_at timestamp with time zone,
  collector_name text NOT NULL,
  collector_document text,
  driver_name text,
  vehicle_plate text,
  observations text,
  photo_1_url text,
  photo_2_url text,
  photo_3_url text,
  signature_url text,
  signature_date timestamp with time zone,
  legal_terms_accepted boolean NOT NULL DEFAULT false,
  created_by integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security (RLS) on the table
ALTER TABLE public.pickup_proofs ENABLE ROW LEVEL SECURITY;

-- Remove existing policies if any
DROP POLICY IF EXISTS "Everyone can view pickup_proofs" ON public.pickup_proofs;
DROP POLICY IF EXISTS "Everyone can insert pickup_proofs" ON public.pickup_proofs;
DROP POLICY IF EXISTS "Everyone can update pickup_proofs" ON public.pickup_proofs;
DROP POLICY IF EXISTS "Everyone can delete pickup_proofs" ON public.pickup_proofs;

-- Create permissive policies for pickup_proofs
CREATE POLICY "Everyone can view pickup_proofs" ON public.pickup_proofs
  FOR SELECT USING (true);

CREATE POLICY "Everyone can insert pickup_proofs" ON public.pickup_proofs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Everyone can update pickup_proofs" ON public.pickup_proofs
  FOR UPDATE USING (true);

CREATE POLICY "Everyone can delete pickup_proofs" ON public.pickup_proofs
  FOR DELETE USING (true);
