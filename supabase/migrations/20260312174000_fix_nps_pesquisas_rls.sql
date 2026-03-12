-- Drop existing restrictive policies for NPS tables
DROP POLICY IF EXISTS "Users can view NPS surveys from their org/env" ON nps_pesquisas_cliente;
DROP POLICY IF EXISTS "Anon can view NPS surveys with context" ON nps_pesquisas_cliente;
DROP POLICY IF EXISTS "Public can view NPS survey by token" ON nps_pesquisas_cliente;
DROP POLICY IF EXISTS "Users can insert NPS surveys in their org/env" ON nps_pesquisas_cliente;
DROP POLICY IF EXISTS "Anon can insert NPS surveys with context" ON nps_pesquisas_cliente;
DROP POLICY IF EXISTS "Users can update NPS surveys in their org/env" ON nps_pesquisas_cliente;
DROP POLICY IF EXISTS "Anon can update NPS surveys with context" ON nps_pesquisas_cliente;
DROP POLICY IF EXISTS "Public can update NPS survey response by token" ON nps_pesquisas_cliente;
DROP POLICY IF EXISTS "nps_pesquisas_cliente_isolation_select" ON nps_pesquisas_cliente;
DROP POLICY IF EXISTS "nps_pesquisas_cliente_isolation_insert" ON nps_pesquisas_cliente;
DROP POLICY IF EXISTS "nps_pesquisas_cliente_isolation_update" ON nps_pesquisas_cliente;
DROP POLICY IF EXISTS "nps_pesquisas_cliente_isolation_delete" ON nps_pesquisas_cliente;

DROP POLICY IF EXISTS "Users can view internal evaluations from their org/env" ON nps_avaliacoes_internas;
DROP POLICY IF EXISTS "Anon can view internal evaluations with context" ON nps_avaliacoes_internas;
DROP POLICY IF EXISTS "Users can insert internal evaluations in their org/env" ON nps_avaliacoes_internas;
DROP POLICY IF EXISTS "Anon can insert internal evaluations with context" ON nps_avaliacoes_internas;
DROP POLICY IF EXISTS "Users can update internal evaluations in their org/env" ON nps_avaliacoes_internas;
DROP POLICY IF EXISTS "Anon can update internal evaluations with context" ON nps_avaliacoes_internas;

DROP POLICY IF EXISTS "Users can view send history from their org/env" ON nps_historico_envios;
DROP POLICY IF EXISTS "Anon can view send history with context" ON nps_historico_envios;
DROP POLICY IF EXISTS "Users can insert send history in their org/env" ON nps_historico_envios;
DROP POLICY IF EXISTS "Anon can insert send history with context" ON nps_historico_envios;

-- Create permissive policies
CREATE POLICY "anon_all_nps_pesquisas" ON nps_pesquisas_cliente FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_nps_avaliacoes" ON nps_avaliacoes_internas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_nps_historico" ON nps_historico_envios FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Ensure RLS is still enabled, but policies allow access
ALTER TABLE nps_pesquisas_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE nps_avaliacoes_internas ENABLE ROW LEVEL SECURITY;
ALTER TABLE nps_historico_envios ENABLE ROW LEVEL SECURITY;
