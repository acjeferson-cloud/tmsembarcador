/*
  # Corrigir get_user_establishments para Filtrar por Org/Env

  1. Problema
    - Admin global vê TODOS os estabelecimentos, independente de org/env selecionada
    - Correto: Admin pode ESCOLHER qualquer org/env, mas depois vê APENAS estabelecimentos daquela org/env
  
  2. Solução
    - Remover bypass para admin global
    - SEMPRE filtrar por organization_id e environment_id passados
    - Vantagem do admin: pode selecionar QUALQUER org/env no seletor anterior
*/

CREATE OR REPLACE FUNCTION get_user_establishments(
  p_user_email text,
  p_organization_id uuid,
  p_environment_id uuid
)
RETURNS TABLE (
  id uuid,
  codigo text,
  cnpj text,
  inscricao_estadual text,
  razao_social text,
  fantasia text,
  endereco text,
  bairro text,
  cep text,
  cidade text,
  estado text,
  tipo text,
  tracking_prefix text,
  organization_id uuid,
  environment_id uuid
) AS $$
DECLARE
  v_estabelecimentos_permitidos uuid[];
  v_user_org_id uuid;
  v_is_global_admin boolean := false;
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
  
  -- IMPORTANTE: Admin global pode selecionar qualquer org/env,
  -- mas depois disso vê APENAS estabelecimentos daquela org/env
  -- Não retorna TODOS, respeita o filtro!
  
  -- Se for admin global, retornar TODOS os estabelecimentos da org/env selecionada
  -- (ignorar establecimentos_permitidos, pois admin global tem acesso a todos da org/env)
  IF v_is_global_admin THEN
    RETURN QUERY
    EXECUTE format('
      SELECT 
        e.id,
        e.codigo,
        e.cnpj,
        e.inscricao_estadual,
        e.razao_social,
        e.fantasia,
        e.endereco,
        e.bairro,
        e.cep,
        e.cidade,
        e.estado,
        e.tipo,
        e.tracking_prefix,
        e.organization_id,
        e.environment_id
      FROM establishments e
      WHERE e.organization_id = %L
        AND e.environment_id = %L
      ORDER BY e.codigo
    ', p_organization_id, p_environment_id);
    RETURN;
  END IF;
  
  -- Lógica normal para outros usuários
  -- Validar que o usuário pertence à organização informada
  SELECT 
    u.organization_id,
    u.estabelecimentos_permitidos
  INTO 
    v_user_org_id,
    v_estabelecimentos_permitidos
  FROM users u
  WHERE u.email = p_user_email
    AND u.organization_id = p_organization_id
    AND u.environment_id = p_environment_id;
  
  -- Se usuário não encontrado ou organização diferente, retornar vazio
  IF v_user_org_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Se usuário tem estabelecimentos específicos permitidos, filtrar por eles
  IF v_estabelecimentos_permitidos IS NOT NULL AND array_length(v_estabelecimentos_permitidos, 1) > 0 THEN
    RETURN QUERY
    EXECUTE format('
      SELECT 
        e.id,
        e.codigo,
        e.cnpj,
        e.inscricao_estadual,
        e.razao_social,
        e.fantasia,
        e.endereco,
        e.bairro,
        e.cep,
        e.cidade,
        e.estado,
        e.tipo,
        e.tracking_prefix,
        e.organization_id,
        e.environment_id
      FROM establishments e
      WHERE e.organization_id = %L
        AND e.environment_id = %L
        AND e.id = ANY(%L::uuid[])
      ORDER BY e.codigo
    ', p_organization_id, p_environment_id, v_estabelecimentos_permitidos);
  ELSE
    -- Se não tem restrição, retornar todos da organização
    RETURN QUERY
    EXECUTE format('
      SELECT 
        e.id,
        e.codigo,
        e.cnpj,
        e.inscricao_estadual,
        e.razao_social,
        e.fantasia,
        e.endereco,
        e.bairro,
        e.cep,
        e.cidade,
        e.estado,
        e.tipo,
        e.tracking_prefix,
        e.organization_id,
        e.environment_id
      FROM establishments e
      WHERE e.organization_id = %L
        AND e.environment_id = %L
      ORDER BY e.codigo
    ', p_organization_id, p_environment_id);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_establishments IS
  'Retorna estabelecimentos filtrados por org/env. Admin global pode acessar qualquer org/env, mas vê apenas estabelecimentos daquela org/env selecionada.';
