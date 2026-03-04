/*
  # Criar função get_user_context como alias

  1. Problema
    - O código TypeScript chama `get_user_context` mas a função não existe
    - A função correta no banco é `get_current_user_context`
    - Isso causa erro ao tentar verificar o contexto

  2. Solução
    - Criar função `get_user_context` que retorna os mesmos dados
    - Retornar JSON ao invés de RECORD para compatibilidade com o código frontend
    - Incluir tratamento de erros robusto
*/

-- Criar função get_user_context que retorna JSON
CREATE OR REPLACE FUNCTION public.get_user_context()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_org_id text;
  v_env_id text;
  v_email text;
BEGIN
  -- Tentar obter valores do contexto de sessão
  BEGIN
    v_org_id := current_setting('app.current_organization_id', true);
    v_env_id := current_setting('app.current_environment_id', true);
    v_email := current_setting('app.user_email', true);
  EXCEPTION WHEN OTHERS THEN
    -- Se falhar, retornar valores null
    v_org_id := NULL;
    v_env_id := NULL;
    v_email := NULL;
  END;

  -- Retornar JSON com os valores
  RETURN jsonb_build_object(
    'organization_id', v_org_id,
    'environment_id', v_env_id,
    'user_email', v_email,
    'has_context', (v_org_id IS NOT NULL AND v_env_id IS NOT NULL)
  );
END;
$$;

-- Comentário explicativo
COMMENT ON FUNCTION public.get_user_context() IS 
'Retorna o contexto atual da sessão (organization_id, environment_id, user_email) em formato JSON. Usado para verificar se o contexto foi configurado corretamente.';
