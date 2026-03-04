/*
  # Corrigir função get_carriers_with_context

  ## Problema
  - Tipos declarados na função não correspondiam aos tipos reais da tabela
  - cidade_id é INTEGER (não UUID)
  - created_by/updated_by são UUID (não text)
  - Faltavam campos como nps_interno

  ## Solução
  - Simplificar usando SETOF carriers
  - Retorna todos os campos da tabela automaticamente
*/

-- Recriar função com tipos corretos
DROP FUNCTION IF EXISTS get_carriers_with_context(uuid, uuid);

CREATE OR REPLACE FUNCTION get_carriers_with_context(
  p_organization_id uuid,
  p_environment_id uuid
)
RETURNS SETOF carriers
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
  SELECT c.*
  FROM carriers c
  WHERE c.organization_id = p_organization_id
    AND c.environment_id = p_environment_id
  ORDER BY c.codigo ASC;
END;
$$;

-- Comentário
COMMENT ON FUNCTION get_carriers_with_context IS 
'Busca carriers garantindo contexto correto. Usa SECURITY DEFINER para bypassar RLS mas valida org_id e env_id.';
