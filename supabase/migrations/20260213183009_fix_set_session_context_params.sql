/*
  # Corrigir Parâmetros de set_session_context

  1. Problema
    - O código está chamando set_session_context com 3 parâmetros
    - A função só aceita 2 parâmetros
    - Precisa aceitar p_user_email para compatibilidade

  2. Solução
    - Recriar a função para aceitar 3 parâmetros
    - Manter compatibilidade com código existente
*/

DROP FUNCTION IF EXISTS set_session_context(UUID, UUID);
DROP FUNCTION IF EXISTS set_session_context(UUID, UUID, TEXT);

CREATE FUNCTION set_session_context(
  p_organization_id UUID,
  p_environment_id UUID,
  p_user_email TEXT DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
  -- Configurar variáveis de sessão
  PERFORM set_config('app.organization_id', p_organization_id::text, false);
  PERFORM set_config('app.environment_id', p_environment_id::text, false);
  
  -- Opcionalmente configurar email (não usado nas políticas, mas útil para debug)
  IF p_user_email IS NOT NULL THEN
    PERFORM set_config('app.user_email', p_user_email, false);
  END IF;
  
  -- Retornar confirmação
  RETURN json_build_object(
    'success', true,
    'organization_id', p_organization_id,
    'environment_id', p_environment_id,
    'user_email', p_user_email,
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

GRANT EXECUTE ON FUNCTION set_session_context(UUID, UUID, TEXT) TO anon;
