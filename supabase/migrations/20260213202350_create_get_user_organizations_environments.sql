/*
  # Criar função para buscar Organizations e Environments do usuário

  1. Nova Função
    - get_user_organizations_environments(p_user_email)
    - Retorna organizations e seus environments que o usuário tem acesso
    - Admin global vê TODAS as organizations e TODOS os environments
*/

CREATE OR REPLACE FUNCTION get_user_organizations_environments(
  p_user_email text
)
RETURNS TABLE (
  organization_id uuid,
  organization_name text,
  organization_slug text,
  organization_is_active boolean,
  environment_id uuid,
  environment_name text,
  environment_slug text,
  environment_type text,
  environment_is_active boolean
) AS $$
DECLARE
  v_is_global_admin boolean := false;
  v_user_org_id uuid;
  v_user_env_id uuid;
BEGIN
  -- Verificar se é o admin global
  SELECT EXISTS (
    SELECT 1
    FROM users u
    WHERE u.email = p_user_email
      AND u.email = 'admin@gruposmartlog.com.br'
      AND u.perfil = 'administrador'
      AND u.status = 'ativo'
  ) INTO v_is_global_admin;
  
  -- Se for admin global, retornar TODAS as organizations e TODOS os environments
  IF v_is_global_admin THEN
    RETURN QUERY
    EXECUTE format('
      SELECT 
        o.id as organization_id,
        o.name as organization_name,
        o.slug as organization_slug,
        o.is_active as organization_is_active,
        e.id as environment_id,
        e.name as environment_name,
        e.slug as environment_slug,
        e.type as environment_type,
        e.is_active as environment_is_active
      FROM organizations o
      LEFT JOIN environments e ON e.organization_id = o.id
      WHERE o.is_active = true
      ORDER BY o.slug, e.type
    ');
    RETURN;
  END IF;
  
  -- Lógica normal para outros usuários
  -- Buscar organization_id e environment_id do usuário
  SELECT 
    u.organization_id,
    u.environment_id
  INTO 
    v_user_org_id,
    v_user_env_id
  FROM users u
  WHERE u.email = p_user_email;
  
  -- Se usuário não encontrado, retornar vazio
  IF v_user_org_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Retornar apenas a organization e environment do usuário
  RETURN QUERY
  EXECUTE format('
    SELECT 
      o.id as organization_id,
      o.name as organization_name,
      o.slug as organization_slug,
      o.is_active as organization_is_active,
      e.id as environment_id,
      e.name as environment_name,
      e.slug as environment_slug,
      e.type as environment_type,
      e.is_active as environment_is_active
    FROM organizations o
    LEFT JOIN environments e ON e.organization_id = o.id
    WHERE o.id = %L
      AND e.id = %L
      AND o.is_active = true
      AND e.is_active = true
  ', v_user_org_id, v_user_env_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_organizations_environments IS
  'Retorna organizations e environments do usuário. Admin global vê TODAS, outros veem apenas as suas.';
