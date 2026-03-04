/*
  # Criar Função de Login com Environment Específico
  
  1. Função RPC
    - tms_login_with_environment: Faz login selecionando um environment específico
    - Usado após o usuário escolher o environment na tela de seleção
*/

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
  SELECT * INTO v_user
  FROM users
  WHERE email = p_email
    AND environment_id = p_environment_id
    AND ativo = true
    AND (bloqueado = false OR bloqueado IS NULL);

  -- Verificar se usuário existe neste environment
  IF v_user.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário não encontrado neste ambiente'
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
