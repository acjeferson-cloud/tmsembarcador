/*
  # Adicionar função para buscar estabelecimentos do usuário
  
  1. Problema
    - set_session_context não persiste entre requisições HTTP diferentes
    - Cliente Supabase JS faz requisições separadas: set_session_context → query establishments
    - Cada requisição pega uma conexão diferente do pool
  
  2. Solução
    - Criar uma função RPC que faz tudo em uma única transação
    - Recebe organization_id e environment_id como parâmetros
    - Retorna estabelecimentos filtrados em uma única chamada
  
  3. Segurança
    - Função valida que o usuário pertence à organização
    - Respeita estabelecimentos_permitidos do usuário
    - Security definer para poder ler establishments
*/

-- Função para buscar estabelecimentos do usuário em uma única transação
CREATE OR REPLACE FUNCTION public.get_user_establishments(
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
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_estabelecimentos_permitidos uuid[];
  v_user_org_id uuid;
BEGIN
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
$$;