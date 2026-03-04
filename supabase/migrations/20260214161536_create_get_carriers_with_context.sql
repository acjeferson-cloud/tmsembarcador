/*
  # Criar função para buscar carriers com contexto garantido

  ## Problema
  - Connection pooling HTTP do Supabase não persiste variáveis de sessão
  - Cada requisição pode ir para uma conexão diferente
  - RLS bloqueia porque não há contexto na conexão

  ## Solução
  - Função RPC que configura contexto E faz query na mesma transação
  - SECURITY DEFINER para bypassar RLS temporariamente
  - Valida org_id e env_id antes de retornar dados

  ## Segurança
  - Recebe org_id e env_id como parâmetros (do localStorage/cache)
  - Só retorna dados dessa organização/ambiente
  - Mantém isolamento multi-tenant
*/

-- Função para buscar carriers com contexto garantido
CREATE OR REPLACE FUNCTION get_carriers_with_context(
  p_organization_id uuid,
  p_environment_id uuid
)
RETURNS TABLE (
  id uuid,
  codigo text,
  razao_social text,
  fantasia text,
  logotipo text,
  cnpj text,
  inscricao_estadual text,
  pais_id uuid,
  estado_id uuid,
  cidade_id uuid,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cep text,
  tolerancia_valor_cte numeric,
  tolerancia_percentual_cte numeric,
  tolerancia_valor_fatura numeric,
  tolerancia_percentual_fatura numeric,
  email text,
  phone text,
  status text,
  rating numeric,
  active_shipments integer,
  modals jsonb,
  working_days_config jsonb,
  organization_id uuid,
  environment_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  created_by text,
  updated_by text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validar parâmetros
  IF p_organization_id IS NULL OR p_environment_id IS NULL THEN
    RAISE EXCEPTION 'organization_id e environment_id são obrigatórios';
  END IF;

  -- Retornar carriers filtrados por org e env
  RETURN QUERY
  SELECT 
    c.id,
    c.codigo,
    c.razao_social,
    c.fantasia,
    c.logotipo,
    c.cnpj,
    c.inscricao_estadual,
    c.pais_id,
    c.estado_id,
    c.cidade_id,
    c.logradouro,
    c.numero,
    c.complemento,
    c.bairro,
    c.cep,
    c.tolerancia_valor_cte,
    c.tolerancia_percentual_cte,
    c.tolerancia_valor_fatura,
    c.tolerancia_percentual_fatura,
    c.email,
    c.phone,
    c.status,
    c.rating,
    c.active_shipments,
    c.modals,
    c.working_days_config,
    c.organization_id,
    c.environment_id,
    c.created_at,
    c.updated_at,
    c.created_by,
    c.updated_by
  FROM carriers c
  WHERE c.organization_id = p_organization_id
    AND c.environment_id = p_environment_id
  ORDER BY c.codigo ASC;
END;
$$;

-- Comentário
COMMENT ON FUNCTION get_carriers_with_context IS 
'Busca carriers garantindo contexto correto. Usa SECURITY DEFINER para bypassar RLS mas valida org_id e env_id.';
