/*
  # Corrigir função get_user_establishments - coluna status inexistente

  ## Problema
  A função filtrava usuários com `u.status = 'ativo' OR u.status IS NULL OR u.status != 'bloqueado'`
  mas a tabela `users` não tem coluna `status`. As colunas reais são:
    - `ativo` (boolean)
    - `bloqueado` (boolean)

  Isso fazia com que a condição WHERE nunca retornasse linhas para usuários normais
  (apenas o admin global passava, pois tem seu próprio caminho).

  ## Solução
  Substituir o filtro por `u.ativo = true AND (u.bloqueado = false OR u.bloqueado IS NULL)`,
  que são as colunas reais da tabela.
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
  v_estabelecimentos_permitidos jsonb;
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
      AND u.ativo = true
      AND (u.bloqueado = false OR u.bloqueado IS NULL)
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
      e.nome_fantasia AS fantasia,
      e.logradouro AS endereco,
      e.bairro,
      e.cep,
      e.cidade,
      e.estado,
      e.tipo,
      e.codigo AS tracking_prefix,
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
  -- CORREÇÃO: usar as colunas reais `ativo` e `bloqueado` em vez de `status`
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
    AND u.ativo = true
    AND (u.bloqueado = false OR u.bloqueado IS NULL);

  -- Se usuário não encontrado ou organização diferente, retornar vazio
  IF v_user_org_id IS NULL THEN
    RETURN;
  END IF;

  -- Se usuário tem estabelecimentos específicos permitidos, filtrar por eles
  IF v_estabelecimentos_permitidos IS NOT NULL
     AND jsonb_array_length(v_estabelecimentos_permitidos) > 0 THEN
    RETURN QUERY
    SELECT
      e.id,
      e.codigo,
      e.cnpj,
      e.inscricao_estadual,
      e.razao_social,
      e.nome_fantasia AS fantasia,
      e.logradouro AS endereco,
      e.bairro,
      e.cep,
      e.cidade,
      e.estado,
      e.tipo,
      e.codigo AS tracking_prefix,
      e.organization_id,
      e.environment_id
    FROM establishments e
    WHERE e.organization_id = p_organization_id
      AND e.environment_id = p_environment_id
      AND e.id::text IN (
        SELECT jsonb_array_elements_text(v_estabelecimentos_permitidos)
      )
    ORDER BY e.codigo;
  ELSE
    -- Se não tem restrição (array vazio ou null), retornar todos da organização
    RETURN QUERY
    SELECT
      e.id,
      e.codigo,
      e.cnpj,
      e.inscricao_estadual,
      e.razao_social,
      e.nome_fantasia AS fantasia,
      e.logradouro AS endereco,
      e.bairro,
      e.cep,
      e.cidade,
      e.estado,
      e.tipo,
      e.codigo AS tracking_prefix,
      e.organization_id,
      e.environment_id
    FROM establishments e
    WHERE e.organization_id = p_organization_id
      AND e.environment_id = p_environment_id
    ORDER BY e.codigo;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_establishments IS
  'Retorna estabelecimentos filtrados por org/env usando email do usuário. Corrigido para usar colunas ativo/bloqueado em vez de status.';
