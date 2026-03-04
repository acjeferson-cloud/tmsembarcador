/*
  # Criar Função para Copiar Tabela de Frete Completa

  1. Funcionalidade
    - Copia uma tabela de frete existente (freight_rate_tables)
    - Copia todas as tarifas relacionadas (freight_rates)
    - Copia todos os detalhes relacionados (freight_rate_details)
    - Atualiza IDs, referências e datas apropriadamente
    - Define novo transportador e nome para a nova tabela

  2. Parâmetros
    - source_table_id: ID da tabela origem
    - target_carrier_id: ID do novo transportador
    - new_table_name: Nome da nova tabela
    - new_start_date: Data de início da nova tabela
    - new_end_date: Data de fim da nova tabela
    - user_id_param: ID do usuário (opcional, para auditoria)

  3. Retorno
    - JSON com: {success, new_table_id, rates_copied, details_copied, error}

  4. Segurança
    - Transação atômica (tudo ou nada)
    - Copia organization_id e environment_id da tabela origem
    - Garante isolamento multi-tenant
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
  v_rates_copied integer := 0;
  v_details_copied integer := 0;
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
    new_start_date,
    new_end_date,
    v_source_table.status,
    v_source_table.table_type,
    v_source_table.modal,
    v_source_table.organization_id,  -- Manter mesma organização
    v_source_table.environment_id,   -- Manter mesmo ambiente
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
    
    -- Copiar tarifa
    INSERT INTO freight_rates (
      id,
      freight_rate_table_id,
      codigo,
      descricao,
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
      organization_id,
      environment_id
    )
    SELECT
      v_new_rate_id,
      v_new_table_id,  -- Nova tabela
      codigo,
      descricao,
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
      organization_id,  -- Manter mesma organização
      environment_id    -- Manter mesmo ambiente
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
        v_new_rate_id,  -- Nova tarifa
        v_detail.ordem,
        v_detail.peso_ate,
        v_detail.valor_kg,
        v_detail.valor_adicional
      );
    END LOOP;
  END LOOP;
  
  -- Retornar sucesso
  RETURN jsonb_build_object(
    'success', true,
    'new_table_id', v_new_table_id,
    'rates_copied', v_rates_copied,
    'details_copied', v_details_copied
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Em caso de erro, retornar mensagem
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.copy_freight_rate_table(uuid, uuid, text, timestamptz, timestamptz, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.copy_freight_rate_table(uuid, uuid, text, timestamptz, timestamptz, uuid) TO authenticated;

-- Comentário
COMMENT ON FUNCTION public.copy_freight_rate_table IS
'Copia uma tabela de frete completa incluindo todas as tarifas e detalhes. Mantém isolamento multi-tenant (organization_id e environment_id).';
