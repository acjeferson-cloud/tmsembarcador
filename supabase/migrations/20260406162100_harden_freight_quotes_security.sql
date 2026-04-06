-- 20260406161500_harden_freight_quotes_security.sql

-- 1. Drop existing functions due to signature changes
DROP FUNCTION IF EXISTS calculate_freight_quotes(uuid, text[]);
DROP FUNCTION IF EXISTS calculate_freight_quotes(uuid, text[], uuid, uuid, uuid);

-- 2. Create the hardened function
CREATE OR REPLACE FUNCTION calculate_freight_quotes(
  p_destination_city_id uuid,
  p_selected_modals text[],
  p_organization_id uuid DEFAULT NULL,
  p_environment_id uuid DEFAULT NULL,
  p_establishment_id uuid DEFAULT NULL
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
  v_org_id uuid := COALESCE(p_organization_id, NULLIF(current_setting('app.current_organization_id', true), '')::uuid);
  v_env_id uuid := COALESCE(p_environment_id, NULLIF(current_setting('app.current_environment_id', true), '')::uuid);
  v_estab_id uuid := COALESCE(p_establishment_id, NULLIF(current_setting('app.current_establishment_id', true), '')::uuid);
BEGIN
  -- SEGURANÇA ESTRITA: Rejeita cálculos se não houver contexto Multi-Tenant explícito passado ou ativo.
  -- Esta função tem SECURITY DEFINER, por isso a RLS não protege automaticamente e precisamos validar aqui.
  IF v_org_id IS NULL OR v_env_id IS NULL THEN
    RETURN;
  END IF;

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
         c.organization_id = v_org_id
         AND c.environment_id = v_env_id
         AND (
           (c.scope = 'ESTABLISHMENT' AND c.establishment_id = v_estab_id)
           OR
           (c.scope = 'ENVIRONMENT')
           OR
           (c.scope = 'ORGANIZATION')
         )
      )
  )
  SELECT 
    ar.carrier_id,
    ar.carrier_name,
    COALESCE(ar.carrier_nps_interno, 50) as carrier_nps_interno,
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
  INNER JOIN freight_rates fr 
    ON fr.id = ar.freight_rate_id;
END;
$$;
