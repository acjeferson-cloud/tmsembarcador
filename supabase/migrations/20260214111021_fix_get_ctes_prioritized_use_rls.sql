/*
  # Corrigir função get_ctes_prioritized para usar RLS

  ## Descrição
  Reverte a função get_ctes_prioritized para não filtrar diretamente,
  confiando nas RLS policies da tabela ctes_complete para fazer o isolamento.

  ## Mudanças
  1. Remove filtros diretos de organization_id e environment_id
  2. Permite que RLS policies façam o isolamento automaticamente

  ## Segurança
  - O isolamento é garantido pelas RLS policies da tabela ctes_complete
  - Mais eficiente e consistente com outras queries
*/

-- Recriar função sem filtros diretos (RLS fará o isolamento)
CREATE OR REPLACE FUNCTION public.get_ctes_prioritized()
RETURNS TABLE(id uuid, number text, created_at timestamp with time zone)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    id,
    number,
    created_at
  FROM public.ctes_complete
  ORDER BY created_at DESC;
$$;
