/*
  # Adicionar codigo à Função get_user_context_for_session

  ## Problema
  - InnovationsModal precisa do campo "codigo" do usuário
  - Query direta está sendo bloqueada por RLS
  - Causa erro: "Error fetching user codigo: null"

  ## Solução
  - Atualizar função get_user_context_for_session para incluir "codigo"
  - Mantém SECURITY DEFINER para bypassar RLS
  - Retorna todos os campos necessários de uma vez

  ## Mudanças
  - Adiciona campo "codigo" ao retorno da função
*/

-- Atualizar função para incluir codigo
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
    'codigo', codigo  -- Adicionar codigo
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

-- Comentário atualizado
COMMENT ON FUNCTION get_user_context_for_session IS 
'Busca organization_id, environment_id e codigo do usuário para configurar session context inicial. Usa SECURITY DEFINER para bypassar RLS.';
