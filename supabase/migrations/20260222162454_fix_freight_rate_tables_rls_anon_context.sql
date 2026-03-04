/*
  # Corrigir RLS da freight_rate_tables para permitir anônimo com context

  1. Alterações
    - Remove políticas antigas restritivas
    - Cria novas políticas que permitem acesso via session context
    - Suporta operações via cliente anônimo quando context está configurado

  2. Segurança
    - Mantém isolamento por organization_id e environment_id
    - Valida context antes de permitir operações
*/

-- Remover políticas antigas
DROP POLICY IF EXISTS "freight_rate_tables_select_policy" ON freight_rate_tables;
DROP POLICY IF EXISTS "freight_rate_tables_insert_policy" ON freight_rate_tables;
DROP POLICY IF EXISTS "freight_rate_tables_update_policy" ON freight_rate_tables;
DROP POLICY IF EXISTS "freight_rate_tables_delete_policy" ON freight_rate_tables;

-- Política de SELECT (permite acesso via session context)
CREATE POLICY "freight_rate_tables_select_anon_context"
  ON freight_rate_tables
  FOR SELECT
  USING (
    current_setting('app.current_organization_id', true) IS NOT NULL
    AND current_setting('app.current_environment_id', true) IS NOT NULL
    AND organization_id::text = current_setting('app.current_organization_id', true)
    AND environment_id::text = current_setting('app.current_environment_id', true)
  );

-- Política de INSERT (permite criação via session context)
CREATE POLICY "freight_rate_tables_insert_anon_context"
  ON freight_rate_tables
  FOR INSERT
  WITH CHECK (
    current_setting('app.current_organization_id', true) IS NOT NULL
    AND current_setting('app.current_environment_id', true) IS NOT NULL
    AND organization_id::text = current_setting('app.current_organization_id', true)
    AND environment_id::text = current_setting('app.current_environment_id', true)
  );

-- Política de UPDATE (permite atualização via session context)
CREATE POLICY "freight_rate_tables_update_anon_context"
  ON freight_rate_tables
  FOR UPDATE
  USING (
    current_setting('app.current_organization_id', true) IS NOT NULL
    AND current_setting('app.current_environment_id', true) IS NOT NULL
    AND organization_id::text = current_setting('app.current_organization_id', true)
    AND environment_id::text = current_setting('app.current_environment_id', true)
  )
  WITH CHECK (
    current_setting('app.current_organization_id', true) IS NOT NULL
    AND current_setting('app.current_environment_id', true) IS NOT NULL
    AND organization_id::text = current_setting('app.current_organization_id', true)
    AND environment_id::text = current_setting('app.current_environment_id', true)
  );

-- Política de DELETE (permite exclusão via session context)
CREATE POLICY "freight_rate_tables_delete_anon_context"
  ON freight_rate_tables
  FOR DELETE
  USING (
    current_setting('app.current_organization_id', true) IS NOT NULL
    AND current_setting('app.current_environment_id', true) IS NOT NULL
    AND organization_id::text = current_setting('app.current_organization_id', true)
    AND environment_id::text = current_setting('app.current_environment_id', true)
  );
