-- Add explicit establishment_id argument to Dashboard RPC functions

-- 1. Visão Executiva: KPIs Gerais
CREATE OR REPLACE FUNCTION get_dashboard_executivo_kpis(
  p_start_date date,
  p_end_date date,
  p_carrier_id uuid DEFAULT NULL,
  p_uf text DEFAULT NULL,
  p_organization_id uuid DEFAULT NULL,
  p_environment_id uuid DEFAULT NULL,
  p_establishment_id uuid DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  v_org_id uuid; v_env_id uuid; v_custo_frete numeric; v_volumes_ton numeric; v_mercadoria_valor numeric; v_total_embarques int; v_entregas_no_prazo int; v_ticket_medio numeric; v_sla_otif numeric; v_representatividade numeric; v_custo_kg numeric; v_divergencia_frete numeric; v_taxas_extras_valor numeric; v_taxas_extras_percent numeric; v_result jsonb; v_entregues int;
BEGIN
  v_org_id := COALESCE(p_organization_id, nullif(current_setting('request.jwt.claim.organization_id', true), '')::uuid, nullif(current_setting('app.organization_id', true), '')::uuid);
  v_env_id := COALESCE(p_environment_id, nullif(current_setting('request.jwt.claim.environment_id', true), '')::uuid, nullif(current_setting('app.environment_id', true), '')::uuid);

  SELECT COALESCE(SUM(total_value), 0), COALESCE(SUM(cargo_weight), 0), COALESCE(SUM(cargo_value), 0), COALESCE(SUM(COALESCE(seccat_value, 0) + COALESCE(dispatch_value, 0) + COALESCE(ademe_gris_value, 0) + COALESCE(itr_value, 0) + COALESCE(tas_value, 0) + COALESCE(collection_delivery_value, 0) + COALESCE(other_tax_value, 0) + COALESCE(toll_value, 0)), 0)
  INTO v_custo_frete, v_volumes_ton, v_mercadoria_valor, v_taxas_extras_valor
  FROM ctes_complete c
  WHERE (v_org_id IS NULL OR c.organization_id = v_org_id) AND (v_env_id IS NULL OR c.environment_id = v_env_id) AND (p_establishment_id IS NULL OR c.establishment_id = p_establishment_id) AND DATE(c.issue_date) >= p_start_date AND DATE(c.issue_date) <= p_end_date AND LOWER(c.status) IN ('autorizado', 'aprovado', 'importado', 'processando') AND (p_carrier_id IS NULL OR c.carrier_id = p_carrier_id) AND (p_uf IS NULL OR c.recipient_state = p_uf);

  SELECT COALESCE(SUM(valor_divergencia), 0) INTO v_divergencia_frete FROM ctes c
  WHERE (v_org_id IS NULL OR c.organization_id = v_org_id) AND (v_env_id IS NULL OR c.environment_id = v_env_id) AND (p_establishment_id IS NULL OR c.establishment_id = p_establishment_id) AND DATE(c.data_emissao) >= p_start_date AND DATE(c.data_emissao) <= p_end_date AND c.divergencia_valores = true AND (p_carrier_id IS NULL OR c.carrier_id = p_carrier_id);

  SELECT COUNT(1), COUNT(CASE WHEN data_entrega_realizada <= data_prevista_entrega THEN 1 END) INTO v_total_embarques, v_entregas_no_prazo FROM orders o
  WHERE (v_org_id IS NULL OR o.organization_id = v_org_id) AND (v_env_id IS NULL OR o.environment_id = v_env_id) AND (p_establishment_id IS NULL OR o.establishment_id = p_establishment_id) AND o.data_pedido >= p_start_date AND o.data_pedido <= p_end_date AND o.status != 'cancelado' AND (p_carrier_id IS NULL OR o.carrier_id = p_carrier_id) AND (p_uf IS NULL OR o.destino_estado = p_uf);

  v_ticket_medio := CASE WHEN v_total_embarques > 0 THEN v_custo_frete / v_total_embarques ELSE 0 END;
  v_representatividade := CASE WHEN v_mercadoria_valor > 0 THEN (v_custo_frete / v_mercadoria_valor) * 100 ELSE 0 END;
  v_custo_kg := CASE WHEN v_volumes_ton > 0 THEN v_custo_frete / v_volumes_ton ELSE 0 END;
  v_taxas_extras_percent := CASE WHEN v_custo_frete > 0 THEN (v_taxas_extras_valor / v_custo_frete) * 100 ELSE 0 END;

  SELECT COUNT(1) INTO v_entregues FROM orders o 
  WHERE (v_org_id IS NULL OR o.organization_id = v_org_id) AND (v_env_id IS NULL OR o.environment_id = v_env_id) AND (p_establishment_id IS NULL OR o.establishment_id = p_establishment_id) AND o.data_pedido >= p_start_date AND o.data_pedido <= p_end_date AND o.status = 'entregue' AND (p_carrier_id IS NULL OR o.carrier_id = p_carrier_id) AND (p_uf IS NULL OR o.destino_estado = p_uf);
    
  v_sla_otif := CASE WHEN v_entregues > 0 THEN (v_entregas_no_prazo::numeric / v_entregues::numeric) * 100 ELSE 100 END;

  v_result := jsonb_build_object('custoTotalFrete', v_custo_frete, 'volumeToneladas', v_volumes_ton / 1000.0, 'totalEmbarques', v_total_embarques, 'ticketMedio', CAST(v_ticket_medio AS numeric(15,2)), 'slaOtif', CAST(v_sla_otif AS numeric(15,1)), 'representatividade', CAST(v_representatividade AS numeric(15,2)), 'custoKg', CAST(v_custo_kg AS numeric(15,2)), 'custoDivergencia', v_divergencia_frete, 'taxasExtrasPercent', CAST(v_taxas_extras_percent AS numeric(15,2)));

  RETURN v_result;
END;
$$;


-- 2. Evolução de Custos (Temporal)
CREATE OR REPLACE FUNCTION get_dashboard_evolucao_custos(
  p_start_date date,
  p_end_date date,
  p_carrier_id uuid DEFAULT NULL,
  p_uf text DEFAULT NULL,
  p_organization_id uuid DEFAULT NULL,
  p_environment_id uuid DEFAULT NULL,
  p_establishment_id uuid DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE v_org_id uuid; v_env_id uuid; v_result jsonb;
BEGIN
  v_org_id := COALESCE(p_organization_id, nullif(current_setting('request.jwt.claim.organization_id', true), '')::uuid, nullif(current_setting('app.organization_id', true), '')::uuid);
  v_env_id := COALESCE(p_environment_id, nullif(current_setting('request.jwt.claim.environment_id', true), '')::uuid, nullif(current_setting('app.environment_id', true), '')::uuid);

  WITH dias AS (
    SELECT generate_series(p_start_date::timestamp, p_end_date::timestamp, '1 day'::interval)::date as data_evolucao
  ),
  custos_diarios AS (
    SELECT DATE(issue_date) as data_ct, SUM(total_value) as custo, COUNT(1) as qtd_ctes FROM ctes_complete
    WHERE (v_org_id IS NULL OR organization_id = v_org_id) AND (v_env_id IS NULL OR environment_id = v_env_id) AND (p_establishment_id IS NULL OR establishment_id = p_establishment_id) AND LOWER(status) in ('autorizado', 'aprovado', 'importado', 'processando') AND DATE(issue_date) >= p_start_date AND DATE(issue_date) <= p_end_date AND (p_carrier_id IS NULL OR carrier_id = p_carrier_id) AND (p_uf IS NULL OR recipient_state = p_uf) GROUP BY DATE(issue_date)
  )
  SELECT jsonb_agg(jsonb_build_object('data', to_char(d.data_evolucao, 'DD/MM'), 'custo', COALESCE(c.custo, 0), 'entregas', COALESCE(c.qtd_ctes, 0)) ORDER BY d.data_evolucao) INTO v_result FROM dias d LEFT JOIN custos_diarios c ON d.data_evolucao = c.data_ct;
  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;


-- 3. Top Transportadoras
CREATE OR REPLACE FUNCTION get_dashboard_top_transportadoras(
  p_start_date date,
  p_end_date date,
  p_uf text DEFAULT NULL,
  p_organization_id uuid DEFAULT NULL,
  p_environment_id uuid DEFAULT NULL,
  p_establishment_id uuid DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE v_org_id uuid; v_env_id uuid; v_result jsonb;
BEGIN
  v_org_id := COALESCE(p_organization_id, nullif(current_setting('request.jwt.claim.organization_id', true), '')::uuid, nullif(current_setting('app.organization_id', true), '')::uuid);
  v_env_id := COALESCE(p_environment_id, nullif(current_setting('request.jwt.claim.environment_id', true), '')::uuid, nullif(current_setting('app.environment_id', true), '')::uuid);

  WITH ranking AS (
    SELECT car.razao_social, SUM(cte.total_value) as valor_frete, COUNT(cte.id) as volume_docs FROM ctes_complete cte
    LEFT JOIN carriers car ON car.id = cte.carrier_id
    WHERE (v_org_id IS NULL OR cte.organization_id = v_org_id) AND (v_env_id IS NULL OR cte.environment_id = v_env_id) AND (p_establishment_id IS NULL OR cte.establishment_id = p_establishment_id) AND LOWER(cte.status) IN ('autorizado', 'aprovado', 'importado', 'processando') AND DATE(cte.issue_date) >= p_start_date AND DATE(cte.issue_date) <= p_end_date AND (p_uf IS NULL OR cte.recipient_state = p_uf) GROUP BY car.id, car.razao_social ORDER BY valor_frete DESC LIMIT 5
  )
  SELECT jsonb_agg(jsonb_build_object('nome', COALESCE(razao_social, 'Transportadora Desconhecida'), 'valor', valor_frete, 'quantidade', volume_docs)) INTO v_result FROM ranking;
  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;


-- 4. Funil Operacional (Status de Pedidos)
CREATE OR REPLACE FUNCTION get_dashboard_funil_operacional(
  p_start_date date,
  p_end_date date,
  p_carrier_id uuid DEFAULT NULL,
  p_uf text DEFAULT NULL,
  p_organization_id uuid DEFAULT NULL,
  p_environment_id uuid DEFAULT NULL,
  p_establishment_id uuid DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE v_org_id uuid; v_env_id uuid; v_result jsonb;
BEGIN
  v_org_id := COALESCE(p_organization_id, nullif(current_setting('request.jwt.claim.organization_id', true), '')::uuid, nullif(current_setting('app.organization_id', true), '')::uuid);
  v_env_id := COALESCE(p_environment_id, nullif(current_setting('request.jwt.claim.environment_id', true), '')::uuid, nullif(current_setting('app.environment_id', true), '')::uuid);

  WITH status_count AS (
    SELECT status, COUNT(1) as total FROM orders
    WHERE (v_org_id IS NULL OR organization_id = v_org_id) AND (v_env_id IS NULL OR environment_id = v_env_id) AND (p_establishment_id IS NULL OR establishment_id = p_establishment_id) AND data_pedido >= p_start_date AND data_pedido <= p_end_date AND (p_carrier_id IS NULL OR carrier_id = p_carrier_id) AND (p_uf IS NULL OR destino_estado = p_uf) GROUP BY status
  )
  SELECT jsonb_agg(jsonb_build_object('status', status, 'quantidade', total)) INTO v_result FROM status_count;
  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;


-- 5. Novas Métricas Operacionais Avançadas
CREATE OR REPLACE FUNCTION get_dashboard_metricas_operacionais(
  p_start_date date,
  p_end_date date,
  p_carrier_id uuid DEFAULT NULL,
  p_uf text DEFAULT NULL,
  p_organization_id uuid DEFAULT NULL,
  p_environment_id uuid DEFAULT NULL,
  p_establishment_id uuid DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE v_org_id uuid; v_env_id uuid; v_lead_time_medio numeric; v_sla_coleta_horas numeric; v_backlog_congestionado int; v_ocorrencias jsonb; v_result jsonb;
BEGIN
  v_org_id := COALESCE(p_organization_id, nullif(current_setting('request.jwt.claim.organization_id', true), '')::uuid, nullif(current_setting('app.organization_id', true), '')::uuid);
  v_env_id := COALESCE(p_environment_id, nullif(current_setting('request.jwt.claim.environment_id', true), '')::uuid, nullif(current_setting('app.environment_id', true), '')::uuid);

  SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (data_entrega_realizada - data_pedido::timestamp))/86400), 0) INTO v_lead_time_medio FROM orders WHERE status = 'entregue' AND data_pedido >= p_start_date AND data_pedido <= p_end_date AND (v_org_id IS NULL OR organization_id = v_org_id) AND (v_env_id IS NULL OR environment_id = v_env_id) AND (p_establishment_id IS NULL OR establishment_id = p_establishment_id) AND (p_carrier_id IS NULL OR carrier_id = p_carrier_id) AND (p_uf IS NULL OR destino_estado = p_uf);

  SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (data_realizada - data_agendada::timestamp))/3600), 0) INTO v_sla_coleta_horas FROM pickups WHERE status = 'coletada' AND data_agendada >= p_start_date AND data_agendada <= p_end_date AND (v_org_id IS NULL OR organization_id = v_org_id) AND (v_env_id IS NULL OR environment_id = v_env_id) AND (p_establishment_id IS NULL OR establishment_id = p_establishment_id) AND (p_carrier_id IS NULL OR carrier_id = p_carrier_id);

  SELECT COUNT(1) INTO v_backlog_congestionado FROM orders 
  WHERE status IN ('pendente', 'processando') AND data_pedido <= (CURRENT_DATE - INTERVAL '3 days') AND data_pedido >= p_start_date AND data_pedido <= p_end_date AND (v_org_id IS NULL OR organization_id = v_org_id) AND (v_env_id IS NULL OR environment_id = v_env_id) AND (p_establishment_id IS NULL OR establishment_id = p_establishment_id) AND (p_carrier_id IS NULL OR carrier_id = p_carrier_id) AND (p_uf IS NULL OR destino_estado = p_uf);

  SELECT jsonb_agg(jsonb_build_object('descricao', r.descricao, 'quantidade', r.cnt)) INTO v_ocorrencias
  FROM (
     SELECT r.descricao, COUNT(p.id) as cnt FROM pickups p JOIN rejection_reasons r ON r.id = p.rejection_reason_id WHERE p.status = 'rejeitada' AND DATE(p.data_agendada) >= p_start_date AND DATE(p.data_agendada) <= p_end_date AND (v_org_id IS NULL OR p.organization_id = v_org_id) AND (v_env_id IS NULL OR p.environment_id = v_env_id) AND (p_establishment_id IS NULL OR p.establishment_id = p_establishment_id) AND (p_carrier_id IS NULL OR p.carrier_id = p_carrier_id) GROUP BY r.descricao ORDER BY cnt DESC LIMIT 5
  ) r;

  v_result := jsonb_build_object('leadTimeDias', CAST(v_lead_time_medio AS numeric(15,1)), 'slaColetaAtrasoHoras', CAST(v_sla_coleta_horas AS integer), 'backlogVolume', v_backlog_congestionado, 'topOcorrencias', COALESCE(v_ocorrencias, '[]'::jsonb));
  RETURN v_result;
