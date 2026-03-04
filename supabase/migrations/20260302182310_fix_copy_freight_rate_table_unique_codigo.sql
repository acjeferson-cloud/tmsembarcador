/*
  # Corrigir função copy_freight_rate_table - gerar códigos únicos

  1. Alterações
    - Gerar novo código para cada tarifa copiada
    - Formato: codigo_original + '_COPY_' + timestamp
    - Garantir unicidade dos códigos
*/

CREATE OR REPLACE FUNCTION public.copy_freight_rate_table(
  source_table_id uuid,
  target_carrier_id uuid,
  new_table_name text,
  new_start_date timestamptz,
  new_end_date timestamptz,
  user_id_param uuid DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_source_table RECORD;
  v_new_table_id uuid;
  v_rate RECORD;
  v_new_rate_id uuid;
  v_new_codigo text;
  v_detail RECORD;
  v_city RECORD;
  v_rates_copied integer := 0;
  v_details_copied integer := 0;
  v_cities_copied integer := 0;
  v_timestamp text;
BEGIN
  -- Gerar timestamp único para os códigos
  v_timestamp := to_char(now(), 'YYYYMMDDHH24MISS');
  
  -- Buscar tabela origem
  SELECT * INTO v_source_table
  FROM freight_rate_tables
  WHERE id = source_table_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Tabela de frete origem não encontrada'
    );
  END IF;
  
  -- Verificar se transportador existe
  IF NOT EXISTS (SELECT 1 FROM carriers WHERE id = target_carrier_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Transportador destino não encontrado'
    );
  END IF;
  
  -- Gerar novo ID para a tabela
  v_new_table_id := gen_random_uuid();
  
  -- Copiar tabela de frete
  INSERT INTO freight_rate_tables (
    id,
    nome,
    transportador_id,
    data_inicio,
    data_fim,
    status,
    table_type,
    modal,
    organization_id,
    environment_id,
    created_by,
    updated_by
  )
  VALUES (
    v_new_table_id,
    new_table_name,
    target_carrier_id,
    new_start_date::date,
    new_end_date::date,
    v_source_table.status,
    v_source_table.table_type,
    v_source_table.modal,
    v_source_table.organization_id,
    v_source_table.environment_id,
    COALESCE(user_id_param, v_source_table.created_by),
    COALESCE(user_id_param, v_source_table.updated_by)
  );
  
  -- Copiar todas as tarifas (freight_rates)
  FOR v_rate IN
    SELECT * FROM freight_rates
    WHERE freight_rate_table_id = source_table_id
    ORDER BY codigo
  LOOP
    -- Gerar novo ID e código para a tarifa
    v_new_rate_id := gen_random_uuid();
    v_new_codigo := v_rate.codigo || '_COPY_' || v_timestamp || '_' || v_rates_copied;
    v_rates_copied := v_rates_copied + 1;
    
    -- Copiar tarifa com TODOS os campos
    INSERT INTO freight_rates (
      id,
      freight_rate_table_id,
      codigo,
      descricao,
      nome,
      tipo_aplicacao,
      prazo_entrega,
      valor,
      observacoes,
      pedagio_minimo,
      pedagio_por_kg,
      pedagio_a_cada_kg,
      pedagio_tipo_kg,
      icms_embutido_tabela,
      aliquota_icms,
      fator_m3,
      fator_m3_apartir_kg,
      fator_m3_apartir_m3,
      fator_m3_apartir_valor,
      percentual_gris,
      gris_minimo,
      seccat,
      despacho,
      itr,
      taxa_adicional,
      coleta_entrega,
      tde_trt,
      tas,
      taxa_suframa,
      valor_outros_percent,
      valor_outros_minimo,
      taxa_outros_valor,
      taxa_outros_tipo_valor,
      taxa_apartir_de,
      taxa_apartir_de_tipo,
      taxa_outros_a_cada,
      taxa_outros_minima,
      frete_peso_minimo,
      frete_valor_minimo,
      frete_tonelada_minima,
      frete_percentual_minimo,
      frete_m3_minimo,
      valor_total_minimo,
      data_inicio,
      data_fim,
      organization_id,
      environment_id
    )
    VALUES (
      v_new_rate_id,
      v_new_table_id,
      v_new_codigo,
      v_rate.descricao,
      v_rate.nome,
      v_rate.tipo_aplicacao,
      v_rate.prazo_entrega,
      v_rate.valor,
      v_rate.observacoes,
      v_rate.pedagio_minimo,
      v_rate.pedagio_por_kg,
      v_rate.pedagio_a_cada_kg,
      v_rate.pedagio_tipo_kg,
      v_rate.icms_embutido_tabela,
      v_rate.aliquota_icms,
      v_rate.fator_m3,
      v_rate.fator_m3_apartir_kg,
      v_rate.fator_m3_apartir_m3,
      v_rate.fator_m3_apartir_valor,
      v_rate.percentual_gris,
      v_rate.gris_minimo,
      v_rate.seccat,
      v_rate.despacho,
      v_rate.itr,
      v_rate.taxa_adicional,
      v_rate.coleta_entrega,
      v_rate.tde_trt,
      v_rate.tas,
      v_rate.taxa_suframa,
      v_rate.valor_outros_percent,
      v_rate.valor_outros_minimo,
      v_rate.taxa_outros_valor,
      v_rate.taxa_outros_tipo_valor,
      v_rate.taxa_apartir_de,
      v_rate.taxa_apartir_de_tipo,
      v_rate.taxa_outros_a_cada,
      v_rate.taxa_outros_minima,
      v_rate.frete_peso_minimo,
      v_rate.frete_valor_minimo,
      v_rate.frete_tonelada_minima,
      v_rate.frete_percentual_minimo,
      v_rate.frete_m3_minimo,
      v_rate.valor_total_minimo,
      COALESCE(v_rate.data_inicio, new_start_date::date),
      COALESCE(v_rate.data_fim, new_end_date::date),
      v_rate.organization_id,
      v_rate.environment_id
    );
    
    -- Copiar detalhes da tarifa (freight_rate_details)
    FOR v_detail IN
      SELECT * FROM freight_rate_details
      WHERE freight_rate_id = v_rate.id
      ORDER BY ordem
    LOOP
      v_details_copied := v_details_copied + 1;
      
      INSERT INTO freight_rate_details (
        freight_rate_id,
        ordem,
        peso_ate,
        valor_kg,
        valor_adicional
      )
      VALUES (
        v_new_rate_id,
        v_detail.ordem,
        v_detail.peso_ate,
        v_detail.valor_kg,
        v_detail.valor_adicional
      );
    END LOOP;
    
    -- Copiar cidades atendidas para esta tarifa (freight_rate_cities)
    FOR v_city IN
      SELECT * FROM freight_rate_cities
      WHERE freight_rate_id = v_rate.id
    LOOP
      v_cities_copied := v_cities_copied + 1;
      
      INSERT INTO freight_rate_cities (
        freight_rate_table_id,
        freight_rate_id,
        city_id,
        delivery_days
      )
      VALUES (
        v_new_table_id,
        v_new_rate_id,
        v_city.city_id,
        v_city.delivery_days
      );
    END LOOP;
  END LOOP;
  
  -- Retornar sucesso
  RETURN jsonb_build_object(
    'success', true,
    'new_table_id', v_new_table_id,
    'rates_copied', v_rates_copied,
    'details_copied', v_details_copied,
    'cities_copied', v_cities_copied
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Em caso de erro, retornar mensagem
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;