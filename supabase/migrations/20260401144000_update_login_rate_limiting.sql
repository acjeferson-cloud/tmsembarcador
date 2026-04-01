-- Update auth functions to enforce 15 minute temporary block after 5 failed attempts

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
  -- Buscar usuário, incluindo os bloqueados temporariamente e permanentemente
  SELECT * INTO v_user
  FROM users
  WHERE email = p_email
    AND ativo = true
  ORDER BY created_at ASC
  LIMIT 1;

  -- Verificar se usuário existe
  IF v_user.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário não encontrado ou inativo'
    );
  END IF;

  -- Bloqueio permanente (via UI/administrador) se tentativas < 5
  IF v_user.bloqueado = true AND COALESCE(v_user.tentativas_login, 0) < 5 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário bloqueado. Entre em contato com o administrador.'
    );
  END IF;

  -- Bloqueio rate-limiting: Falhou 5 vezes e a última tentativa foi há menos de 15 minutos
  IF COALESCE(v_user.tentativas_login, 0) >= 5 AND COALESCE(v_user.updated_at, now()) > now() - interval '15 minutes' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Muitas tentativas falhas. Conta bloqueada temporariamente. Tente novamente em 15 minutos.'
    );
  END IF;

  -- Se passou 15 minutos desde o último rate-limit ou o contator não estava estourado, podemos zerar localmente para o fluxo normal
  IF COALESCE(v_user.tentativas_login, 0) > 0 AND COALESCE(v_user.updated_at, now()) <= now() - interval '15 minutes' THEN
    v_user.tentativas_login := 0;
  END IF;

  -- Se o rate_limit tinha estourado (>=5) mas passou os 15 min, tem q desbloquear
  IF v_user.bloqueado = true AND v_user.tentativas_login = 0 THEN
      UPDATE users SET bloqueado = false WHERE id = v_user.id;
  END IF;

  -- Verificar senha
  SELECT * INTO v_validation
  FROM validate_user_credentials(p_email, p_password)
  LIMIT 1;
  
  IF v_validation.user_id IS NULL THEN
    -- Incrementar tentativas. Se foi resetada localmente, começa do 1.
    IF v_user.tentativas_login = 0 THEN
      UPDATE users SET tentativas_login = 1, updated_at = now() WHERE id = v_user.id;
    ELSE
      PERFORM increment_login_attempts(p_email);
    END IF;
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Email ou senha incorretos'
    );
  END IF;

  -- Resetar tentativas de login com sucesso
  PERFORM reset_login_attempts(p_email);

  -- Retornar sucesso
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
  v_validation record;
  v_organization record;
  v_environment record;
  v_establishment record;
BEGIN
  -- Replicando a verificação de rate-limit aqui, já que esta função faz o login completo direto
  SELECT * INTO v_user
  FROM users
  WHERE email = p_email AND ativo = true
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_user.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não encontrado ou inativo');
  END IF;

  IF v_user.bloqueado = true AND COALESCE(v_user.tentativas_login, 0) < 5 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário bloqueado. Entre em contato com o administrador.');
  END IF;

  IF COALESCE(v_user.tentativas_login, 0) >= 5 AND COALESCE(v_user.updated_at, now()) > now() - interval '15 minutes' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Muitas tentativas falhas. Conta bloqueada temporariamente. Tente novamente em 15 minutos.');
  END IF;

  IF COALESCE(v_user.tentativas_login, 0) > 0 AND COALESCE(v_user.updated_at, now()) <= now() - interval '15 minutes' THEN
    v_user.tentativas_login := 0;
  END IF;

  IF v_user.bloqueado = true AND v_user.tentativas_login = 0 THEN
      UPDATE users SET bloqueado = false WHERE id = v_user.id;
  END IF;

  SELECT * INTO v_validation
  FROM validate_user_credentials(p_email, p_password)
  LIMIT 1;

  IF v_validation.user_id IS NULL THEN
    IF v_user.tentativas_login = 0 THEN
      UPDATE users SET tentativas_login = 1, updated_at = now() WHERE id = v_user.id;
    ELSE
      PERFORM increment_login_attempts(p_email);
    END IF;
    RETURN jsonb_build_object('success', false, 'error', 'Email ou senha incorretos');
  END IF;

  -- Buscar os dados complementares
  SELECT * INTO v_organization FROM saas_organizations WHERE id = v_user.organization_id;
  SELECT * INTO v_environment FROM saas_environments WHERE id = v_user.environment_id;
  
  SELECT e.* INTO v_establishment
  FROM establishments e
  WHERE e.organization_id = v_user.organization_id
    AND e.environment_id = v_user.environment_id
    AND e.ativo = true
  ORDER BY e.codigo
  LIMIT 1;

  -- Atualizar o sucesso
  UPDATE users
  SET ultimo_login = now(), tentativas_login = 0, updated_at = now()
  WHERE id = v_user.id;

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


CREATE OR REPLACE FUNCTION tms_login_with_environment(
  p_email text,
  p_environment_id uuid
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
  -- Buscar usuário no environment específico
  -- Incluímos também bloqueados temporários para check de rate-limit
  SELECT * INTO v_user
  FROM users
  WHERE email = p_email
    AND environment_id = p_environment_id
    AND ativo = true;

  -- Verificar se usuário existe neste environment
  IF v_user.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário não encontrado neste ambiente'
    );
  END IF;

  -- Bloqueio permanente (via UI/administrador) se tentativas < 5
  IF v_user.bloqueado = true AND COALESCE(v_user.tentativas_login, 0) < 5 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário bloqueado. Entre em contato com o administrador.'
    );
  END IF;

  -- Bloqueio rate-limiting
  IF COALESCE(v_user.tentativas_login, 0) >= 5 AND COALESCE(v_user.updated_at, now()) > now() - interval '15 minutes' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Muitas tentativas falhas. Conta bloqueada temporariamente. Tente novamente em 15 minutos.'
    );
  END IF;

  -- Se o rate_limit tinha estourado mas passou 15 min, desbloqueia silenciosamente
  IF COALESCE(v_user.tentativas_login, 0) > 0 AND COALESCE(v_user.updated_at, now()) <= now() - interval '15 minutes' THEN
    v_user.tentativas_login := 0;
    IF v_user.bloqueado = true THEN
      UPDATE users SET bloqueado = false WHERE id = v_user.id;
    END IF;
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

  -- Atualizar último login e zerar tentativas_login e bloqueado caso existisse do db
  UPDATE users
  SET ultimo_login = now(),
      tentativas_login = 0,
      bloqueado = false,
      updated_at = now()
  WHERE id = v_user.id;

  -- Retornar dados do usuário
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

-- Permitir acesso público
GRANT EXECUTE ON FUNCTION tms_login_with_environment(text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION tms_login_with_environment(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_user_credentials_only(text, text) TO anon;
GRANT EXECUTE ON FUNCTION validate_user_credentials_only(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION tms_login(text, text) TO anon;
GRANT EXECUTE ON FUNCTION tms_login(text, text) TO authenticated;
