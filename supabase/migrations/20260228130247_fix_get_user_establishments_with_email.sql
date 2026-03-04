/*
  # Corrigir função get_user_establishments para usar email

  1. Problema
    - A função atual usa p_user_id (UUID) mas o código TypeScript envia p_user_email (text)
    - Isso causa erro 404 pois a assinatura não corresponde
  
  2. Solução
    - Dropar a função antiga
    - Criar nova função que aceita email como parâmetro
    - Retornar todos os campos necessários
*/

-- Dropar função antiga se existir
DROP FUNCTION IF EXISTS get_user_establishments(uuid, uuid, uuid);

-- Criar nova função com assinatura correta
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
  
  -- Se for admin global, retornar TODOS os estabelecimentos da org/env selecionada
  IF v_is_global_admin THEN
    RETURN QUERY
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
    WHERE e.organization_id = p_organization_id
      AND e.environment_id = p_environment_id
    ORDER BY e.codigo;
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
    AND u.environment_id = p_environment_id
    AND u.status = 'ativo';
  
  -- Se usuário não encontrado ou organização diferente, retornar vazio
  IF v_user_org_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Se usuário tem estabelecimentos específicos permitidos, filtrar por eles
  IF v_estabelecimentos_permitidos IS NOT NULL AND array_length(v_estabelecimentos_permitidos, 1) > 0 THEN
    RETURN QUERY
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
    WHERE e.organization_id = p_organization_id
      AND e.environment_id = p_environment_id
      AND e.id = ANY(v_estabelecimentos_permitidos)
    ORDER BY e.codigo;
  ELSE
    -- Se não tem restrição, retornar todos da organização
    RETURN QUERY
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
    WHERE e.organization_id = p_organization_id
      AND e.environment_id = p_environment_id
    ORDER BY e.codigo;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION get_user_establishments(text, uuid, uuid) TO anon;
GRANT EXECUTE ON FUNCTION get_user_establishments(text, uuid, uuid) TO authenticated;

COMMENT ON FUNCTION get_user_establishments IS
  'Retorna estabelecimentos filtrados por org/env usando email do usuário';
