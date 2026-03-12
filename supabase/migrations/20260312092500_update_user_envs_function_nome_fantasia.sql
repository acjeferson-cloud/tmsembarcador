-- Adiciona nome_fantasia na busca de ambientes ao invés da razão social
CREATE OR REPLACE FUNCTION get_user_available_environments(p_email text)
RETURNS TABLE (
  organization_id uuid,
  organization_codigo text,
  organization_nome text,
  environment_id uuid,
  environment_codigo text,
  environment_nome text,
  environment_tipo text,
  environment_logo_url text,
  establishments_count bigint,
  user_id uuid,
  user_nome text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    o.id as organization_id,
    o.codigo as organization_codigo,
    COALESCE(o.nome_fantasia, o.nome) as organization_nome,
    e.id as environment_id,
    e.codigo as environment_codigo,
    e.nome as environment_nome,
    e.tipo as environment_tipo,
    e.logo_url as environment_logo_url,
    (
      SELECT COUNT(*)
      FROM establishments est
      WHERE est.environment_id = e.id
        AND est.ativo = true
    ) as establishments_count,
    u.id as user_id,
    u.nome as user_nome
  FROM users u
  JOIN saas_organizations o ON o.id = u.organization_id
  JOIN saas_environments e ON e.id = u.environment_id
  WHERE u.email = p_email
    AND u.ativo = true
    AND (u.bloqueado = false OR u.bloqueado IS NULL)
    AND o.status = 'ativo'
    AND e.status = 'ativo'
  ORDER BY o.codigo, e.tipo, e.codigo;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_available_environments(text) TO anon;
GRANT EXECUTE ON FUNCTION get_user_available_environments(text) TO authenticated;
