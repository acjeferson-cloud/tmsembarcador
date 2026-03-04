/*
  # Adicionar função de debug para freight_rate_tables

  1. Nova função
    - debug_freight_table_insert: tenta inserir e retorna detalhes do contexto
    
  2. Segurança
    - SECURITY DEFINER para bypassar RLS temporariamente durante debug
*/

-- Função para debug de insert em freight_rate_tables
CREATE OR REPLACE FUNCTION debug_freight_table_insert(
  p_organization_id UUID,
  p_environment_id UUID,
  p_transportador_id UUID,
  p_nome TEXT,
  p_data_inicio DATE,
  p_data_fim DATE,
  p_status TEXT,
  p_table_type TEXT,
  p_modal TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_org_id TEXT;
  v_env_id TEXT;
  v_context_valid BOOLEAN;
  v_new_id UUID;
  v_result JSON;
BEGIN
  -- Obter contexto atual
  v_org_id := current_setting('app.current_organization_id', true);
  v_env_id := current_setting('app.current_environment_id', true);
  v_context_valid := v_org_id IS NOT NULL AND v_env_id IS NOT NULL;

  -- Construir resultado
  v_result := json_build_object(
    'context_org_id', v_org_id,
    'context_env_id', v_env_id,
    'context_valid', v_context_valid,
    'param_org_id', p_organization_id::TEXT,
    'param_env_id', p_environment_id::TEXT,
    'match_org', v_org_id = p_organization_id::TEXT,
    'match_env', v_env_id = p_environment_id::TEXT
  );

  -- Tentar inserir COM RLS
  BEGIN
    INSERT INTO freight_rate_tables (
      organization_id,
      environment_id,
      transportador_id,
      nome,
      data_inicio,
      data_fim,
      status,
      table_type,
      modal
    ) VALUES (
      p_organization_id,
      p_environment_id,
      p_transportador_id,
      p_nome,
      p_data_inicio,
      p_data_fim,
      p_status,
      p_table_type,
      p_modal
    )
    RETURNING id INTO v_new_id;

    v_result := v_result || json_build_object(
      'success', true,
      'inserted_id', v_new_id,
      'message', 'Insert bem sucedido'
    );
  EXCEPTION WHEN OTHERS THEN
    v_result := v_result || json_build_object(
      'success', false,
      'error_code', SQLSTATE,
      'error_message', SQLERRM
    );
  END;

  RETURN v_result;
END;
$$;

-- Permitir acesso anônimo à função de debug
GRANT EXECUTE ON FUNCTION debug_freight_table_insert TO anon, authenticated;
