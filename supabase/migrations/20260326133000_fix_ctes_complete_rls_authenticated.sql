-- Fix for missing authenticated RLS policies on ctes_complete and child tables
-- The previous recreate script only added policies for `anon`, blocking logged-in users.

-- 1. Policies for ctes_complete

DROP POLICY IF EXISTS "Enable read access for authenticated" ON public.ctes_complete;
CREATE POLICY "Enable read access for authenticated" ON public.ctes_complete
  FOR SELECT TO authenticated
  USING (
    organization_id = COALESCE(current_setting('app.organization_id', true), organization_id::text)::uuid
    AND environment_id = COALESCE(current_setting('app.environment_id', true), environment_id::text)::uuid
  );

DROP POLICY IF EXISTS "Enable insert for authenticated" ON public.ctes_complete;
CREATE POLICY "Enable insert for authenticated" ON public.ctes_complete
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = COALESCE(current_setting('app.organization_id', true), organization_id::text)::uuid
    AND environment_id = COALESCE(current_setting('app.environment_id', true), environment_id::text)::uuid
  );

DROP POLICY IF EXISTS "Enable update for authenticated" ON public.ctes_complete;
CREATE POLICY "Enable update for authenticated" ON public.ctes_complete
  FOR UPDATE TO authenticated
  USING (
    organization_id = COALESCE(current_setting('app.organization_id', true), organization_id::text)::uuid
    AND environment_id = COALESCE(current_setting('app.environment_id', true), environment_id::text)::uuid
  )
  WITH CHECK (
    organization_id = COALESCE(current_setting('app.organization_id', true), organization_id::text)::uuid
    AND environment_id = COALESCE(current_setting('app.environment_id', true), environment_id::text)::uuid
  );

DROP POLICY IF EXISTS "Enable delete for authenticated" ON public.ctes_complete;
CREATE POLICY "Enable delete for authenticated" ON public.ctes_complete
  FOR DELETE TO authenticated
  USING (
    organization_id = COALESCE(current_setting('app.organization_id', true), organization_id::text)::uuid
    AND environment_id = COALESCE(current_setting('app.environment_id', true), environment_id::text)::uuid
  );

-- 2. Policies for ctes_invoices
DROP POLICY IF EXISTS "Enable all access for authenticated on ctes_invoices" ON public.ctes_invoices;
CREATE POLICY "Enable all access for authenticated on ctes_invoices" ON public.ctes_invoices 
  FOR ALL TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- 3. Policies for ctes_carrier_costs
DROP POLICY IF EXISTS "Enable all access for authenticated on ctes_carrier_costs" ON public.ctes_carrier_costs;
CREATE POLICY "Enable all access for authenticated on ctes_carrier_costs" ON public.ctes_carrier_costs 
  FOR ALL TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Notificar o framework para reler os schemas
NOTIFY pgrst, 'reload schema';
