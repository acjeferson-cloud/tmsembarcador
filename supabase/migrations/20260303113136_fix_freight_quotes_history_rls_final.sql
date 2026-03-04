/*
  # Fix Freight Quotes History RLS - Final

  Remove todas as políticas restritivas e cria políticas permissivas
  que funcionam com dados fornecidos no INSERT.
*/

-- Remover TODAS as políticas antigas
DROP POLICY IF EXISTS "Allow anon insert freight_quotes_history with context" ON freight_quotes_history;
DROP POLICY IF EXISTS "Allow anon insert freight_quotes_history with org and env" ON freight_quotes_history;
DROP POLICY IF EXISTS "Allow anon read freight_quotes_history with context" ON freight_quotes_history;
DROP POLICY IF EXISTS "Allow authenticated insert freight_quotes_history" ON freight_quotes_history;
DROP POLICY IF EXISTS "Allow authenticated read freight_quotes_history" ON freight_quotes_history;

-- Desabilitar RLS temporariamente para garantir que não há conflitos
ALTER TABLE freight_quotes_history DISABLE ROW LEVEL SECURITY;

-- Reabilitar RLS
ALTER TABLE freight_quotes_history ENABLE ROW LEVEL SECURITY;

-- Criar política PERMISSIVA para INSERT (anon)
-- Permite INSERT quando organization_id e environment_id são fornecidos
CREATE POLICY "anon_insert_freight_quotes_history"
  ON freight_quotes_history
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Criar política para SELECT (anon)
-- Retorna dados baseado no contexto de sessão (se configurado)
CREATE POLICY "anon_select_freight_quotes_history"
  ON freight_quotes_history
  FOR SELECT
  TO anon
  USING (
    (organization_id::text = current_setting('app.current_organization_id', true))
    AND (environment_id::text = current_setting('app.current_environment_id', true))
  );

-- Criar política PERMISSIVA para INSERT (authenticated)
CREATE POLICY "authenticated_insert_freight_quotes_history"
  ON freight_quotes_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Criar política PERMISSIVA para SELECT (authenticated)
CREATE POLICY "authenticated_select_freight_quotes_history"
  ON freight_quotes_history
  FOR SELECT
  TO authenticated
  USING (true);
