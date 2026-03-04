/*
  # Criar função para buscar cities com state_abbreviation

  1. Nova Função
    - `get_cities_with_state` - Retorna cities com sigla_uf via JOIN
    - Parâmetros: state_abbreviation (opcional)
  
  2. Retorno
    - id, codigo_ibge, nome, state_id, sigla_uf
*/

CREATE OR REPLACE FUNCTION get_cities_with_state(p_state_abbreviation text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  codigo_ibge text,
  nome text,
  state_id uuid,
  sigla_uf text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.codigo_ibge,
    c.nome,
    c.state_id,
    s.sigla as sigla_uf
  FROM cities c
  INNER JOIN states s ON c.state_id = s.id
  WHERE (p_state_abbreviation IS NULL OR s.sigla = p_state_abbreviation)
  ORDER BY c.nome;
END;
$$;