END;
$$;


-- 6. Custo Geográfico (Mapa)
CREATE OR REPLACE FUNCTION get_dashboard_mapa_custos(
  p_start_date date,
  p_end_date date,
  p_carrier_id uuid DEFAULT NULL,
  p_organization_id uuid DEFAULT NULL,
  p_environment_id uuid DEFAULT NULL,
  p_establishment_id uuid DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE v_org_id uuid; v_env_id uuid; v_result jsonb;
BEGIN
  v_org_id := COALESCE(p_organization_id, nullif(current_setting('request.jwt.claim.organization_id', true), '')::uuid, nullif(current_setting('app.organization_id', true), '')::uuid);
  v_env_id := COALESCE(p_environment_id, nullif(current_setting('request.jwt.claim.environment_id', true), '')::uuid, nullif(current_setting('app.environment_id', true), '')::uuid);

  WITH cidade_resumo AS (
    SELECT recipient_city as cidade, recipient_state as uf, SUM(total_value) as custo_total, COUNT(1) as total_entregas, SUM(cargo_weight) as volume_kg FROM ctes_complete c
    WHERE (v_org_id IS NULL OR c.organization_id = v_org_id) AND (v_env_id IS NULL OR c.environment_id = v_env_id) AND (p_establishment_id IS NULL OR c.establishment_id = p_establishment_id) AND LOWER(c.status) IN ('autorizado', 'aprovado', 'importado', 'processando') AND DATE(c.issue_date) >= p_start_date AND DATE(c.issue_date) <= p_end_date AND (p_carrier_id IS NULL OR c.carrier_id = p_carrier_id) AND c.recipient_city IS NOT NULL GROUP BY recipient_city, recipient_state HAVING SUM(total_value) > 0
  )
  SELECT jsonb_agg(jsonb_build_object('cidade', cidade, 'uf', uf, 'custoTotal', custo_total, 'totalEntregas', total_entregas, 'volumeKg', volume_kg) ORDER BY custo_total DESC) INTO v_result FROM cidade_resumo;
  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;
