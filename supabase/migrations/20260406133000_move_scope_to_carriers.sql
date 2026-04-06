/*
  # Move Scope from Freight Tables to Carriers

  1. Drop scope from freight_rate_tables
  2. Add scope to carriers
  3. Redefine calculate_freight_quotes to use carrier scope
*/

-- 1. Remoção do scopo errado na tabela de fretes
-- Recriar política original simplificada
DROP POLICY IF EXISTS "freight_rate_tables_select_policy" ON freight_rate_tables;

ALTER TABLE freight_rate_tables DROP COLUMN IF EXISTS scope;
DROP INDEX IF EXISTS idx_freight_tables_estab;
DROP INDEX IF EXISTS idx_freight_tables_env;

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
      )
    )
  );

-- 2. Adição do escopo no Carrier (Transportadora)
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS scope freight_table_scope DEFAULT 'ESTABLISHMENT' NOT NULL;

-- Create Indexes for performance during calculations on carriers
CREATE INDEX IF NOT EXISTS idx_carriers_scope_estab ON carriers (scope, establishment_id) WHERE scope = 'ESTABLISHMENT';
CREATE INDEX IF NOT EXISTS idx_carriers_scope_env ON carriers (scope, environment_id) WHERE scope = 'ENVIRONMENT';

-- Atualização da RLS de Carriers para permitir leitura baseada em Scope
DROP POLICY IF EXISTS "carriers_select_policy" ON carriers;

CREATE POLICY "carriers_select_policy"
  ON carriers
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

-- 3. Atualizar a RPC de Cotação para bater no carrier
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
    SELECT DISTINCT
      frc.freight_rate_id,
      frc.freight_rate_table_id,
      frc.delivery_days as city_delivery_days,
      frt.transportador_id as carrier_id,
      frt.modal,
      frt.data_inicio,
      frt.data_fim,
      c.nome_fantasia as carrier_name,
      c.nps_interno as carrier_nps_interno
    FROM freight_rate_cities frc
    INNER JOIN freight_rate_tables frt 
      ON frt.id = frc.freight_rate_table_id
    INNER JOIN carriers c
      ON c.id = frt.transportador_id
    WHERE frc.city_id = p_destination_city_id
      AND frt.status = 'ativo'
      AND frt.data_inicio <= CURRENT_DATE
      AND frt.data_fim >= CURRENT_DATE
      AND frt.modal = ANY(p_selected_modals)
      -- VALIDAÇÃO DE SEGURANÇA E ESCOPO MULTI-TENANT BASEADO NO CARRIER:
      AND (
         (v_org_id IS NULL AND v_env_id IS NULL)
         OR
         (
           c.organization_id = v_org_id
           AND c.environment_id = v_env_id
           AND (
             (c.scope = 'ESTABLISHMENT' AND c.establishment_id = v_estab_id)
             OR (c.scope = 'ENVIRONMENT')
             OR (c.scope = 'ORGANIZATION')
           )
         )
      )
  )
  SELECT
    ar.carrier_id,
    ar.carrier_name,
    ar.carrier_nps_interno,
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
  INNER JOIN freight_rates fr ON fr.id = ar.freight_rate_id
  ORDER BY ar.carrier_name;
END;
$$;
