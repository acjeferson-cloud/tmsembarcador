/*
  # Corrigir função get_ctes_prioritized para isolamento multi-tenant

  ## Descrição
  Atualiza a função get_ctes_prioritized para respeitar o isolamento multi-tenant,
  filtrando CT-es por organization_id e environment_id da sessão atual.

  ## Mudanças
  1. Adiciona filtros de organization_id e environment_id à função
  2. Garante que cada tenant veja apenas seus próprios CT-es

  ## Segurança
  - Usa get_session_organization_id() e get_session_environment_id()
  - Previne vazamento de dados entre tenants
*/

-- Recriar função com isolamento multi-tenant
CREATE OR REPLACE FUNCTION public.get_ctes_prioritized()
RETURNS TABLE(id uuid, number text, created_at timestamp with time zone)
LANGUAGE sql
AS $$
  SELECT
    id,
    number,
    created_at
  FROM public.ctes_complete
  WHERE organization_id = get_session_organization_id()
    AND environment_id = get_session_environment_id()
  ORDER BY created_at DESC;
$$;
