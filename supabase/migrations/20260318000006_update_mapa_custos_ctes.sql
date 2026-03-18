-- Add CT-e detailed list to the Mapa Custos Dashboard endpoint

CREATE OR REPLACE FUNCTION get_dashboard_mapa_custos(
  p_start_date date,
  p_end_date date,
  p_carrier_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_org_id uuid;
  v_env_id uuid;
  v_result jsonb;
BEGIN
  v_org_id := nullif(current_setting('request.jwt.claim.organization_id', true), '')::uuid;
  v_env_id := nullif(current_setting('request.jwt.claim.environment_id', true), '')::uuid;
  IF v_org_id IS NULL THEN
    v_org_id := nullif(current_setting('app.organization_id', true), '')::uuid;
    v_env_id := nullif(current_setting('app.environment_id', true), '')::uuid;
  END IF;

  WITH cidade_resumo AS (
    SELECT 
      c.recipient_city as cidade,
      c.recipient_state as uf,
      SUM(c.total_value) as custo_total,
      COUNT(1) as total_entregas,
      SUM(c.cargo_weight) as volume_kg,
      jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'numero', c.number,
          'serie', c.series,
          'emissao', c.issue_date,
          'transportador', COALESCE(car.razao_social, 'Não informado'),
          'valor', c.total_value
        )
      ) as ctes
    FROM ctes_complete c
    LEFT JOIN carriers car ON car.id = c.carrier_id
    WHERE (v_org_id IS NULL OR c.organization_id = v_org_id)
      AND (v_env_id IS NULL OR c.environment_id = v_env_id)
      AND LOWER(c.status) IN ('autorizado', 'aprovado', 'importado', 'processando')
      AND DATE(c.issue_date) >= p_start_date
      AND DATE(c.issue_date) <= p_end_date
      AND (p_carrier_id IS NULL OR c.carrier_id = p_carrier_id)
      AND c.recipient_city IS NOT NULL
    GROUP BY c.recipient_city, c.recipient_state
    HAVING SUM(c.total_value) > 0
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'cidade', cidade,
      'uf', uf,
      'custoTotal', custo_total,
      'totalEntregas', total_entregas,
      'volumeKg', volume_kg,
      'ctes', ctes
    ) ORDER BY custo_total DESC
  ) INTO v_result
  FROM cidade_resumo;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;
