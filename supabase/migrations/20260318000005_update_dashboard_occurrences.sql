-- Update the Dashboard functions to read occurrences from `invoices_nfe` metadata JSON array instead of just pickup rejection reasons.

CREATE OR REPLACE FUNCTION get_dashboard_metricas_operacionais(
  p_start_date date,
  p_end_date date,
  p_carrier_id uuid DEFAULT NULL,
  p_uf text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_org_id uuid;
  v_env_id uuid;
  v_lead_time_medio numeric;
  v_sla_coleta_horas numeric;
  v_backlog_congestionado int;
  v_ocorrencias jsonb;
  v_result jsonb;
BEGIN
  v_org_id := nullif(current_setting('request.jwt.claim.organization_id', true), '')::uuid;
  v_env_id := nullif(current_setting('request.jwt.claim.environment_id', true), '')::uuid;
  IF v_org_id IS NULL THEN
    v_org_id := nullif(current_setting('app.organization_id', true), '')::uuid;
    v_env_id := nullif(current_setting('app.environment_id', true), '')::uuid;
  END IF;

  -- 1. Lead Time Médio (Dias para entregar o pedido)
  SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (data_entrega_realizada - data_pedido::timestamp))/86400), 0) INTO v_lead_time_medio
  FROM orders WHERE status = 'entregue' AND data_pedido >= p_start_date AND data_pedido <= p_end_date AND (v_org_id IS NULL OR organization_id = v_org_id) AND (v_env_id IS NULL OR environment_id = v_env_id) AND (p_carrier_id IS NULL OR carrier_id = p_carrier_id) AND (p_uf IS NULL OR destino_estado = p_uf);

  -- 2. SLA Coleta Médio (Horas de atraso na coleta em relação à agendada)
  SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (data_realizada - data_agendada::timestamp))/3600), 0) INTO v_sla_coleta_horas
  FROM pickups WHERE status = 'coletada' AND data_agendada >= p_start_date AND data_agendada <= p_end_date AND (v_org_id IS NULL OR organization_id = v_org_id) AND (v_env_id IS NULL OR environment_id = v_env_id) AND (p_carrier_id IS NULL OR carrier_id = p_carrier_id);

  -- 3. Volume Congestionado (Backlog > 3 dias parado em processamento)
  SELECT COUNT(1) INTO v_backlog_congestionado FROM orders 
  WHERE status IN ('pendente', 'processando') 
    AND data_pedido <= (CURRENT_DATE - INTERVAL '3 days')
    AND data_pedido >= p_start_date AND data_pedido <= p_end_date
    AND (v_org_id IS NULL OR organization_id = v_org_id) AND (v_env_id IS NULL OR environment_id = v_env_id) AND (p_carrier_id IS NULL OR carrier_id = p_carrier_id) AND (p_uf IS NULL OR destino_estado = p_uf);

  -- 4. Top Ocorrências de Problemas (Varredura no JSONB metadata->occurrences da Invoice NFe)
  SELECT jsonb_agg(jsonb_build_object('descricao', r.descricao, 'quantidade', r.cnt)) INTO v_ocorrencias
  FROM (
     SELECT 
       occ->>'descricao' as descricao, 
       COUNT(1) as cnt
     FROM invoices_nfe i
     LEFT JOIN invoices_nfe_customers c ON c.nfe_id = i.id
     CROSS JOIN jsonb_array_elements(COALESCE(i.metadata->'occurrences', '[]'::jsonb)) as occ
     WHERE DATE(i.data_emissao) >= p_start_date 
       AND DATE(i.data_emissao) <= p_end_date 
       AND (v_org_id IS NULL OR i.organization_id = v_org_id) 
       AND (v_env_id IS NULL OR i.environment_id = v_env_id) 
       AND (p_carrier_id IS NULL OR i.carrier_id = p_carrier_id)
       AND (p_uf IS NULL OR c.estado = p_uf)
       AND (
           (occ->>'codigo' ~ '^[0-9]+$' AND (occ->>'codigo')::int >= 50)
           OR occ->>'codigo' IN ('003', '004', '007', '008', '009', '010', '011', '012', '013', '014', '015', '016')
       )
     GROUP BY occ->>'descricao'
     ORDER BY cnt DESC
     LIMIT 5
  ) r;

  v_result := jsonb_build_object(
    'leadTimeDias', CAST(v_lead_time_medio AS numeric(15,1)),
    'slaColetaAtrasoHoras', CAST(v_sla_coleta_horas AS integer),
    'backlogVolume', v_backlog_congestionado,
    'topOcorrencias', COALESCE(v_ocorrencias, '[]'::jsonb)
  );

  RETURN v_result;
END;
$$;
