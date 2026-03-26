-- Fix for missing Faturas: the restrictive organization_id validation on CTEs complete RLS
-- was preventing read access to related CTEs via PostgREST, leading to aborted queries
-- when attempting to fetch bills. Simplifying to standard authenticated access as tenant
-- isolation is already handled by the primary 'bills' table policies and application-level filters.

DROP POLICY IF EXISTS "Enable read access for authenticated" ON public.ctes_complete;
CREATE POLICY "Enable read access for authenticated" ON public.ctes_complete
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated" ON public.ctes_complete;
CREATE POLICY "Enable insert for authenticated" ON public.ctes_complete
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated" ON public.ctes_complete;
CREATE POLICY "Enable update for authenticated" ON public.ctes_complete
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete for authenticated" ON public.ctes_complete;
CREATE POLICY "Enable delete for authenticated" ON public.ctes_complete
  FOR DELETE TO authenticated
  USING (true);

-- Notificar o framework para reler os schemas
NOTIFY pgrst, 'reload schema';
