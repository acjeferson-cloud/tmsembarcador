/*
  # Criar tabela freight_rate_details

  1. Nova Tabela
    - `freight_rate_details` - Detalhes/faixas das tarifas de frete
      - `id` (uuid, primary key)
      - `freight_rate_id` (uuid, not null, referência a freight_rates)
      - `ordem` (integer, not null)
      - `peso_ate` (numeric)
      - `m3_ate` (numeric)
      - `volume_ate` (numeric)
      - `valor_ate` (numeric)
      - `valor_faixa` (numeric)
      - `tipo_calculo` (text)
      - `tipo_frete` (text)
      - `frete_valor` (numeric)
      - `frete_minimo` (numeric)
      - `tipo_taxa` (text)
      - `taxa_minima` (numeric)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Segurança
    - Habilita RLS
    - Políticas para isolamento por organização/ambiente

  3. Índices
    - Índice em freight_rate_id para busca rápida
*/

-- Criar tabela freight_rate_details
CREATE TABLE IF NOT EXISTS freight_rate_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  freight_rate_id uuid NOT NULL,
  ordem integer NOT NULL,
  peso_ate numeric,
  m3_ate numeric,
  volume_ate numeric,
  valor_ate numeric,
  valor_faixa numeric,
  tipo_calculo text,
  tipo_frete text,
  frete_valor numeric,
  frete_minimo numeric,
  tipo_taxa text,
  taxa_minima numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT fk_freight_rate_details_rate
    FOREIGN KEY (freight_rate_id)
    REFERENCES freight_rates(id)
    ON DELETE CASCADE
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_freight_rate_details_rate 
  ON freight_rate_details(freight_rate_id);
CREATE INDEX IF NOT EXISTS idx_freight_rate_details_ordem 
  ON freight_rate_details(freight_rate_id, ordem);

-- Habilitar RLS
ALTER TABLE freight_rate_details ENABLE ROW LEVEL SECURITY;

-- Política de SELECT
CREATE POLICY "freight_rate_details_select_policy"
  ON freight_rate_details
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM freight_rates fr
      WHERE fr.id = freight_rate_details.freight_rate_id
      AND fr.organization_id::text = current_setting('app.current_organization_id', true)
      AND fr.environment_id::text = current_setting('app.current_environment_id', true)
    )
  );

-- Política de INSERT
CREATE POLICY "freight_rate_details_insert_policy"
  ON freight_rate_details
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM freight_rates fr
      WHERE fr.id = freight_rate_details.freight_rate_id
      AND fr.organization_id::text = current_setting('app.current_organization_id', true)
      AND fr.environment_id::text = current_setting('app.current_environment_id', true)
    )
  );

-- Política de UPDATE
CREATE POLICY "freight_rate_details_update_policy"
  ON freight_rate_details
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM freight_rates fr
      WHERE fr.id = freight_rate_details.freight_rate_id
      AND fr.organization_id::text = current_setting('app.current_organization_id', true)
      AND fr.environment_id::text = current_setting('app.current_environment_id', true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM freight_rates fr
      WHERE fr.id = freight_rate_details.freight_rate_id
      AND fr.organization_id::text = current_setting('app.current_organization_id', true)
      AND fr.environment_id::text = current_setting('app.current_environment_id', true)
    )
  );

-- Política de DELETE
CREATE POLICY "freight_rate_details_delete_policy"
  ON freight_rate_details
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM freight_rates fr
      WHERE fr.id = freight_rate_details.freight_rate_id
      AND fr.organization_id::text = current_setting('app.current_organization_id', true)
      AND fr.environment_id::text = current_setting('app.current_environment_id', true)
    )
  );
