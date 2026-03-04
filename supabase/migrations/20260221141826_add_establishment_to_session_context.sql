/*
  # Adicionar establishment_id ao contexto de sessão
  
  1. Problema
    - A função set_session_context não aceita establishment_id
    - Mas precisamos dele para filtrar pedidos por estabelecimento
  
  2. Solução
    - Atualizar função para aceitar p_establishment_id opcional
    - Configurar app.current_establishment_id se fornecido
  
  3. Compatibilidade
    - Mantém compatibilidade com chamadas antigas (sem establishment_id)
    - Novo parâmetro é opcional
*/

-- Recriar função com establishment_id
CREATE OR REPLACE FUNCTION set_session_context(
  p_organization_id UUID,
  p_environment_id UUID,
  p_user_email TEXT DEFAULT NULL,
  p_establishment_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
  -- Validar parâmetros obrigatórios
  IF p_organization_id IS NULL OR p_environment_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'organization_id and environment_id are required'
    );
  END IF;

  -- Configurar variáveis de SESSÃO (true = persiste durante toda a sessão)
  PERFORM set_config('app.current_organization_id', p_organization_id::text, true);
  PERFORM set_config('app.current_environment_id', p_environment_id::text, true);

  -- Configurar establishment_id se fornecido
  IF p_establishment_id IS NOT NULL THEN
    PERFORM set_config('app.current_establishment_id', p_establishment_id::text, true);
  ELSE
    -- Limpar se não fornecido
    PERFORM set_config('app.current_establishment_id', '', true);
  END IF;

  -- Configurar email se fornecido
  IF p_user_email IS NOT NULL THEN
    PERFORM set_config('app.user_email', p_user_email, true);
  END IF;

  -- Configurar timestamp
  PERFORM set_config('app.context_timestamp', EXTRACT(EPOCH FROM NOW())::text, true);

  -- Log de sucesso
  RAISE NOTICE '[SESSION CONTEXT] Configurado: org=%, env=%, estab=%, email=%',
    LEFT(p_organization_id::text, 8),
    LEFT(p_environment_id::text, 8),
    LEFT(COALESCE(p_establishment_id::text, 'null'), 8),
    COALESCE(p_user_email, 'none');

  -- Retornar confirmação
  RETURN json_build_object(
    'success', true,
    'organization_id', p_organization_id,
    'environment_id', p_environment_id,
    'establishment_id', p_establishment_id,
    'user_email', p_user_email,
    'timestamp', EXTRACT(EPOCH FROM NOW())
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to set session context: %', SQLERRM;
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissões
GRANT EXECUTE ON FUNCTION set_session_context(UUID, UUID, TEXT, UUID) TO anon;
GRANT EXECUTE ON FUNCTION set_session_context(UUID, UUID, TEXT, UUID) TO authenticated;

-- Atualizar função de verificação
CREATE OR REPLACE FUNCTION verify_session_context()
RETURNS JSON AS $$
DECLARE
  v_org_id TEXT;
  v_env_id TEXT;
  v_estab_id TEXT;
  v_email TEXT;
  v_timestamp TEXT;
  v_age_seconds NUMERIC;
BEGIN
  -- Obter variáveis de sessão
  v_org_id := current_setting('app.current_organization_id', true);
  v_env_id := current_setting('app.current_environment_id', true);
  v_estab_id := current_setting('app.current_establishment_id', true);
  v_email := current_setting('app.user_email', true);
  v_timestamp := current_setting('app.context_timestamp', true);

  -- Calcular idade
  IF v_timestamp IS NOT NULL THEN
    v_age_seconds := EXTRACT(EPOCH FROM NOW()) - v_timestamp::NUMERIC;
  END IF;

  RETURN json_build_object(
    'has_context', v_org_id IS NOT NULL AND v_env_id IS NOT NULL,
    'organization_id', v_org_id,
    'environment_id', v_env_id,
    'establishment_id', v_estab_id,
    'user_email', v_email,
    'context_age_seconds', v_age_seconds,
    'is_valid', v_org_id IS NOT NULL AND v_env_id IS NOT NULL
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'has_context', false,
      'is_valid', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
