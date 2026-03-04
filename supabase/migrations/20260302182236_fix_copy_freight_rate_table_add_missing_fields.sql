/*
  # Corrigir função copy_freight_rate_table - adicionar campos obrigatórios

  1. Alterações
    - Adicionar data_inicio e data_fim na cópia de freight_rates
    - Garantir que todos os campos NOT NULL sejam copiados
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
  v_detail RECORD;
  v_city RECORD;
  v_rates_copied integer := 0;
  v_details_copied integer := 0;
  v_cities_copied integer := 0;
BEGIN
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
  LOOP
    -- Gerar novo ID para a tarifa
    v_new_rate_id := gen_random_uuid();
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
    SELECT
      v_new_rate_id,
      v_new_table_id,
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
      COALESCE(data_inicio, new_start_date::date),
      COALESCE(data_fim, new_end_date::date),
      organization_id,
      environment_id
    FROM freight_rates
    WHERE id = v_rate.id;
    
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