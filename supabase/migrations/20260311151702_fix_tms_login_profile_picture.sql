CREATE OR REPLACE FUNCTION tms_login(
  p_email text,
  p_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$$
DECLARE
  v_user record;
  v_organization record;
  v_environment record;
  v_establishment record;
BEGIN
  -- Validar senha e buscar usuário
  SELECT * INTO v_user
  FROM validate_user_credentials(p_email, p_password);

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

  -- Retornar dados completos do usuário
  SELECT * INTO v_user
  FROM users
  WHERE email = p_email AND ativo = true AND (bloqueado = false OR bloqueado IS NULL)
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
$$$;

GRANT EXECUTE ON FUNCTION tms_login(text, text) TO anon;
GRANT EXECUTE ON FUNCTION tms_login(text, text) TO authenticated;
