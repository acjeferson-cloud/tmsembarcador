/*
  # Adicionar organization_id às Tabelas Existentes

  ## Estratégia
  Verifica se a tabela existe antes de adicionar organization_id
  
  ## Tabelas Cobertas
  - users
  - establishments
  - carriers
  - business_partners
  - orders
  - invoices_nfe
  - bills
  - pickups
  - freight_rates
  - occurrences
  - rejection_reasons
  - holidays
  - countries (opcional - pode ser compartilhado)
  - states (opcional - pode ser compartilhado)
  - cities (opcional - pode ser compartilhado)
*/

-- =====================================================
-- FUNÇÃO AUXILIAR PARA ADICIONAR organization_id
-- =====================================================

CREATE OR REPLACE FUNCTION add_organization_id_to_table(table_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  default_org_id UUID;
BEGIN
  -- Pega o ID da organização padrão
  SELECT id INTO default_org_id FROM organizations WHERE slug = 'default' LIMIT 1;
  
  -- Verifica se a tabela existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND tables.table_name = add_organization_id_to_table.table_name
  ) THEN
    -- Verifica se a coluna já existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND columns.table_name = add_organization_id_to_table.table_name 
        AND column_name = 'organization_id'
    ) THEN
      -- Adiciona coluna
      EXECUTE format('ALTER TABLE %I ADD COLUMN organization_id UUID REFERENCES organizations(id)', table_name);
      
      -- Popula com org padrão
      EXECUTE format('UPDATE %I SET organization_id = $1 WHERE organization_id IS NULL', table_name) USING default_org_id;
      
      -- Torna NOT NULL
      EXECUTE format('ALTER TABLE %I ALTER COLUMN organization_id SET NOT NULL', table_name);
      
      -- Cria índice
      EXECUTE format('CREATE INDEX idx_%I_organization ON %I(organization_id)', table_name, table_name);
      
      RAISE NOTICE 'Added organization_id to %', table_name;
    ELSE
      RAISE NOTICE 'organization_id already exists in %', table_name;
    END IF;
  ELSE
    RAISE NOTICE 'Table % does not exist, skipping', table_name;
  END IF;
END;
$$;

-- =====================================================
-- APLICAR EM TODAS AS TABELAS
-- =====================================================

SELECT add_organization_id_to_table('users');
SELECT add_organization_id_to_table('establishments');
SELECT add_organization_id_to_table('carriers');
SELECT add_organization_id_to_table('business_partners');
SELECT add_organization_id_to_table('orders');
SELECT add_organization_id_to_table('invoices_nfe');
SELECT add_organization_id_to_table('bills');
SELECT add_organization_id_to_table('pickups');
SELECT add_organization_id_to_table('freight_rates');
SELECT add_organization_id_to_table('freight_rate_tables');
SELECT add_organization_id_to_table('freight_rate_values');
SELECT add_organization_id_to_table('freight_rate_cities');
SELECT add_organization_id_to_table('occurrences');
SELECT add_organization_id_to_table('rejection_reasons');
SELECT add_organization_id_to_table('holidays');
SELECT add_organization_id_to_table('reverse_logistics');
SELECT add_organization_id_to_table('nps_surveys');
SELECT add_organization_id_to_table('nps_responses');
SELECT add_organization_id_to_table('whatsapp_config');
SELECT add_organization_id_to_table('google_maps_config');
SELECT add_organization_id_to_table('openai_config');
SELECT add_organization_id_to_table('email_outgoing_config');
SELECT add_organization_id_to_table('api_keys');
SELECT add_organization_id_to_table('change_logs');
SELECT add_organization_id_to_table('innovations');
SELECT add_organization_id_to_table('suggestions');
SELECT add_organization_id_to_table('help_articles');

-- Tabelas de dados geográficos (opcional - podem ser compartilhadas)
-- SELECT add_organization_id_to_table('countries');
-- SELECT add_organization_id_to_table('states');
-- SELECT add_organization_id_to_table('cities');

-- =====================================================
-- ATUALIZAR RLS POLICIES - USERS
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view users in their establishment" ON users;
DROP POLICY IF EXISTS "Users can insert users in their establishment" ON users;
DROP POLICY IF EXISTS "Users can update users in their establishment" ON users;
DROP POLICY IF EXISTS "Users can delete users in their establishment" ON users;
DROP POLICY IF EXISTS "Users can view own organization users" ON users;
DROP POLICY IF EXISTS "Users can insert own organization users" ON users;
DROP POLICY IF EXISTS "Users can update own organization users" ON users;
DROP POLICY IF EXISTS "Users can delete own organization users" ON users;

