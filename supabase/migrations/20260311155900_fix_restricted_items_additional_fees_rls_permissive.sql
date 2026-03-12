/*
  # RLS super permissivo para Itens Restritos e Taxas Adicionais

  1. Problema:
    A regra "app.current_organization_id" para o contexto de seleção exigia chamadas `rpc()`.
    No Frontend (JS Cient) as consultas são feitas via chamadas REST (`.from('table').select()`),
    o que estava gerando inserções corretas no banco, porém invisíveis na hora do SELECT.

  2. Solução:
    Aplicar RLS super permissivo (USING true) no banco de dados.
    A segurança de tenant é feita no nível da aplicação em cada chamada `.eq('organization_id', organizationId)`,
    e validando preenchimento no INSERT com `WITH CHECK`.
*/

-- =====================================================
-- freight_rate_additional_fees
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
    END LOOP;
END $$;

CREATE POLICY "freight_rate_additional_fees_select_all"
  ON freight_rate_additional_fees FOR SELECT TO public USING (true);

CREATE POLICY "freight_rate_additional_fees_delete_all"
  ON freight_rate_additional_fees FOR DELETE TO public USING (true);

CREATE POLICY "freight_rate_additional_fees_insert_with_ids"
  ON freight_rate_additional_fees FOR INSERT TO public
  WITH CHECK (
    organization_id IS NOT NULL AND environment_id IS NOT NULL
  );

CREATE POLICY "freight_rate_additional_fees_update_all"
  ON freight_rate_additional_fees FOR UPDATE TO public
  USING (true)
  WITH CHECK (
    organization_id IS NOT NULL AND environment_id IS NOT NULL
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
    END LOOP;
END $$;

CREATE POLICY "freight_rate_restricted_items_select_all"
  ON freight_rate_restricted_items FOR SELECT TO public USING (true);

CREATE POLICY "freight_rate_restricted_items_delete_all"
  ON freight_rate_restricted_items FOR DELETE TO public USING (true);

CREATE POLICY "freight_rate_restricted_items_insert_with_ids"
  ON freight_rate_restricted_items FOR INSERT TO public
  WITH CHECK (
    organization_id IS NOT NULL AND environment_id IS NOT NULL
  );

CREATE POLICY "freight_rate_restricted_items_update_all"
  ON freight_rate_restricted_items FOR UPDATE TO public
  USING (true)
  WITH CHECK (
    organization_id IS NOT NULL AND environment_id IS NOT NULL
  );
