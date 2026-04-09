-- Migration: Create Freight Spot Negotiations Structure
-- Description: Adds tables for 1:N spot negotiated freights for auditing bypass.

-- Create the main header table for Spot Negotiation
CREATE TABLE IF NOT EXISTS public.freight_spot_negotiations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL,
    environment_id UUID NOT NULL,
    establishment_id UUID NOT NULL,
    carrier_id UUID NOT NULL REFERENCES public.carriers(id),
    agreed_value NUMERIC(10, 2) NOT NULL,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
    valid_to TIMESTAMP WITH TIME ZONE NOT NULL,
    attachment_url TEXT,
    status TEXT NOT NULL DEFAULT 'pendente_faturamento' CHECK (status IN ('pendente_faturamento', 'liquidado', 'cancelado')),
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.freight_spot_negotiations ENABLE ROW LEVEL SECURITY;

-- Add standard RLS Policies for Tenant Isolation (Relaxed for Anon Frontend)
DROP POLICY IF EXISTS "Enable read access for users on freight_spot_negotiations" ON public.freight_spot_negotiations;
DROP POLICY IF EXISTS "Enable insert for users on freight_spot_negotiations" ON public.freight_spot_negotiations;
DROP POLICY IF EXISTS "Enable update for users on freight_spot_negotiations" ON public.freight_spot_negotiations;
DROP POLICY IF EXISTS "Enable delete for users on freight_spot_negotiations" ON public.freight_spot_negotiations;

CREATE POLICY "freight_spot_negotiations_all_access" 
ON public.freight_spot_negotiations 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create the related pivot table for 1:N Invoices
CREATE TABLE IF NOT EXISTS public.freight_spot_invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL,
    environment_id UUID NOT NULL,
    establishment_id UUID NOT NULL,
    negotiation_id UUID NOT NULL REFERENCES public.freight_spot_negotiations(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES public.invoices_nfe(id),
    proportional_cost NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(negotiation_id, invoice_id)
);

-- Enable RLS
ALTER TABLE public.freight_spot_invoices ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies for Pivot Table
DROP POLICY IF EXISTS "Enable read access for users on freight_spot_invoices" ON public.freight_spot_invoices;
DROP POLICY IF EXISTS "Enable insert access for users on freight_spot_invoices" ON public.freight_spot_invoices;
DROP POLICY IF EXISTS "Enable delete access for users on freight_spot_invoices" ON public.freight_spot_invoices;

CREATE POLICY "freight_spot_invoices_all_access" 
ON public.freight_spot_invoices 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create simple Storage Bucket (Ignored if already exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('spot_negotiations_proofs', 'spot_negotiations_proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy allowing anon/auth access to proofs
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'spot_negotiations_proofs' );

DROP POLICY IF EXISTS "Enable Upload" ON storage.objects;
CREATE POLICY "Enable Upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'spot_negotiations_proofs' );

DROP POLICY IF EXISTS "Enable Update" ON storage.objects;
CREATE POLICY "Enable Update" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'spot_negotiations_proofs' );

-- Update CTEs Complete Table to support Spot tracking reference
ALTER TABLE public.ctes_complete ADD COLUMN IF NOT EXISTS spot_negotiation_id UUID REFERENCES public.freight_spot_negotiations(id);
