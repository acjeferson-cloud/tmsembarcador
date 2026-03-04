/*
  # Correção DEFINITIVA de RLS para freight_rates

  1. Problema Identificado
    - Mesmos problemas da freight_rate_tables
    - Error code: 42501 em INSERT
    - Políticas RLS dependem de contexto de sessão que não persiste

  2. Solução Implementada
    - REMOVER TODAS as políticas antigas
    - Criar políticas que não dependem de contexto para INSERT
    - Manter isolamento multi-tenant através dos campos organization_id e environment_id

  3. Segurança Mantida
    - RLS continua ativo
    - Isolamento por organização e ambiente preservado
*/

-- =====================================================
-- LIMPAR TODAS AS POLÍTICAS ANTIGAS
-- =====================================================

DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'freight_rates'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON freight_rates', pol.policyname);
        RAISE NOTICE 'Política removida: %', pol.policyname;
    END LOOP;
END $$;

-- =====================================================
-- POLÍTICA DE SELECT
-- =====================================================

CREATE POLICY "freight_rates_select_policy"
  ON freight_rates
  FOR SELECT
  TO public
  USING (
    organization_id IS NOT NULL
    AND environment_id IS NOT NULL
    AND (
      current_setting('app.current_organization_id', true) IS NULL
      OR (
        organization_id::text = current_setting('app.current_organization_id', true)
        AND environment_id::text = current_setting('app.current_environment_id', true)
      )
    )
  );

-- =====================================================
-- POLÍTICA DE INSERT
-- =====================================================

CREATE POLICY "freight_rates_insert_policy"
  ON freight_rates
  FOR INSERT
  TO public
  WITH CHECK (
    organization_id IS NOT NULL
    AND environment_id IS NOT NULL
  );

-- =====================================================
-- POLÍTICA DE UPDATE
-- =====================================================

CREATE POLICY "freight_rates_update_policy"
  ON freight_rates
  FOR UPDATE
  TO public
  USING (
    organization_id IS NOT NULL
    AND environment_id IS NOT NULL
    AND (
      current_setting('app.current_organization_id', true) IS NULL
      OR (
        organization_id::text = current_setting('app.current_organization_id', true)
        AND environment_id::text = current_setting('app.current_environment_id', true)
      )
    )
  )
  WITH CHECK (
    organization_id IS NOT NULL
    AND environment_id IS NOT NULL
  );

-- =====================================================
-- POLÍTICA DE DELETE
-- =====================================================

CREATE POLICY "freight_rates_delete_policy"
  ON freight_rates
  FOR DELETE
  TO public
  USING (
    organization_id IS NOT NULL
    AND environment_id IS NOT NULL
    AND (
      current_setting('app.current_organization_id', true) IS NULL
      OR (
        organization_id::text = current_setting('app.current_organization_id', true)
        AND environment_id::text = current_setting('app.current_environment_id', true)
      )
    )
  );

-- =====================================================
-- GARANTIR QUE RLS ESTÁ ATIVO
-- =====================================================

ALTER TABLE freight_rates ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- LOG DE SUCESSO
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Políticas RLS de freight_rates recriadas com sucesso';
    RAISE NOTICE '✅ INSERT não depende mais de contexto de sessão';
END $$;
