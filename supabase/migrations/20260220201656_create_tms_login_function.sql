/*
  # Criar Função de Login TMS
  
  Cria a função tms_login que o frontend está chamando para autenticação
*/

-- Função principal de login TMS
CREATE OR REPLACE FUNCTION tms_login(
  p_email text,
  p_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user record;
  v_organization record;
  v_environment record;
  v_establishment record;
  v_password_match boolean;
BEGIN
  -- Buscar usuário
  SELECT * INTO v_user
  FROM users
  WHERE email = p_email
    AND ativo = true
    AND (bloqueado = false OR bloqueado IS NULL);

  -- Verificar se usuário existe
  IF v_user.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário não encontrado ou inativo'
    );
  END IF;

  -- Verificar senha
  SELECT validate_user_credentials(p_email, p_password) INTO v_password_match;
  
  IF NOT v_password_match THEN
    -- Incrementar tentativas
    PERFORM increment_login_attempts(p_email);
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Senha incorreta'
    );
  END IF;

  -- Resetar tentativas de login
  PERFORM reset_login_attempts(p_email);

  -- Buscar organização
  SELECT * INTO v_organization
  FROM saas_organizations
  WHERE id = v_user.organization_id;

  -- Buscar ambiente
  SELECT * INTO v_environment
  FROM saas_environments
  WHERE id = v_user.environment_id;

  -- Buscar estabelecimento padrão (primeiro disponível para o usuário)
  SELECT e.* INTO v_establishment
  FROM establishments e
  WHERE e.organization_id = v_user.organization_id
    AND e.environment_id = v_user.environment_id
    AND e.status = 'ativo'
  ORDER BY e.codigo
  LIMIT 1;

  -- Atualizar último login
  UPDATE users
  SET ultimo_login = now()
  WHERE id = v_user.id;

  -- Retornar dados do usuário
  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user.id,
    'email', v_user.email,
    'name', v_user.nome,
    'codigo', v_user.codigo,
    'profile', COALESCE(v_user.perfil, 'usuario'),
    'organization_id', v_user.organization_id,
    'organization_code', v_organization.codigo,
    'organization_name', v_organization.nome,
    'environment_id', v_user.environment_id,
    'environment_code', v_environment.codigo,
    'environment_name', v_environment.nome,
    'establishment_id', v_establishment.id,
    'establishment_code', v_establishment.codigo,
    'establishment_name', v_establishment.nome_fantasia,
    'permissions', COALESCE(v_user.permissoes, '{}'::jsonb),
    'metadata', COALESCE(v_user.metadata, '{}'::jsonb)
  );
END;
$$;

-- Dar permissão para usuários anônimos fazerem login
GRANT EXECUTE ON FUNCTION tms_login(text, text) TO anon;
GRANT EXECUTE ON FUNCTION tms_login(text, text) TO authenticated;
