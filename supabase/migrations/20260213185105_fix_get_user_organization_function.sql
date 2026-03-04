/*
  # Corrigir Função get_user_organization_and_environment
  
  1. Problema
    - Função estava tentando acessar coluna "name"
    - A coluna correta é "nome"
    - Causando erro no login e session context não sendo configurado
    
  2. Correção
    - Usar "nome" ao invés de "name"
    - Garantir que função retorna dados corretos
*/

DROP FUNCTION IF EXISTS get_user_organization_and_environment(TEXT);

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
    nome as user_name,  -- CORRIGIDO: "nome" ao invés de "name"
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

GRANT EXECUTE ON FUNCTION get_user_organization_and_environment(TEXT) TO anon;
