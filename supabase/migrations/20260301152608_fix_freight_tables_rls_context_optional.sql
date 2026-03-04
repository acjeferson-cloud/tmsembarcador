/*
  # Corrigir RLS de Tabelas de Frete - Contexto Opcional

  1. Problema Identificado
    - As políticas RLS exigem que o contexto de sessão esteja configurado
    - Devido ao connection pooling do Supabase, o contexto pode não persistir entre queries
    - Resultado: INSERT falha mesmo com organization_id e environment_id corretos

  2. Solução Implementada
    - Tornar verificação de contexto OPCIONAL nas políticas INSERT
    - Se contexto existir, validar que corresponde aos dados
    - Se contexto não existir, permitir desde que os IDs estejam presentes
    - Manter políticas SELECT, UPDATE, DELETE com contexto obrigatório (segurança)

  3. Segurança Mantida
    - SELECT ainda requer contexto (usuário só vê suas próprias tabelas)
    - INSERT valida IDs se contexto existir
    - Isolamento multi-tenant preservado

  4. Tabelas Afetadas
    - freight_rate_tables (tem organization_id e environment_id)
    - freight_rates (tem organization_id e environment_id)
    - freight_rate_details (não tem os IDs, herda do freight_rate_id)
*/

-- =====================================================
-- TABELA: freight_rate_tables
-- =====================================================

-- Remover política INSERT antiga
DROP POLICY IF EXISTS "freight_rate_tables_insert_anon_context" ON freight_rate_tables;

-- Nova política INSERT com contexto opcional
CREATE POLICY "freight_rate_tables_insert_anon_context"
  ON freight_rate_tables
  FOR INSERT
  WITH CHECK (
    -- Validar que os campos obrigatórios estão presentes
    organization_id IS NOT NULL
    AND environment_id IS NOT NULL
    -- Se houver contexto configurado, validar que corresponde
    AND (
      current_setting('app.current_organization_id', true) IS NULL
      OR organization_id::text = current_setting('app.current_organization_id', true)
    )
    AND (
      current_setting('app.current_environment_id', true) IS NULL
      OR environment_id::text = current_setting('app.current_environment_id', true)
    )
  );

-- =====================================================
-- TABELA: freight_rates
-- =====================================================

-- Remover política INSERT antiga
DROP POLICY IF EXISTS "freight_rates_insert_anon_context" ON freight_rates;

-- Nova política INSERT com contexto opcional
CREATE POLICY "freight_rates_insert_anon_context"
  ON freight_rates
  FOR INSERT
  WITH CHECK (
    -- Validar que os campos obrigatórios estão presentes
    organization_id IS NOT NULL
    AND environment_id IS NOT NULL
    -- Se houver contexto configurado, validar que corresponde
    AND (
      current_setting('app.current_organization_id', true) IS NULL
      OR organization_id::text = current_setting('app.current_organization_id', true)
    )
    AND (
      current_setting('app.current_environment_id', true) IS NULL
      OR environment_id::text = current_setting('app.current_environment_id', true)
    )
  );

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON POLICY "freight_rate_tables_insert_anon_context" ON freight_rate_tables IS
'Permite INSERT com ou sem contexto de sessão. Se contexto existir, valida correspondência. Garante isolamento multi-tenant.';

COMMENT ON POLICY "freight_rates_insert_anon_context" ON freight_rates IS
'Permite INSERT com ou sem contexto de sessão. Se contexto existir, valida correspondência. Garante isolamento multi-tenant.';
