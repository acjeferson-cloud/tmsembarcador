/*
  # Evolução de Visibilidade de Tabelas de Frete (Scopes & Herança)
  
  1. Novo Enum para controle de visibilidade
  2. Adição de estabelecimento e escopo nas tabelas de frete
  3. Atualização de políticas de RLS para herança
  4. Correção e aprimoramento na rotina de cálculo de frete
*/

-- 1. Enum for Scope
DO $$ BEGIN
    CREATE TYPE freight_table_scope AS ENUM ('ORGANIZATION', 'ENVIRONMENT', 'ESTABLISHMENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add columns to freight_rate_tables
ALTER TABLE freight_rate_tables ADD COLUMN IF NOT EXISTS establishment_id UUID;
ALTER TABLE freight_rate_tables ADD COLUMN IF NOT EXISTS scope freight_table_scope DEFAULT 'ESTABLISHMENT' NOT NULL;

-- Create Indexes for performance during calculations
CREATE INDEX IF NOT EXISTS idx_freight_tables_estab ON freight_rate_tables (scope, establishment_id) WHERE scope = 'ESTABLISHMENT';
CREATE INDEX IF NOT EXISTS idx_freight_tables_env ON freight_rate_tables (scope, environment_id) WHERE scope = 'ENVIRONMENT';

-- 3. Update RLS on freight_rate_tables
-- Drop existing policies first
DROP POLICY IF EXISTS "freight_rate_tables_select_policy" ON freight_rate_tables;

-- Create new Select Policy supporting Scope Inheritance
CREATE POLICY "freight_rate_tables_select_policy"
  ON freight_rate_tables
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
        AND (
          (scope = 'ESTABLISHMENT' AND establishment_id::text = current_setting('app.current_establishment_id', true))
          OR
          (scope = 'ENVIRONMENT')
          OR
          (scope = 'ORGANIZATION')
        )
      )
    )
  );

-- 4. Re-create calculate_freight_quotes to validate tenancy AND scope
DROP FUNCTION IF EXISTS calculate_freight_quotes(uuid, text[]);

CREATE OR REPLACE FUNCTION calculate_freight_quotes(
  p_destination_city_id uuid,
  p_selected_modals text[]
)
RETURNS TABLE (
  carrier_id uuid,
  carrier_name text,
  carrier_nps_interno integer,
  modal text,
  freight_rate_id uuid,
  freight_rate_table_id uuid,
  delivery_days integer,
  rate_data jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_org_id uuid := NULLIF(current_setting('app.current_organization_id', true), '')::uuid;
  v_env_id uuid := NULLIF(current_setting('app.current_environment_id', true), '')::uuid;
  v_estab_id uuid := NULLIF(current_setting('app.current_establishment_id', true), '')::uuid;
BEGIN
  RETURN QUERY
  WITH active_rates AS (
    -- Buscar todas as tarifas ativas vinculadas à cidade de destino
    SELECT DISTINCT
      frc.freight_rate_id,
      frc.freight_rate_table_id,
      -- Pegar prazo de entrega (cidade x tarifa padrao)
      frc.delivery_days as city_delivery_days,
      frt.transportador_id as carrier_id,
      frt.modal,
      frt.data_inicio,
      frt.data_fim
    FROM freight_rate_cities frc
    INNER JOIN freight_rate_tables frt 
      ON frt.id = frc.freight_rate_table_id
    WHERE frc.city_id = p_destination_city_id
      AND frt.status = 'ativo'
      AND frt.data_inicio <= CURRENT_DATE
      AND frt.data_fim >= CURRENT_DATE
      AND frt.modal = ANY(p_selected_modals)
      -- VALIDAÇÃO DE SEGURANÇA E ESCOPO MUTI-TENANT:
      AND (
         -- Protege contra vazamento e valida hierarquia se houver contexto populado
         (v_org_id IS NULL AND v_env_id IS NULL) -- Caso chamado por background worker sem contexto
         OR
         (
           frt.organization_id = v_org_id
           AND frt.environment_id = v_env_id
           AND (
             (frt.scope = 'ESTABLISHMENT' AND frt.establishment_id = v_estab_id)
             OR (frt.scope = 'ENVIRONMENT')
             OR (frt.scope = 'ORGANIZATION')
           )
         )
      )
  )
  SELECT
    ar.carrier_id,
    c.nome_fantasia as carrier_name,
    c.nps_interno as carrier_nps_interno,
    ar.modal,
    ar.freight_rate_id,
    ar.freight_rate_table_id,
    COALESCE(ar.city_delivery_days, fr.prazo_entrega) as delivery_days,
    jsonb_build_object(
      'freight_rate', to_jsonb(fr.*),
      'freight_rate_details', (
        SELECT jsonb_agg(frd.* ORDER BY frd.ordem)
        FROM freight_rate_details frd
        WHERE frd.freight_rate_id = ar.freight_rate_id
      )
    ) as rate_data
  FROM active_rates ar
  INNER JOIN carriers c ON c.id = ar.carrier_id
  INNER JOIN freight_rates fr ON fr.id = ar.freight_rate_id
  ORDER BY c.nome_fantasia;
END;
$$;
