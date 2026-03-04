/*
  # Criar função get_current_session_context

  1. Nova Função
    - `get_current_session_context()` - retorna o contexto da sessão atual
    
  2. Descrição
    - Retorna organization_id e environment_id configurados na sessão atual
    - Retorna has_context indicando se o contexto está configurado
*/

CREATE OR REPLACE FUNCTION get_current_session_context()
RETURNS TABLE (
  organization_id uuid,
  environment_id uuid,
  has_context boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    NULLIF(current_setting('app.current_organization_id', true), '')::uuid as organization_id,
    NULLIF(current_setting('app.current_environment_id', true), '')::uuid as environment_id,
    (
      NULLIF(current_setting('app.current_organization_id', true), '') IS NOT NULL AND
      NULLIF(current_setting('app.current_environment_id', true), '') IS NOT NULL
    ) as has_context;
END;
$$;