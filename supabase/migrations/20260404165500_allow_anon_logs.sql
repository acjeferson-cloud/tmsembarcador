DROP POLICY IF EXISTS "Users can view sync logs of their organization" ON public.erp_sync_logs;
DROP POLICY IF EXISTS "Allow anon insert" ON public.erp_sync_logs;

DROP POLICY IF EXISTS "Allow authenticated select logs" ON public.erp_sync_logs;
CREATE POLICY "Allow authenticated select logs" ON public.erp_sync_logs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow anon insert logs" ON public.erp_sync_logs;
CREATE POLICY "Allow anon insert logs" ON public.erp_sync_logs FOR INSERT TO anon WITH CHECK (true);
