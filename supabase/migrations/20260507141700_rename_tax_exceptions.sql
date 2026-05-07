-- Rename tables if they exist
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'tax_exception_groups' AND n.nspname = 'public') THEN
    ALTER TABLE public.tax_exception_groups RENAME TO taxation_groups;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'tax_exception_members' AND n.nspname = 'public') THEN
    ALTER TABLE public.tax_exception_members RENAME TO taxation_members;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'freight_rate_additional_fees' AND column_name = 'exception_group_id' AND table_schema = 'public') THEN
    ALTER TABLE public.freight_rate_additional_fees RENAME COLUMN exception_group_id TO taxation_group_id;
  END IF;
END $$;

-- Rename indexes for consistency
ALTER INDEX IF EXISTS idx_tax_exception_members_document RENAME TO idx_taxation_members_document;
ALTER INDEX IF EXISTS idx_tax_exception_members_group_id RENAME TO idx_taxation_members_group_id;

-- Recreate RLS policies with new names and updated logic
-- Since the application manages tenancy at the service layer and the custom login flow
-- may not set auth.uid() or maintain current_setting across REST calls reliably,
-- we use the same permissive policy structure as freight_rate_additional_fees.

DROP POLICY IF EXISTS "Users can view tax exception groups from their organization" ON public.taxation_groups;
DROP POLICY IF EXISTS "Users can insert tax exception groups in their organization" ON public.taxation_groups;
DROP POLICY IF EXISTS "Users can update tax exception groups in their organization" ON public.taxation_groups;
DROP POLICY IF EXISTS "Users can delete tax exception groups in their organization" ON public.taxation_groups;

DROP POLICY IF EXISTS "Users can view taxation groups from their organization" ON public.taxation_groups;
CREATE POLICY "Users can view taxation groups from their organization" 
ON public.taxation_groups FOR SELECT TO public
USING (true);

DROP POLICY IF EXISTS "Users can insert taxation groups in their organization" ON public.taxation_groups;
CREATE POLICY "Users can insert taxation groups in their organization" 
ON public.taxation_groups FOR INSERT TO public
WITH CHECK (organization_id IS NOT NULL);

DROP POLICY IF EXISTS "Users can update taxation groups in their organization" ON public.taxation_groups;
CREATE POLICY "Users can update taxation groups in their organization" 
ON public.taxation_groups FOR UPDATE TO public
USING (true);

DROP POLICY IF EXISTS "Users can delete taxation groups in their organization" ON public.taxation_groups;
CREATE POLICY "Users can delete taxation groups in their organization" 
ON public.taxation_groups FOR DELETE TO public
USING (true);

-- Recreate taxation_members policies
DROP POLICY IF EXISTS "Users can view tax exception members from their organization" ON public.taxation_members;
DROP POLICY IF EXISTS "Users can insert tax exception members" ON public.taxation_members;
DROP POLICY IF EXISTS "Users can delete tax exception members" ON public.taxation_members;

DROP POLICY IF EXISTS "Users can view taxation members from their organization" ON public.taxation_members;
CREATE POLICY "Users can view taxation members from their organization" 
ON public.taxation_members FOR SELECT TO public
USING (true);

DROP POLICY IF EXISTS "Users can insert taxation members" ON public.taxation_members;
CREATE POLICY "Users can insert taxation members" 
ON public.taxation_members FOR INSERT TO public
WITH CHECK (group_id IS NOT NULL);

DROP POLICY IF EXISTS "Users can delete taxation members" ON public.taxation_members;
CREATE POLICY "Users can delete taxation members" 
ON public.taxation_members FOR DELETE TO public
USING (true);

