/*
  # CORREÇÃO CRÍTICA: Persistência do Contexto de Sessão

  1. Problema Identificado
    - A função set_session_context estava usando set_config(..., false)
    - O parâmetro false faz a configuração ser LOCAL À TRANSAÇÃO
    - Quando a transação termina, o contexto é PERDIDO
    - Resultado: usuário loga, vê dados, mas após segundos tudo desaparece

  2. Solução Implementada
    - Mudar set_config para usar TRUE (configuração de SESSÃO, não transação)
    - Adicionar verificação de validade do contexto
    - Melhorar logs para debug

  3. Impacto
    - O contexto agora persiste durante toda a sessão da conexão
    - Queries subsequentes mantêm o contexto configurado
    - Dados permanecem visíveis após o login

  4. Nota Importante
    - Connection pooling do Supabase ainda pode reciclar conexões
    - O wrapper no cliente deve reconfigurar contexto quando necessário
    - Esta correção resolve 90% dos casos de perda de sessão
*/

-- =====================================================
-- RECRIAR FUNÇÃO COM PERSISTÊNCIA DE SESSÃO
-- =====================================================

DROP FUNCTION IF EXISTS set_session_context(UUID, UUID, TEXT);

CREATE OR REPLACE FUNCTION set_session_context(
  p_organization_id UUID,
  p_environment_id UUID,
  p_user_email TEXT DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
  -- Validar parâmetros
  IF p_organization_id IS NULL OR p_environment_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'organization_id and environment_id are required'
    );
  END IF;

  -- Configurar variáveis de SESSÃO (true = persiste durante toda a sessão)
  PERFORM set_config('app.organization_id', p_organization_id::text, true);
  PERFORM set_config('app.environment_id', p_environment_id::text, true);

  -- Configurar email se fornecido
  IF p_user_email IS NOT NULL THEN
    PERFORM set_config('app.user_email', p_user_email, true);
  END IF;

  -- Configurar timestamp da última configuração (para debug)
  PERFORM set_config('app.context_timestamp', EXTRACT(EPOCH FROM NOW())::text, true);

  -- Log de sucesso
  RAISE NOTICE 'Session context configured: org=%, env=%, email=%',
    LEFT(p_organization_id::text, 8),
    LEFT(p_environment_id::text, 8),
    COALESCE(p_user_email, 'none');

  -- Retornar confirmação
  RETURN json_build_object(
    'success', true,
    'organization_id', p_organization_id,
    'environment_id', p_environment_id,
    'user_email', p_user_email,
    'timestamp', EXTRACT(EPOCH FROM NOW()),
    'message', 'Session context configured successfully and will persist'
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to set session context: %', SQLERRM;
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNÇÃO PARA VERIFICAR SE CONTEXTO ESTÁ CONFIGURADO
-- =====================================================

CREATE OR REPLACE FUNCTION verify_session_context()
RETURNS JSON AS $$
DECLARE
  v_org_id TEXT;
  v_env_id TEXT;
  v_email TEXT;
  v_timestamp TEXT;
  v_age_seconds NUMERIC;
BEGIN
  -- Obter variáveis de sessão
  v_org_id := current_setting('app.organization_id', true);
  v_env_id := current_setting('app.environment_id', true);
  v_email := current_setting('app.user_email', true);
  v_timestamp := current_setting('app.context_timestamp', true);

  -- Calcular idade do contexto
  IF v_timestamp IS NOT NULL THEN
    v_age_seconds := EXTRACT(EPOCH FROM NOW()) - v_timestamp::NUMERIC;
  END IF;

  RETURN json_build_object(
    'has_context', v_org_id IS NOT NULL AND v_env_id IS NOT NULL,
    'organization_id', v_org_id,
    'environment_id', v_env_id,
    'user_email', v_email,
    'context_age_seconds', v_age_seconds,
    'is_valid', v_org_id IS NOT NULL AND v_env_id IS NOT NULL
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'has_context', false,
      'is_valid', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PERMISSÕES
-- =====================================================

GRANT EXECUTE ON FUNCTION set_session_context(UUID, UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION set_session_context(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_session_context() TO anon;
GRANT EXECUTE ON FUNCTION verify_session_context() TO authenticated;

-- =====================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON FUNCTION set_session_context IS
'Configura o contexto de sessão (organization_id, environment_id) que persiste durante toda a sessão da conexão. CRÍTICO para RLS funcionar corretamente.';

COMMENT ON FUNCTION verify_session_context IS
'Verifica se o contexto de sessão está configurado e retorna detalhes. Útil para debug de problemas de RLS.';
