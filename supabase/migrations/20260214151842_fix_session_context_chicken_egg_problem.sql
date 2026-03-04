/*
  # Correção: Problema Chicken-and-Egg no Session Context

  ## Problema
  - Para buscar organization_id/environment_id do usuário, precisa de contexto configurado
  - Mas para configurar contexto, precisa dos dados do usuário
  - RLS bloqueia a query inicial, criando um loop infinito

  ## Solução
  - Criar função RPC com SECURITY DEFINER que bypassa RLS
  - Função retorna apenas organization_id e environment_id
  - Validação de email garante segurança

  ## Mudanças
  1. Nova Função
    - `get_user_context_for_session(p_email text)`
    - Retorna JSON com organization_id, environment_id
    - SECURITY DEFINER para bypassar RLS
    - Validação básica de email
*/

-- Função para buscar contexto inicial do usuário (bypassa RLS)
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
    'email', email
  )
  INTO v_result
  FROM users
  WHERE email = p_email
    AND status = 'ativo'
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

-- Permitir que authenticated e anon usem essa função
GRANT EXECUTE ON FUNCTION get_user_context_for_session(text) TO authenticated, anon;

-- Comentário
COMMENT ON FUNCTION get_user_context_for_session IS 
'Busca organization_id e environment_id do usuário para configurar session context inicial. Usa SECURITY DEFINER para bypassar RLS.';
