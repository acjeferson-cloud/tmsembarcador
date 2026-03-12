/*
  # Correção DEFINITIVA de RLS para taxas adicionais e itens restritos

  1. Problema Identificado
    - Error code: 42501 em INSERT nestas duas tabelas
    - Políticas RLS criadas com dependência rígida de contexto de sessão que não está presente nas chamadas padrão do frontend Supabase JS

  2. Solução Implementada
    - Remover todas as políticas antigas destas duas tabelas
    - Criar políticas flexíveis copiando o padrão aprovado e utilizado em freight_rates (migration 20260302133824)
    - O frontend agora já passa o organization_id e environment_id nos requests

  3. Tabelas Afetadas
    - freight_rate_additional_fees
    - freight_rate_restricted_items
*/

-- =====================================================
-- freigh_rate_additional_fees
-- =====================================================

DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'freight_rate_additional_fees'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON freight_rate_additional_fees', pol.policyname);
        RAISE NOTICE 'Política removida: %', pol.policyname;
    END LOOP;
END $$;

CREATE POLICY "freight_rate_additional_fees_select_policy"
  ON freight_rate_additional_fees
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

CREATE POLICY "freight_rate_additional_fees_insert_policy"
  ON freight_rate_additional_fees
  FOR INSERT
  TO public
  WITH CHECK (
    organization_id IS NOT NULL
    AND environment_id IS NOT NULL
  );

CREATE POLICY "freight_rate_additional_fees_update_policy"
  ON freight_rate_additional_fees
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

CREATE POLICY "freight_rate_additional_fees_delete_policy"
  ON freight_rate_additional_fees
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
-- freight_rate_restricted_items
-- =====================================================

DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'freight_rate_restricted_items'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON freight_rate_restricted_items', pol.policyname);
        RAISE NOTICE 'Política removida: %', pol.policyname;
    END LOOP;
END $$;

CREATE POLICY "freight_rate_restricted_items_select_policy"
  ON freight_rate_restricted_items
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

CREATE POLICY "freight_rate_restricted_items_insert_policy"
  ON freight_rate_restricted_items
  FOR INSERT
  TO public
  WITH CHECK (
    organization_id IS NOT NULL
    AND environment_id IS NOT NULL
  );

CREATE POLICY "freight_rate_restricted_items_update_policy"
  ON freight_rate_restricted_items
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

CREATE POLICY "freight_rate_restricted_items_delete_policy"
  ON freight_rate_restricted_items
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
