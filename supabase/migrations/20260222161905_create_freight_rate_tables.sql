/*
  # Criar tabela freight_rate_tables

  1. Nova Tabela
    - `freight_rate_tables` - Tabelas de frete dos transportadores
      - `id` (uuid, primary key)
      - `organization_id` (uuid, not null)
      - `environment_id` (uuid, not null)
      - `transportador_id` (uuid, not null, referência a carriers)
      - `nome` (text, not null)
      - `data_inicio` (date, not null)
      - `data_fim` (date, not null)
      - `status` (text, not null, default 'ativo')
      - `table_type` (text)
      - `modal` (text)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
      - `created_by` (uuid)
      - `updated_by` (uuid)

  2. Segurança
    - Habilita RLS
    - Políticas para usuários autenticados por organização/ambiente

  3. Índices
    - Índice em transportador_id para busca rápida
    - Índice em organization_id e environment_id para isolamento
*/

-- Criar tabela freight_rate_tables
CREATE TABLE IF NOT EXISTS freight_rate_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  environment_id uuid NOT NULL,
  transportador_id uuid NOT NULL,
  nome text NOT NULL,
  data_inicio date NOT NULL,
  data_fim date NOT NULL,
  status text NOT NULL DEFAULT 'ativo',
  table_type text,
  modal text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  CONSTRAINT fk_freight_rate_tables_carrier
    FOREIGN KEY (transportador_id)
    REFERENCES carriers(id)
    ON DELETE CASCADE
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_freight_rate_tables_transportador 
  ON freight_rate_tables(transportador_id);
CREATE INDEX IF NOT EXISTS idx_freight_rate_tables_org_env 
  ON freight_rate_tables(organization_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_freight_rate_tables_status 
  ON freight_rate_tables(status);

-- Habilitar RLS
ALTER TABLE freight_rate_tables ENABLE ROW LEVEL SECURITY;

-- Política de SELECT (anônimo com session context)
CREATE POLICY "freight_rate_tables_select_policy"
  ON freight_rate_tables
  FOR SELECT
  USING (
    organization_id::text = current_setting('app.current_organization_id', true)
    AND environment_id::text = current_setting('app.current_environment_id', true)
  );

-- Política de INSERT
CREATE POLICY "freight_rate_tables_insert_policy"
  ON freight_rate_tables
  FOR INSERT
  WITH CHECK (
    organization_id::text = current_setting('app.current_organization_id', true)
    AND environment_id::text = current_setting('app.current_environment_id', true)
  );

-- Política de UPDATE
CREATE POLICY "freight_rate_tables_update_policy"
  ON freight_rate_tables
  FOR UPDATE
  USING (
    organization_id::text = current_setting('app.current_organization_id', true)
    AND environment_id::text = current_setting('app.current_environment_id', true)
  )
  WITH CHECK (
    organization_id::text = current_setting('app.current_organization_id', true)
    AND environment_id::text = current_setting('app.current_environment_id', true)
  );

-- Política de DELETE
CREATE POLICY "freight_rate_tables_delete_policy"
  ON freight_rate_tables
  FOR DELETE
  USING (
    organization_id::text = current_setting('app.current_organization_id', true)
    AND environment_id::text = current_setting('app.current_environment_id', true)
  );