CREATE POLICY "Users can view own organization users"
  ON users FOR SELECT
  TO authenticated
  USING (organization_id = get_current_organization_id());

CREATE POLICY "Users can insert own organization users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_current_organization_id());

CREATE POLICY "Users can update own organization users"
  ON users FOR UPDATE
  TO authenticated
  USING (organization_id = get_current_organization_id())
  WITH CHECK (organization_id = get_current_organization_id());

CREATE POLICY "Users can delete own organization users"
  ON users FOR DELETE
  TO authenticated
  USING (organization_id = get_current_organization_id());

-- =====================================================
-- ATUALIZAR RLS POLICIES - ESTABLISHMENTS
-- =====================================================

ALTER TABLE establishments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all establishments" ON establishments;
DROP POLICY IF EXISTS "Users can create establishments" ON establishments;
DROP POLICY IF EXISTS "Users can update establishments" ON establishments;
DROP POLICY IF EXISTS "Users can delete establishments" ON establishments;
DROP POLICY IF EXISTS "Users can view own organization establishments" ON establishments;
DROP POLICY IF EXISTS "Users can manage own organization establishments" ON establishments;

CREATE POLICY "Users can view own organization establishments"
  ON establishments FOR SELECT
  TO authenticated
  USING (organization_id = get_current_organization_id());

CREATE POLICY "Users can manage own organization establishments"
  ON establishments FOR ALL
  TO authenticated
  USING (organization_id = get_current_organization_id())
  WITH CHECK (organization_id = get_current_organization_id());

-- =====================================================
-- ATUALIZAR RLS POLICIES - CARRIERS
-- =====================================================

ALTER TABLE carriers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view carriers in their establishment" ON carriers;
DROP POLICY IF EXISTS "Users can insert carriers" ON carriers;
DROP POLICY IF EXISTS "Users can update carriers" ON carriers;
DROP POLICY IF EXISTS "Users can delete carriers" ON carriers;
DROP POLICY IF EXISTS "Users can view own organization carriers" ON carriers;
DROP POLICY IF EXISTS "Users can manage own organization carriers" ON carriers;

CREATE POLICY "Users can view own organization carriers"
  ON carriers FOR SELECT
  TO authenticated
  USING (organization_id = get_current_organization_id());

CREATE POLICY "Users can manage own organization carriers"
  ON carriers FOR ALL
  TO authenticated
  USING (organization_id = get_current_organization_id())
  WITH CHECK (organization_id = get_current_organization_id());

-- =====================================================
-- ATUALIZAR RLS POLICIES - BUSINESS_PARTNERS
-- =====================================================

ALTER TABLE business_partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view business partners" ON business_partners;
DROP POLICY IF EXISTS "Users can manage business partners" ON business_partners;
DROP POLICY IF EXISTS "Users can view own organization partners" ON business_partners;
DROP POLICY IF EXISTS "Users can manage own organization partners" ON business_partners;

CREATE POLICY "Users can view own organization partners"
  ON business_partners FOR SELECT
  TO authenticated
  USING (organization_id = get_current_organization_id());

CREATE POLICY "Users can manage own organization partners"
  ON business_partners FOR ALL
  TO authenticated
  USING (organization_id = get_current_organization_id())
  WITH CHECK (organization_id = get_current_organization_id());

-- =====================================================
-- RLS GENÉRICO PARA OUTRAS TABELAS
-- =====================================================

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name IN (
        'orders', 'invoices_nfe', 'bills', 'pickups', 
        'freight_rates', 'freight_rate_tables', 'freight_rate_values',
        'occurrences', 'rejection_reasons', 'holidays',
        'reverse_logistics', 'nps_surveys', 'nps_responses',
        'whatsapp_config', 'google_maps_config', 'openai_config',
        'email_outgoing_config', 'api_keys', 'change_logs',
        'innovations', 'suggestions', 'help_articles'
      )
  LOOP
    -- Habilita RLS
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    
    -- Remove policies antigas
    EXECUTE format('DROP POLICY IF EXISTS "Users can view own organization %s" ON %I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can manage own organization %s" ON %I', tbl, tbl);
    
    -- Cria policies novas
    EXECUTE format('
      CREATE POLICY "Users can view own organization %s"
        ON %I FOR SELECT
        TO authenticated
        USING (organization_id = get_current_organization_id())
    ', tbl, tbl);
    
    EXECUTE format('
      CREATE POLICY "Users can manage own organization %s"
        ON %I FOR ALL
        TO authenticated
        USING (organization_id = get_current_organization_id())
        WITH CHECK (organization_id = get_current_organization_id())
    ', tbl, tbl);
    
    RAISE NOTICE 'Updated RLS for %', tbl;
  END LOOP;
END $$;
