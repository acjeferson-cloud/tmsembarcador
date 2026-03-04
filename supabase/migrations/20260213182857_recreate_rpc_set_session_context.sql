/*
  # Funções RPC para Configurar Session Context

  1. Problema
    - O cliente JavaScript não consegue configurar variáveis de sessão SQL diretamente
    - As políticas RLS dependem de get_session_organization_id() e get_session_environment_id()
    - Sem contexto configurado, NENHUMA query retorna dados

  2. Solução
    - Criar RPC function para configurar o contexto da sessão
    - Chamar essa função após login
    - Contexto fica ativo durante toda a sessão

  3. Funções Criadas
    - set_session_context(org_id, env_id) - Configura o contexto
    - get_current_session_context() - Retorna contexto atual
    - get_user_organization_and_environment(email) - Retorna org + env do usuário
*/

-- =====================================================
-- REMOVER FUNÇÕES EXISTENTES
-- =====================================================

DROP FUNCTION IF EXISTS set_session_context(UUID, UUID);
DROP FUNCTION IF EXISTS get_current_session_context();
DROP FUNCTION IF EXISTS get_user_organization_and_environment(TEXT);

-- =====================================================
-- FUNÇÃO PARA CONFIGURAR SESSION CONTEXT
-- =====================================================

CREATE FUNCTION set_session_context(
  p_organization_id UUID,
  p_environment_id UUID
)
RETURNS JSON AS $$
BEGIN
  -- Configurar variáveis de sessão
  PERFORM set_config('app.organization_id', p_organization_id::text, false);
  PERFORM set_config('app.environment_id', p_environment_id::text, false);
  
  -- Retornar confirmação
  RETURN json_build_object(
    'success', true,
    'organization_id', p_organization_id,
    'environment_id', p_environment_id,
    'message', 'Session context configured successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNÇÃO PARA OBTER SESSION CONTEXT ATUAL
-- =====================================================

CREATE FUNCTION get_current_session_context()
RETURNS JSON AS $$
DECLARE
  v_org_id TEXT;
  v_env_id TEXT;
BEGIN
  -- Obter variáveis de sessão
  v_org_id := current_setting('app.organization_id', true);
  v_env_id := current_setting('app.environment_id', true);
  
  RETURN json_build_object(
    'organization_id', v_org_id,
    'environment_id', v_env_id,
    'has_context', v_org_id IS NOT NULL AND v_env_id IS NOT NULL
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'organization_id', null,
      'environment_id', null,
      'has_context', false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNÇÃO HELPER PARA LOGIN (Retorna org + env do usuário)
-- =====================================================

CREATE FUNCTION get_user_organization_and_environment(
  p_email TEXT
)
RETURNS JSON AS $$
DECLARE
  v_result RECORD;
BEGIN
  -- Buscar organization_id e environment_id do usuário (SEM FILTRO RLS)
  SELECT 
    organization_id,
    environment_id,
    id as user_id,
    name as user_name,
    status
  INTO v_result
  FROM users
  WHERE LOWER(email) = LOWER(p_email)
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;
  
  IF v_result.status != 'ativo' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User is not active',
      'status', v_result.status
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'organization_id', v_result.organization_id,
    'environment_id', v_result.environment_id,
    'user_id', v_result.user_id,
    'user_name', v_result.user_name
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permitir acesso anon a essas funções
GRANT EXECUTE ON FUNCTION set_session_context(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_current_session_context() TO anon;
GRANT EXECUTE ON FUNCTION get_user_organization_and_environment(TEXT) TO anon;
