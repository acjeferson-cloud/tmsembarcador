-- Fix RLS policies for custom anon-based authentication flow

-- Drop restrictive policies
DROP POLICY IF EXISTS "Users can view their own firm's import logs or all if admin" ON public.import_logs;
DROP POLICY IF EXISTS "Users can insert import logs" ON public.import_logs;
DROP POLICY IF EXISTS "Users can update import logs" ON public.import_logs;
DROP POLICY IF EXISTS "Users can view freight adjustments" ON public.freight_adjustments;
DROP POLICY IF EXISTS "Users can insert freight adjustments" ON public.freight_adjustments;

-- Create open policies (Authentication is managed at application level)
CREATE POLICY "Allow all select import_logs" ON public.import_logs FOR SELECT USING (true);
CREATE POLICY "Allow all insert import_logs" ON public.import_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update import_logs" ON public.import_logs FOR UPDATE USING (true);
CREATE POLICY "Allow all delete import_logs" ON public.import_logs FOR DELETE USING (true);

CREATE POLICY "Allow all select freight_adjustments" ON public.freight_adjustments FOR SELECT USING (true);
CREATE POLICY "Allow all insert freight_adjustments" ON public.freight_adjustments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update freight_adjustments" ON public.freight_adjustments FOR UPDATE USING (true);
CREATE POLICY "Allow all delete freight_adjustments" ON public.freight_adjustments FOR DELETE USING (true);

-- Ensure anon role has access
GRANT ALL ON public.import_logs TO anon;
GRANT ALL ON public.freight_adjustments TO anon;
