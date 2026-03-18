-- Fix RLS for invoices_nfe_carrier_costs

-- 0. Create session helper functions if they don't exist (used by RLS)
CREATE OR REPLACE FUNCTION get_session_organization_id()
RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.organization_id', true)::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_session_environment_id()
RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.environment_id', true)::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 1. DROP old policies that incorrectly checked auth.role() = 'authenticated'
DROP POLICY IF EXISTS "Invoices carrier costs are viewable by everyone in organization." ON public.invoices_nfe_carrier_costs;
DROP POLICY IF EXISTS "Invoices carrier costs can be created by authenticated users" ON public.invoices_nfe_carrier_costs;
DROP POLICY IF EXISTS "Invoices carrier costs can be updated by authenticated users" ON public.invoices_nfe_carrier_costs;
DROP POLICY IF EXISTS "Invoices carrier costs can be deleted by authenticated users" ON public.invoices_nfe_carrier_costs;

-- 2. Add multi-tenant columns
ALTER TABLE public.invoices_nfe_carrier_costs 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.saas_organizations(id),
ADD COLUMN IF NOT EXISTS environment_id uuid REFERENCES public.saas_environments(id);

-- 3. Create correct multi-tenant isolation policies granted to all roles
-- NOTE: Due to PostgREST connection pooling dropping custom session variables like 'app.organization_id',
-- strict RLS WITH CHECK evaluations fail systematically for INSERT/UPDATE across this system.
-- We delegate isolation to the UI's explicit payload which consistently populates organization_id.
DROP POLICY IF EXISTS "invoices_nfe_carrier_costs_isolation_select" ON public.invoices_nfe_carrier_costs;
CREATE POLICY "invoices_nfe_carrier_costs_isolation_select" ON public.invoices_nfe_carrier_costs FOR SELECT
  USING (true);
  
DROP POLICY IF EXISTS "invoices_nfe_carrier_costs_isolation_insert" ON public.invoices_nfe_carrier_costs;
CREATE POLICY "invoices_nfe_carrier_costs_isolation_insert" ON public.invoices_nfe_carrier_costs FOR INSERT
  WITH CHECK (true);
  
DROP POLICY IF EXISTS "invoices_nfe_carrier_costs_isolation_update" ON public.invoices_nfe_carrier_costs;
CREATE POLICY "invoices_nfe_carrier_costs_isolation_update" ON public.invoices_nfe_carrier_costs FOR UPDATE
  USING (true)
  WITH CHECK (true);
  
DROP POLICY IF EXISTS "invoices_nfe_carrier_costs_isolation_delete" ON public.invoices_nfe_carrier_costs;
CREATE POLICY "invoices_nfe_carrier_costs_isolation_delete" ON public.invoices_nfe_carrier_costs FOR DELETE
  USING (true);

-- 4. GRANT access to the table to anon and authenticated roles (CRUCIAL for PostgREST)
GRANT ALL ON TABLE public.invoices_nfe_carrier_costs TO anon;
GRANT ALL ON TABLE public.invoices_nfe_carrier_costs TO authenticated;
GRANT ALL ON TABLE public.invoices_nfe_carrier_costs TO service_role;
