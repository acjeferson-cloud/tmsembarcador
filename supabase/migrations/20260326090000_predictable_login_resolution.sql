-- Update auth functions to resolve multi-environment logins predictably
-- Ensures that when an email exists in multiple environments, the oldest (primary) profile is authenticated first.

CREATE OR REPLACE FUNCTION validate_user_credentials(
  p_email text,
  p_senha text
)
RETURNS TABLE (
  user_id uuid,
  organization_id uuid,
  environment_id uuid,
  nome text,
  tipo text,
  bloqueado boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.organization_id,
    u.environment_id,
    u.nome,
    u.tipo,
    u.bloqueado
  FROM users u
  WHERE u.email = p_email
    AND u.senha_hash = encode(digest(p_senha, 'sha256'), 'hex')
    AND u.ativo = true
  ORDER BY u.created_at ASC; -- Crucial for multi-tenant mapping priority
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


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
  -- Buscar usuário PREFERINDO O ORIGINAL
  SELECT * INTO v_user
  FROM users
  WHERE email = p_email
    AND ativo = true
    AND (bloqueado = false OR bloqueado IS NULL)
  ORDER BY created_at ASC
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
  FROM validate_user_credentials(p_email, p_password)
  LIMIT 1;
  
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
BEGIN
  -- Validar senha e buscar usuário (ORDER BY vem do validate)
  SELECT * INTO v_user
  FROM validate_user_credentials(p_email, p_password)
  LIMIT 1;

  -- Se não encontrou usuário ou senha inválida
  IF v_user.user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Email ou senha incorretos'
    );
  END IF;

  -- Verificar se está bloqueado
  IF v_user.bloqueado THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário bloqueado. Contate o administrador.'
    );
  END IF;

  -- Retornar dados completos do usuário (PEGANDO O MAIS ANTIGO)
  SELECT * INTO v_user
  FROM users
  WHERE email = p_email AND ativo = true AND (bloqueado = false OR bloqueado IS NULL)
  ORDER BY created_at ASC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário não encontrado'
    );
  END IF;

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
    AND e.ativo = true
  ORDER BY e.codigo
  LIMIT 1;

  -- Atualizar último login e limpar tentativas
  UPDATE users
  SET ultimo_login = now(), tentativas_login = 0
  WHERE id = v_user.id;

  -- Retornar dados agregados
  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user.id,
    'email', v_user.email,
    'name', v_user.nome,
    'codigo', v_user.codigo,
    'foto_perfil_url', v_user.foto_perfil_url,
    'profile', COALESCE(v_user.perfil, 'usuario'),
    'organization_id', v_user.organization_id,
    'organization_code', COALESCE(v_organization.codigo, ''),
    'organization_name', COALESCE(v_organization.nome, ''),
    'environment_id', v_user.environment_id,
    'environment_code', COALESCE(v_environment.codigo, ''),
    'environment_name', COALESCE(v_environment.nome, ''),
    'establishment_id', COALESCE(v_establishment.id::text, ''),
    'establishment_code', COALESCE(v_establishment.codigo, ''),
    'establishment_name', COALESCE(v_establishment.nome_fantasia, ''),
    'permissions', COALESCE(v_user.permissoes, '{}'::jsonb),
    'metadata', COALESCE(v_user.metadata, '{}'::jsonb)
  );
END;
$$;
