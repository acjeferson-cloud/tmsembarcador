-- Migration: Create catalog_items table and add catalog_item_id to restricted_items

CREATE TABLE IF NOT EXISTS public.catalog_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES public.saas_organizations(id) ON DELETE CASCADE,
    environment_id uuid NOT NULL REFERENCES public.saas_environments(id) ON DELETE CASCADE,
    item_code text NOT NULL,
    ean_code text,
    item_description text NOT NULL,
    ncm_code text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(organization_id, environment_id, item_code)
);

CREATE INDEX IF NOT EXISTS idx_catalog_items_org_env ON public.catalog_items(organization_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_catalog_items_ean_code ON public.catalog_items(ean_code);
CREATE INDEX IF NOT EXISTS idx_catalog_items_ncm_code ON public.catalog_items(ncm_code);

-- Enable RLS
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable all for authenticated users on catalog_items"
    ON public.catalog_items FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Alter restricted_items table
ALTER TABLE IF EXISTS public.restricted_items 
ADD COLUMN IF NOT EXISTS catalog_item_id uuid REFERENCES public.catalog_items(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_restricted_items_catalog_item_id ON public.restricted_items(catalog_item_id);

-- Update trigger for catalog_items
CREATE OR REPLACE FUNCTION update_catalog_items_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_catalog_items_updated_at ON public.catalog_items;
CREATE TRIGGER update_catalog_items_updated_at
    BEFORE UPDATE ON public.catalog_items
    FOR EACH ROW
    EXECUTE FUNCTION update_catalog_items_updated_at_column();
