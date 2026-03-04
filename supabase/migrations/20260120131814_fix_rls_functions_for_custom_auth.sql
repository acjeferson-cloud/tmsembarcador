/*
  # Corrigir Funções RLS para Auth Customizado
  
  ## Problema:
  - Sistema usa login customizado (não Supabase Auth real)
  - JWT está vazio, funções RLS retornam NULL
  - Policy "Public read access" permite ver TUDO (brecha de segurança)
  
  ## Solução:
  - Remover policy permissiva de establishments
  - Usar session context (set_config) para passar org/env
  - Atualizar funções RLS para buscar do context primeiro
*/

-- =====================================================
-- 1. REMOVER POLICY PERMISSIVA (BRECHA DE SEGURANÇA)
-- =====================================================

DROP POLICY IF EXISTS "Public read access for tracking" ON establishments;

-- =====================================================
-- 2. ATUALIZAR FUNÇÕES RLS PARA USAR SESSION CONTEXT
-- =====================================================

-- Função para obter organization_id
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
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  RETURN v_org_id;
END;
$$;

-- Função para obter environment_id
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
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  RETURN v_env_id;
END;
$$;

-- =====================================================
-- 3. CRIAR RPC PARA SETAR SESSION CONTEXT
-- =====================================================

CREATE OR REPLACE FUNCTION set_session_context(
  p_organization_id UUID,
  p_environment_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Setar organization_id e environment_id no session context
  -- Isso permite que as funções RLS peguem esses valores
  PERFORM set_config('app.current_organization_id', p_organization_id::text, false);
  PERFORM set_config('app.current_environment_id', p_environment_id::text, false);
END;
$$;

-- Comentários
COMMENT ON FUNCTION set_session_context IS 'Define organization_id e environment_id no contexto da sessão para RLS funcionar com auth customizado';
COMMENT ON FUNCTION get_current_organization_id IS 'Obtém organization_id do session context (prioritário), JWT ou banco';
COMMENT ON FUNCTION get_current_environment_id IS 'Obtém environment_id do session context (prioritário), JWT ou banco';
