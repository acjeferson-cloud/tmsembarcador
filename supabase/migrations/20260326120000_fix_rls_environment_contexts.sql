-- Corrigir funções auxiliares RLS que dependem do email para obter org_id e env_id
-- Garantir que sempre resolvem para o ambiente mais antigo (original) em usuários multi-tenant (SaaS Admins).

-- 1. get_user_context_for_session
DROP FUNCTION IF EXISTS get_user_context_for_session(text);
CREATE OR REPLACE FUNCTION get_user_context_for_session(p_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
BEGIN
  -- Validação básica
  IF p_email IS NULL OR p_email = '' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Email é obrigatório'
    );
  END IF;

  -- Buscar dados do usuário
  SELECT json_build_object(
    'success', true,
    'organization_id', organization_id,
    'environment_id', environment_id,
    'user_id', id,
    'email', email,
    'codigo', codigo
  )
  INTO v_result
  FROM users
  WHERE email = p_email
    AND status = 'ativo'
  ORDER BY created_at ASC  -- CRÍTICO: Sempre retorna o ambiente original
  LIMIT 1;

  -- Se não encontrou
  IF v_result IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não encontrado ou inativo'
    );
  END IF;

  RETURN v_result;
END;
$$;

-- 2. get_current_organization_id
CREATE OR REPLACE FUNCTION get_current_organization_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- 1. Tentar pegar do session context (setado no login)
  BEGIN
    v_org_id := current_setting('app.current_organization_id', true)::uuid;
    IF v_org_id IS NOT NULL THEN
      RETURN v_org_id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignorar erro se não existe
  END;
  
  -- 2. Tentar pegar do JWT (para Supabase Auth real)
  BEGIN
    v_org_id := (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid;
    IF v_org_id IS NOT NULL THEN
      RETURN v_org_id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  -- 3. Fallback: buscar pelo email do usuário no banco
  BEGIN
    SELECT organization_id INTO v_org_id
    FROM users
    WHERE email = auth.email()
    ORDER BY created_at ASC  -- CRÍTICO: Prevenir vazamento ou bug de null rows
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  RETURN v_org_id;
END;
$$;

-- 3. get_current_environment_id
CREATE OR REPLACE FUNCTION get_current_environment_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_env_id UUID;
BEGIN
  -- 1. Tentar pegar do session context (setado no login)
  BEGIN
    v_env_id := current_setting('app.current_environment_id', true)::uuid;
    IF v_env_id IS NOT NULL THEN
      RETURN v_env_id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  -- 2. Tentar pegar do JWT (para Supabase Auth real)
  BEGIN
    v_env_id := (auth.jwt() -> 'app_metadata' ->> 'environment_id')::uuid;
    IF v_env_id IS NOT NULL THEN
      RETURN v_env_id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  -- 3. Fallback: buscar pelo email do usuário no banco
  BEGIN
    SELECT environment_id INTO v_env_id
    FROM users
    WHERE email = auth.email()
    ORDER BY created_at ASC  -- CRÍTICO: Prevenir vazamento ou bug de null rows
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  RETURN v_env_id;
END;
$$;
