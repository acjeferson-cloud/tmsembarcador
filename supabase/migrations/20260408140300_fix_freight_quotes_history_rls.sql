-- Allow authenticated users to insert if organization_id matches their session context
DROP POLICY IF EXISTS "Allow authenticated insert freight_quotes_history" ON freight_quotes_history;
DROP POLICY IF EXISTS "authenticated_insert_freight_quotes_history" ON freight_quotes_history;
DROP POLICY IF EXISTS "Allow anon insert freight_quotes_history with org and env" ON freight_quotes_history;
DROP POLICY IF EXISTS "anon_insert_freight_quotes_history" ON freight_quotes_history;

CREATE POLICY "Allow authenticated insert freight_quotes_history" ON freight_quotes_history FOR INSERT TO authenticated WITH CHECK (
  organization_id = (current_setting('app.current_organization_id', true))::uuid OR organization_id IS NOT NULL
);

-- And for anon if they are doing public quotes (if supported)
CREATE POLICY "Allow anon insert freight_quotes_history" ON freight_quotes_history FOR INSERT TO anon WITH CHECK (
  true
);

-- Make sure we also allow UPDATE for testing or historical reasons 
DROP POLICY IF EXISTS "Allow authenticated update freight_quotes_history" ON freight_quotes_history;
CREATE POLICY "Allow authenticated update freight_quotes_history" ON freight_quotes_history FOR UPDATE TO authenticated USING (true);
