/*
  # Corrigir persistência do contexto de sessão
  
  1. Problema Identificado
    - A função set_session_context usava set_config(..., false)
    - O terceiro parâmetro 'false' significa que a configuração só dura para a transação atual
    - Como fazemos requisições HTTP separadas, o contexto era perdido entre chamadas
  
  2. Solução
    - Alterar para set_config(..., true) para durar toda a sessão
    - Isso mantém o contexto entre requisições diferentes
  
  3. Impacto
    - Permite que a query de establishments funcione após setar o contexto
    - Resolve o erro "Nenhum estabelecimento encontrado" após login
*/

-- Recriar função set_session_context com persistência de sessão (true ao invés de false)
CREATE OR REPLACE FUNCTION public.set_session_context(
  p_organization_id uuid,
  p_environment_id uuid,
  p_user_email text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Setar organization_id, environment_id e email no session context
  -- IMPORTANTE: Usar 'true' como terceiro parâmetro para manter durante toda a sessão
  PERFORM set_config('app.current_organization_id', p_organization_id::text, true);
  PERFORM set_config('app.current_environment_id', p_environment_id::text, true);

  -- Setar email se fornecido
  IF p_user_email IS NOT NULL THEN
    PERFORM set_config('app.current_user_email', p_user_email, true);
  END IF;
  
  -- Log para debug
  RAISE NOTICE 'Session context setado: org=%, env=%, email=%', 
    p_organization_id, p_environment_id, p_user_email;
END;
$$;