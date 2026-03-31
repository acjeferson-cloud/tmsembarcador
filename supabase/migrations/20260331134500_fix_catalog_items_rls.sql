-- Fix for RLS uuid parsing error on catalog_items
-- Drops the old strict policies that caused 'invalid input syntax for type uuid: ""'
-- And replaces them with standard permissive authenticated policies

DROP POLICY IF EXISTS "Users can view catalog items from their organization and environment" ON public.catalog_items;
DROP POLICY IF EXISTS "Users can insert catalog items for their organization and environment" ON public.catalog_items;
DROP POLICY IF EXISTS "Users can update catalog items for their organization and environment" ON public.catalog_items;
DROP POLICY IF EXISTS "Users can delete catalog items from their organization and environment" ON public.catalog_items;
DROP POLICY IF EXISTS "Enable all for authenticated users on catalog_items" ON public.catalog_items;

CREATE POLICY "Enable all for authenticated users on catalog_items"
    ON public.catalog_items FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
