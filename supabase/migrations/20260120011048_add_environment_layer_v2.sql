/*
  # Adicionar Camada de Environments (Ambientes) - V2

  ## 1. Nova Hierarquia
    SAAS ADMIN CONSOLE (global)
      └── ORGANIZATION (tenant)
            └── ENVIRONMENT (produção, testes, homologação, sandbox)
                  └── COMPANY/ESTABELECIMENTO
                        └── Dados operacionais

  ## 2. Nova Tabela: environments
  ## 3. Adiciona environment_id apenas em tabelas que já têm organization_id
  ## 4. Atualiza RLS para isolamento total por environment
*/

-- =====================================================
-- 1. CRIAR TABELA ENVIRONMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS environments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'production' CHECK (type IN ('production', 'staging', 'testing', 'sandbox', 'development')),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  data_retention_days INTEGER DEFAULT 365,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_environments_org ON environments(organization_id);
CREATE INDEX IF NOT EXISTS idx_environments_type ON environments(type);
CREATE INDEX IF NOT EXISTS idx_environments_active ON environments(is_active);

ALTER TABLE environments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own organization environments"
  ON environments FOR SELECT
  TO authenticated
  USING (organization_id = get_current_organization_id());

CREATE POLICY "Users can manage own organization environments"
  ON environments FOR ALL
  TO authenticated
  USING (organization_id = get_current_organization_id())
  WITH CHECK (organization_id = get_current_organization_id());

CREATE TRIGGER update_environments_updated_at
  BEFORE UPDATE ON environments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. CRIAR ENVIRONMENT PADRÃO PARA CADA ORG
-- =====================================================

DO $$
DECLARE
  org RECORD;
BEGIN
  FOR org IN SELECT id, slug FROM organizations
  LOOP
    INSERT INTO environments (
      organization_id, name, slug, type, description, is_active
    ) VALUES (
      org.id, 'Produção', 'production', 'production', 'Ambiente de produção principal', true
    ) ON CONFLICT (organization_id, slug) DO NOTHING;
  END LOOP;
END $$;

-- =====================================================
-- 3. FUNÇÃO MELHORADA PARA ADICIONAR environment_id
-- =====================================================

