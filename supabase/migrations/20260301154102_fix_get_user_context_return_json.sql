/*
  # Corrigir Função get_user_context_for_session - Retornar JSON

  1. Problema
    - A função atual retorna TABLE (array de linhas)
    - O código JavaScript espera um objeto JSON com estrutura {success, organization_id, environment_id}
    - Isso causa falha silenciosa na configuração de contexto
    - Resultado: "Não foi possível obter contexto do usuário: dados incompletos"

  2. Solução
    - Recriar função para retornar JSONB ao invés de TABLE
    - Incluir campo "success" para compatibilidade com código JS
    - Incluir campo "error" para mensagens de erro
    - Manter lógica de busca no banco de dados

  3. Formato de Retorno
    - Sucesso: {"success": true, "organization_id": "...", "environment_id": "...", "user_id": "..."}
    - Erro: {"success": false, "error": "mensagem"}

  4. Segurança
    - SECURITY DEFINER mantido (bypassa RLS para buscar dados)
    - Usado apenas para configuração inicial de contexto
    - Não expõe dados sensíveis
*/

-- Remover função antiga
DROP FUNCTION IF EXISTS public.get_user_context_for_session(text);

-- Criar nova função que retorna JSON
CREATE OR REPLACE FUNCTION public.get_user_context_for_session(p_email text)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user RECORD;
BEGIN
  -- Log the attempt for debugging
  RAISE NOTICE 'Getting context for email: %', p_email;
  
  -- Buscar usuário no banco
  SELECT 
    u.id,
    u.organization_id,
    u.environment_id,
    u.email
  INTO v_user
  FROM users u
  WHERE u.email = p_email
  LIMIT 1;
  
  -- Se usuário não encontrado
  IF NOT FOUND THEN
    RAISE NOTICE 'No user found for email: %', p_email;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário não encontrado'
    );
  END IF;
  
  -- Verificar se tem organization_id e environment_id
  IF v_user.organization_id IS NULL OR v_user.environment_id IS NULL THEN
    RAISE NOTICE 'User found but missing organization or environment: %', p_email;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário sem organização ou ambiente configurado'
    );
  END IF;
  
  -- Retornar dados com sucesso
  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user.id,
    'organization_id', v_user.organization_id,
    'environment_id', v_user.environment_id,
    'email', v_user.email
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_context_for_session(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_context_for_session(text) TO authenticated;

-- Comentário
COMMENT ON FUNCTION public.get_user_context_for_session(text) IS
'Retorna contexto do usuário (organization_id, environment_id) em formato JSON para configuração de sessão. Bypassa RLS usando SECURITY DEFINER.';
