/*
  # Criar Função para Apenas Validar Credenciais
  
  1. Função RPC
    - validate_user_credentials_only: Valida email/senha sem fazer login completo
    - Retorna apenas se as credenciais são válidas
    - Permite que o frontend escolha o environment depois
*/

CREATE OR REPLACE FUNCTION validate_user_credentials_only(
  p_email text,
  p_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user record;
  v_validation record;
BEGIN
  -- Buscar usuário
  SELECT * INTO v_user
  FROM users
  WHERE email = p_email
    AND ativo = true
    AND (bloqueado = false OR bloqueado IS NULL)
  LIMIT 1;

  -- Verificar se usuário existe
  IF v_user.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário não encontrado ou inativo'
    );
  END IF;

  -- Verificar senha usando a função validate_user_credentials
  SELECT * INTO v_validation
  FROM validate_user_credentials(p_email, p_password);
  
  IF v_validation.user_id IS NULL THEN
    -- Incrementar tentativas
    PERFORM increment_login_attempts(p_email);
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Senha incorreta'
    );
  END IF;

  -- Verificar se está bloqueado
  IF v_validation.bloqueado = true THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário bloqueado. Entre em contato com o administrador.'
    );
  END IF;

  -- Resetar tentativas de login
  PERFORM reset_login_attempts(p_email);

  -- Retornar sucesso sem dados específicos de environment
  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user.id,
    'email', v_user.email,
    'name', v_user.nome
  );
END;
$$;

-- Permitir acesso público para a função de login
GRANT EXECUTE ON FUNCTION validate_user_credentials_only(text, text) TO anon;
GRANT EXECUTE ON FUNCTION validate_user_credentials_only(text, text) TO authenticated;
