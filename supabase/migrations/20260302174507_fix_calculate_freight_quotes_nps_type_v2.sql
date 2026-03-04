/*
  # Corrigir tipo de retorno nps_interno na função calculate_freight_quotes

  1. Alterações
    - Remover função existente
    - Alterar carrier_nps_interno de numeric para integer
    - Compatibilizar com o tipo real da coluna nps_interno em carriers
*/

-- Remover função existente
DROP FUNCTION IF EXISTS calculate_freight_quotes(uuid, text[]);

-- Recriar função com o tipo correto
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
BEGIN
  RETURN QUERY
  WITH active_rates AS (
    -- Buscar todas as tarifas ativas vinculadas à cidade de destino
    SELECT DISTINCT
      frc.freight_rate_id,
      frc.freight_rate_table_id,
      frc.delivery_days,
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
  )
  SELECT
    ar.carrier_id,
    c.nome_fantasia as carrier_name,
    c.nps_interno as carrier_nps_interno,
    ar.modal,
    ar.freight_rate_id,
    ar.freight_rate_table_id,
    ar.delivery_days,
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