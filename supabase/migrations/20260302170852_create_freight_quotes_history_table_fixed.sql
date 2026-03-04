/*
  # Criar tabela freight_quotes_history (corrigido)

  1. Nova Tabela
    - `freight_quotes_history` - Histórico de cotações de frete
  
  2. Segurança
    - Enable RLS com políticas para anon e authenticated
*/

CREATE TABLE IF NOT EXISTS freight_quotes_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES saas_organizations(id) ON DELETE CASCADE,
  environment_id uuid REFERENCES saas_environments(id) ON DELETE CASCADE,
  
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  establishment_id uuid REFERENCES establishments(id) ON DELETE SET NULL,
  business_partner_id uuid REFERENCES business_partners(id) ON DELETE SET NULL,
  
  origin_city_id integer,
  destination_city_id integer,
  origin_zip_code text,
  destination_zip_code text,
  
  weight decimal(15,3) NOT NULL DEFAULT 0,
  volume_qty integer NOT NULL DEFAULT 1,
  cubic_meters decimal(15,4),
  cargo_value decimal(15,2) NOT NULL DEFAULT 0,
  
  quote_results jsonb DEFAULT '[]'::jsonb,
  best_carrier_id uuid,
  best_carrier_value decimal(15,2),
  delivery_days integer,
  delivery_deadline date,
  selected_modals jsonb DEFAULT '["rodoviario","aereo","aquaviario","ferroviario"]'::jsonb,
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_freight_quotes_history_org_env ON freight_quotes_history(organization_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_freight_quotes_history_user ON freight_quotes_history(user_id);
CREATE INDEX IF NOT EXISTS idx_freight_quotes_history_establishment ON freight_quotes_history(establishment_id);
CREATE INDEX IF NOT EXISTS idx_freight_quotes_history_created ON freight_quotes_history(created_at DESC);

ALTER TABLE freight_quotes_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read freight_quotes_history with context"
  ON freight_quotes_history FOR SELECT
  TO anon
  USING (
    organization_id::text = current_setting('app.current_organization_id', true) AND
    environment_id::text = current_setting('app.current_environment_id', true)
  );

CREATE POLICY "Allow anon insert freight_quotes_history with context"
  ON freight_quotes_history FOR INSERT
  TO anon
  WITH CHECK (
    organization_id::text = current_setting('app.current_organization_id', true) AND
    environment_id::text = current_setting('app.current_environment_id', true)
  );

CREATE POLICY "Allow authenticated read freight_quotes_history"
  ON freight_quotes_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert freight_quotes_history"
  ON freight_quotes_history FOR INSERT
  TO authenticated
  WITH CHECK (true);