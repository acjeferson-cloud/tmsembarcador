/*
  # Corrigir get_user_allowed_establishments para Session Context
  
  ## Problema:
  - Função usa auth.jwt() que está vazio em auth customizado
  - Não consegue identificar o usuário via session context
  
  ## Solução:
  - Adicionar session variable para email do usuário
  - Atualizar função para usar session context primeiro
*/

-- =====================================================
-- RPC PARA SETAR EMAIL NO SESSION CONTEXT
-- =====================================================

CREATE OR REPLACE FUNCTION set_session_context(
  p_organization_id UUID,
  p_environment_id UUID,
  p_user_email TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Setar organization_id, environment_id e email no session context
  PERFORM set_config('app.current_organization_id', p_organization_id::text, false);
  PERFORM set_config('app.current_environment_id', p_environment_id::text, false);
  
  -- Setar email se fornecido
  IF p_user_email IS NOT NULL THEN
    PERFORM set_config('app.current_user_email', p_user_email, false);
  END IF;
END;
$$;

-- =====================================================
-- ATUALIZAR get_user_allowed_establishments
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_allowed_establishments()
RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_establishments UUID[];
  user_org_id UUID;
  user_env_id UUID;
  user_email TEXT;
BEGIN
  user_org_id := get_current_organization_id();
  user_env_id := get_current_environment_id();
  
  IF user_org_id IS NULL OR user_env_id IS NULL THEN
    RETURN ARRAY[]::UUID[];
  END IF;
  
  -- Tentar pegar email do session context primeiro
  BEGIN
    user_email := current_setting('app.current_user_email', true);
  EXCEPTION WHEN OTHERS THEN
    user_email := NULL;
  END;
  
  -- Se não tem email no session context, tentar do JWT
  IF user_email IS NULL THEN
    BEGIN
      user_email := (auth.jwt() ->> 'email')::text;
    EXCEPTION WHEN OTHERS THEN
      user_email := NULL;
    END;
  END IF;
  
  -- Se não tem email, tentar auth.email()
  IF user_email IS NULL THEN
    BEGIN
      user_email := auth.email();
    EXCEPTION WHEN OTHERS THEN
      user_email := NULL;
    END;
  END IF;
  
  -- Se ainda não tem email, retornar vazio
  IF user_email IS NULL THEN
    RETURN ARRAY[]::UUID[];
  END IF;
  
  -- Buscar estabelecimentos permitidos do usuário
  SELECT estabelecimentos_permitidos
  INTO user_establishments
  FROM users
  WHERE email = user_email
    AND organization_id = user_org_id
    AND environment_id = user_env_id
  LIMIT 1;
  
  RETURN COALESCE(user_establishments, ARRAY[]::UUID[]);
END;
$$;

-- Comentários
COMMENT ON FUNCTION set_session_context(UUID, UUID, TEXT) IS 
'Define organization_id, environment_id e email do usuário no contexto da sessão para RLS funcionar';

COMMENT ON FUNCTION get_user_allowed_establishments() IS 
'Obtém lista de estabelecimentos permitidos do usuário via session context (prioritário), JWT ou auth.email()';
