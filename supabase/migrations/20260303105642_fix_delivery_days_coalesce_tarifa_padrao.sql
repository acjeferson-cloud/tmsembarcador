/*
  # Corrigir Cálculo de Prazo de Entrega - Regra "Padrão da Tarifa"
  
  1. Problema
    - Quando na tela "Cidades da Tarifa" o campo está configurado como "Padrão da Tarifa" (NULL),
      a cotação não estava usando o prazo_entrega da tarifa
    - A função calculate_freight_quotes retornava apenas freight_rate_cities.delivery_days sem fallback
  
  2. Solução
    - Adicionar COALESCE na função calculate_freight_quotes para fazer fallback automático:
      COALESCE(frc.delivery_days, fr.prazo_entrega) as delivery_days
    - Isso garante que:
      * Se a cidade tiver prazo definido → usa o prazo da cidade
      * Se estiver NULL (Padrão da Tarifa) → usa o prazo_entrega da tarifa
  
  3. Impacto
    - Não afeta tarifas que já têm prazo definido na cidade
    - Corrige o cálculo para tarifas configuradas como "Padrão da Tarifa"
    - Garante que a cotação sempre terá um prazo de entrega válido
*/

-- Recriar a função calculate_freight_quotes com COALESCE no delivery_days
CREATE OR REPLACE FUNCTION public.calculate_freight_quotes(
  p_destination_city_id uuid, 
  p_selected_modals text[]
)
RETURNS TABLE(
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
AS $function$
BEGIN
  RETURN QUERY
  WITH active_rates AS (
    -- Buscar todas as tarifas ativas vinculadas à cidade de destino
    SELECT DISTINCT
      frc.freight_rate_id,
      frc.freight_rate_table_id,
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
  )
  SELECT
    ar.carrier_id,
    c.nome_fantasia as carrier_name,
    c.nps_interno as carrier_nps_interno,
    ar.modal,
    ar.freight_rate_id,
    ar.freight_rate_table_id,
    -- CORREÇÃO: Usar COALESCE para fallback do prazo da cidade para o prazo da tarifa
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
$function$;
