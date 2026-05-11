CREATE OR REPLACE FUNCTION public.calculate_freight_b2b(
    p_origin_zip text,
    p_dest_zip text,
    p_business_partner text,
    p_value numeric,
    p_weight numeric,
    p_volumes integer,
    p_cubic_meters numeric,
    p_org_id uuid DEFAULT NULL
)
RETURNS TABLE (
    carrier_id uuid,
    carrier_name text,
    modal text,
    delivery_days integer,
    total_value numeric,
    freight_rate_table_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_dest_city_id text;
    v_dest_city_uuid uuid;
BEGIN
    -- 1. Find destination city by ZIP
    SELECT ibge_code INTO v_dest_city_id
    FROM (
        SELECT REPLACE(p_dest_zip, '-', '') AS clean_zip
    ) z
    JOIN cities c ON z.clean_zip BETWEEN c.cep_inicial AND c.cep_final
    LIMIT 1;

    IF v_dest_city_id IS NULL THEN
        -- Fallback to string exact match or similar logic
        SELECT codigo_ibge INTO v_dest_city_id
        FROM cities
        WHERE REPLACE(p_dest_zip, '-', '') BETWEEN cep_inicial AND cep_final
        LIMIT 1;
    END IF;

    -- 2. Find eligible freight rates (using existing logic or simplified query)
    RETURN QUERY
    WITH eligible_tables AS (
        SELECT 
            fr.id as rate_id,
            fr.freight_rate_table_id,
            fr.carrier_id,
            c.nome_fantasia as carrier_name,
            c.modal_principal as modal,
            COALESCE(frc.delivery_days, fr.prazo_entrega) as delivery_days,
            -- Simplified basic calc: fixed + coleta + entrega + excess coleta + excess entrega + (weight * rate) + (value * advalorem)
            (COALESCE(fr.taxa_fixa, 0) + 
             COALESCE(fr.taxa_coleta, 0) + 
             COALESCE(fr.taxa_entrega, 0) + 
             COALESCE(fr.coleta_entrega, 0) + 
             CASE 
                WHEN fr.coleta_franquia_kg IS NOT NULL AND p_weight > fr.coleta_franquia_kg AND fr.coleta_excedente_kg IS NOT NULL 
                THEN (p_weight - fr.coleta_franquia_kg) * fr.coleta_excedente_kg
                ELSE 0 
             END +
             CASE 
                WHEN fr.entrega_franquia_kg IS NOT NULL AND p_weight > fr.entrega_franquia_kg AND fr.entrega_excedente_kg IS NOT NULL 
                THEN (p_weight - fr.entrega_franquia_kg) * fr.entrega_excedente_kg
                ELSE 0 
             END +
             (p_weight * COALESCE(fr.frete_peso, 0)) + 
             (p_value * (COALESCE(fr.advalorem, 0) / 100.0)) + 
             COALESCE(fr.gris, 0) + 
             COALESCE(fr.pedagio, 0)) as calculated_value
        FROM freight_rates fr
        JOIN carriers c ON c.id = fr.carrier_id
        LEFT JOIN freight_rate_cities frc ON frc.freight_rate_id = fr.id
        JOIN cities dest ON dest.id = frc.city_id OR dest.codigo_ibge = v_dest_city_id
        WHERE 
            -- RLS or Org context
            (p_org_id IS NULL OR fr.organization_id = p_org_id)
            AND fr.is_active = true
            AND dest.codigo_ibge = v_dest_city_id
    )
    SELECT DISTINCT ON (e.carrier_id)
        e.carrier_id,
        e.carrier_name,
        e.modal,
        e.delivery_days,
        e.calculated_value as total_value,
        e.freight_rate_table_id
    FROM eligible_tables e
    ORDER BY e.carrier_id, e.calculated_value ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.calculate_freight_b2b(text, text, text, numeric, numeric, integer, numeric, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_freight_b2b(text, text, text, numeric, numeric, integer, numeric, uuid) TO service_role;