CREATE OR REPLACE FUNCTION add_environment_id_safe(table_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Verifica se tabela existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND tables.table_name = add_environment_id_safe.table_name
  ) THEN
    RETURN;
  END IF;

  -- Verifica se tem organization_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND columns.table_name = add_environment_id_safe.table_name
      AND column_name = 'organization_id'
  ) THEN
    RETURN;
  END IF;

  -- Verifica se environment_id já existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND columns.table_name = add_environment_id_safe.table_name
      AND column_name = 'environment_id'
  ) THEN
    RETURN;
  END IF;

  -- Adiciona coluna
  EXECUTE format('ALTER TABLE %I ADD COLUMN environment_id UUID REFERENCES environments(id)', table_name);

  -- Popula com environment de produção
  EXECUTE format('
    UPDATE %I t
    SET environment_id = (
      SELECT e.id
      FROM environments e
      WHERE e.organization_id = t.organization_id
        AND e.type = ''production''
      LIMIT 1
    )
    WHERE environment_id IS NULL
  ', table_name);

  -- Torna NOT NULL
  EXECUTE format('ALTER TABLE %I ALTER COLUMN environment_id SET NOT NULL', table_name);

  -- Cria índices
  EXECUTE format('CREATE INDEX idx_%I_environment ON %I(environment_id)', table_name, table_name);
  EXECUTE format('CREATE INDEX idx_%I_org_env ON %I(organization_id, environment_id)', table_name, table_name);
END;
$$;

-- =====================================================
-- 4. APLICAR environment_id NAS TABELAS
-- =====================================================

SELECT add_environment_id_safe('users');
SELECT add_environment_id_safe('establishments');
SELECT add_environment_id_safe('carriers');
SELECT add_environment_id_safe('business_partners');
SELECT add_environment_id_safe('orders');
SELECT add_environment_id_safe('invoices_nfe');
SELECT add_environment_id_safe('bills');
SELECT add_environment_id_safe('pickups');
SELECT add_environment_id_safe('ctes');
SELECT add_environment_id_safe('electronic_documents');
SELECT add_environment_id_safe('freight_rates');
SELECT add_environment_id_safe('freight_rate_tables');
SELECT add_environment_id_safe('freight_rate_values');
SELECT add_environment_id_safe('freight_rate_cities');
SELECT add_environment_id_safe('restricted_items');
SELECT add_environment_id_safe('additional_fees');
SELECT add_environment_id_safe('occurrences');
SELECT add_environment_id_safe('rejection_reasons');
SELECT add_environment_id_safe('holidays');
SELECT add_environment_id_safe('reverse_logistics');
SELECT add_environment_id_safe('nps_surveys');
SELECT add_environment_id_safe('nps_responses');
SELECT add_environment_id_safe('nps_email_templates');
SELECT add_environment_id_safe('whatsapp_config');
SELECT add_environment_id_safe('google_maps_config');
SELECT add_environment_id_safe('openai_config');
SELECT add_environment_id_safe('email_outgoing_config');
SELECT add_environment_id_safe('order_notifications');
SELECT add_environment_id_safe('order_notification_templates');
SELECT add_environment_id_safe('pickup_requests');
SELECT add_environment_id_safe('pickup_scheduling');
SELECT add_environment_id_safe('api_keys');
SELECT add_environment_id_safe('change_logs');
SELECT add_environment_id_safe('innovations');
SELECT add_environment_id_safe('innovations_history');
SELECT add_environment_id_safe('suggestions');
SELECT add_environment_id_safe('help_articles');
SELECT add_environment_id_safe('saas_admin_logs');
SELECT add_environment_id_safe('licenses');

-- =====================================================
-- 5. FUNÇÃO HELPER
-- =====================================================

CREATE OR REPLACE FUNCTION get_current_environment_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (auth.jwt() -> 'app_metadata' ->> 'environment_id')::uuid;
END;
$$;

-- =====================================================
-- 6. ATUALIZAR RLS COM ENVIRONMENT
-- =====================================================

CREATE OR REPLACE FUNCTION update_rls_with_env(table_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND tables.table_name = update_rls_with_env.table_name
  ) THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND columns.table_name = update_rls_with_env.table_name
      AND column_name = 'environment_id'
  ) THEN
    RETURN;
  END IF;

  EXECUTE format('DROP POLICY IF EXISTS "Users can view own organization %s" ON %I', table_name, table_name);
  EXECUTE format('DROP POLICY IF EXISTS "Users can manage own organization %s" ON %I', table_name, table_name);
  EXECUTE format('DROP POLICY IF EXISTS "Users can view own env %s" ON %I', table_name, table_name);
  EXECUTE format('DROP POLICY IF EXISTS "Users can manage own env %s" ON %I', table_name, table_name);

  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);

  EXECUTE format('
    CREATE POLICY "Users can view own env %s"
      ON %I FOR SELECT
      TO authenticated
      USING (
        organization_id = get_current_organization_id()
        AND environment_id = get_current_environment_id()
      )
  ', table_name, table_name);

  EXECUTE format('
    CREATE POLICY "Users can manage own env %s"
      ON %I FOR ALL
      TO authenticated
      USING (
        organization_id = get_current_organization_id()
        AND environment_id = get_current_environment_id()
      )
      WITH CHECK (
        organization_id = get_current_organization_id()
        AND environment_id = get_current_environment_id()
      )
  ', table_name, table_name);
END;
$$;

DO $$
DECLARE
  tbl TEXT;
  tables_list TEXT[] := ARRAY[
    'users', 'establishments', 'carriers', 'business_partners',
    'orders', 'invoices_nfe', 'bills', 'pickups', 'ctes', 'electronic_documents',
    'freight_rates', 'freight_rate_tables', 'freight_rate_values', 'freight_rate_cities',
    'restricted_items', 'additional_fees',
    'occurrences', 'rejection_reasons', 'holidays',
    'reverse_logistics',
    'nps_surveys', 'nps_responses', 'nps_email_templates',
    'whatsapp_config', 'google_maps_config', 'openai_config', 'email_outgoing_config',
    'order_notifications', 'order_notification_templates',
    'pickup_requests', 'pickup_scheduling',
    'api_keys', 'change_logs', 'innovations', 'innovations_history',
    'suggestions', 'help_articles', 'saas_admin_logs', 'licenses'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables_list
  LOOP
    PERFORM update_rls_with_env(tbl);
  END LOOP;
END $$;

-- =====================================================
-- 7. CRIAR ENVIRONMENTS ADICIONAIS PARA ORG DEFAULT
-- =====================================================

DO $$
DECLARE
  default_org_id UUID;
BEGIN
  SELECT id INTO default_org_id FROM organizations WHERE slug = 'default' LIMIT 1;

  IF default_org_id IS NOT NULL THEN
    INSERT INTO environments (organization_id, name, slug, type, description, is_active)
    VALUES (default_org_id, 'Testes', 'testing', 'testing', 'Ambiente para testes', true)
    ON CONFLICT (organization_id, slug) DO NOTHING;

    INSERT INTO environments (organization_id, name, slug, type, description, is_active)
    VALUES (default_org_id, 'Homologação', 'staging', 'staging', 'Ambiente de homologação', true)
    ON CONFLICT (organization_id, slug) DO NOTHING;

    INSERT INTO environments (organization_id, name, slug, type, description, is_active)
    VALUES (default_org_id, 'Sandbox', 'sandbox', 'sandbox', 'Ambiente sandbox', true)
    ON CONFLICT (organization_id, slug) DO NOTHING;
  END IF;
END $$;
