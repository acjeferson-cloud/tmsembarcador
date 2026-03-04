/*
  # Corrigir Políticas RLS do WhatsApp - Usar Variáveis de Sessão Corretas

  ## Problema Identificado
  As políticas RLS das tabelas WhatsApp estão usando `current_setting('app.organization_id', true)`
  mas a função `set_session_context()` configura `app.current_organization_id`.

  Esta inconsistência causa:
  - 401 Unauthorized ao tentar acessar whatsapp_config
  - Erro 42501 (insufficient privilege) ao inserir dados
  - "new row violates row-level security policy for table 'whatsapp_config'"

  ## Solução
  Recriar todas as políticas RLS para usar:
  - `app.current_organization_id` (em vez de `app.organization_id`)
  - `app.current_environment_id` (em vez de `app.environment_id`)

  Isso alinha com o que a função `set_session_context()` realmente configura.

  ## Tabelas Afetadas
  1. whatsapp_config
  2. whatsapp_templates
  3. whatsapp_messages_log
*/

-- ============================================================================
-- 1. REMOVER POLÍTICAS RLS ANTIGAS
-- ============================================================================

-- whatsapp_config
DROP POLICY IF EXISTS "whatsapp_config_select" ON whatsapp_config;
DROP POLICY IF EXISTS "whatsapp_config_insert" ON whatsapp_config;
DROP POLICY IF EXISTS "whatsapp_config_update" ON whatsapp_config;
DROP POLICY IF EXISTS "whatsapp_config_delete" ON whatsapp_config;

-- whatsapp_templates
DROP POLICY IF EXISTS "whatsapp_templates_select" ON whatsapp_templates;
DROP POLICY IF EXISTS "whatsapp_templates_insert" ON whatsapp_templates;
DROP POLICY IF EXISTS "whatsapp_templates_update" ON whatsapp_templates;
DROP POLICY IF EXISTS "whatsapp_templates_delete" ON whatsapp_templates;

-- whatsapp_messages_log
DROP POLICY IF EXISTS "whatsapp_messages_log_select" ON whatsapp_messages_log;
DROP POLICY IF EXISTS "whatsapp_messages_log_insert" ON whatsapp_messages_log;

-- ============================================================================
-- 2. CRIAR POLÍTICAS RLS CORRETAS - whatsapp_config
-- ============================================================================

CREATE POLICY "whatsapp_config_select_with_context"
  ON whatsapp_config FOR SELECT TO anon
  USING (
    organization_id::text = current_setting('app.current_organization_id', true)
  );

CREATE POLICY "whatsapp_config_insert_with_context"
  ON whatsapp_config FOR INSERT TO anon
  WITH CHECK (
    organization_id::text = current_setting('app.current_organization_id', true)
  );

CREATE POLICY "whatsapp_config_update_with_context"
  ON whatsapp_config FOR UPDATE TO anon
  USING (
    organization_id::text = current_setting('app.current_organization_id', true)
  )
  WITH CHECK (
    organization_id::text = current_setting('app.current_organization_id', true)
  );

CREATE POLICY "whatsapp_config_delete_with_context"
  ON whatsapp_config FOR DELETE TO anon
  USING (
    organization_id::text = current_setting('app.current_organization_id', true)
  );

-- ============================================================================
-- 3. CRIAR POLÍTICAS RLS CORRETAS - whatsapp_templates
-- ============================================================================

CREATE POLICY "whatsapp_templates_select_with_context"
  ON whatsapp_templates FOR SELECT TO anon
  USING (
    organization_id::text = current_setting('app.current_organization_id', true)
  );

CREATE POLICY "whatsapp_templates_insert_with_context"
  ON whatsapp_templates FOR INSERT TO anon
  WITH CHECK (
    organization_id::text = current_setting('app.current_organization_id', true)
  );

CREATE POLICY "whatsapp_templates_update_with_context"
  ON whatsapp_templates FOR UPDATE TO anon
  USING (
    organization_id::text = current_setting('app.current_organization_id', true)
  )
  WITH CHECK (
    organization_id::text = current_setting('app.current_organization_id', true)
  );

CREATE POLICY "whatsapp_templates_delete_with_context"
  ON whatsapp_templates FOR DELETE TO anon
  USING (
    organization_id::text = current_setting('app.current_organization_id', true)
  );

-- ============================================================================
-- 4. CRIAR POLÍTICAS RLS CORRETAS - whatsapp_messages_log
-- ============================================================================

CREATE POLICY "whatsapp_messages_log_select_with_context"
  ON whatsapp_messages_log FOR SELECT TO anon
  USING (
    organization_id::text = current_setting('app.current_organization_id', true)
  );

CREATE POLICY "whatsapp_messages_log_insert_with_context"
  ON whatsapp_messages_log FOR INSERT TO anon
  WITH CHECK (
    organization_id::text = current_setting('app.current_organization_id', true)
  );

-- ============================================================================
-- 5. VERIFICAÇÃO E COMENTÁRIOS
-- ============================================================================

COMMENT ON POLICY "whatsapp_config_select_with_context" ON whatsapp_config IS
'Permite SELECT quando app.current_organization_id está configurado via set_session_context()';

COMMENT ON POLICY "whatsapp_config_insert_with_context" ON whatsapp_config IS
'Permite INSERT quando app.current_organization_id está configurado via set_session_context()';

COMMENT ON POLICY "whatsapp_templates_select_with_context" ON whatsapp_templates IS
'Permite SELECT quando app.current_organization_id está configurado via set_session_context()';

COMMENT ON POLICY "whatsapp_templates_insert_with_context" ON whatsapp_templates IS
'Permite INSERT quando app.current_organization_id está configurado via set_session_context()';

COMMENT ON POLICY "whatsapp_messages_log_select_with_context" ON whatsapp_messages_log IS
'Permite SELECT quando app.current_organization_id está configurado via set_session_context()';

COMMENT ON POLICY "whatsapp_messages_log_insert_with_context" ON whatsapp_messages_log IS
'Permite INSERT quando app.current_organization_id está configurado via set_session_context()';

-- ============================================================================
-- 6. CRIAR FUNÇÃO DE DEBUG PARA VERIFICAR CONTEXTO
-- ============================================================================

CREATE OR REPLACE FUNCTION debug_whatsapp_session_context()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_org TEXT;
  v_current_env TEXT;
  v_legacy_org TEXT;
  v_legacy_env TEXT;
BEGIN
  -- Obter valores corretos (usados por set_session_context)
  v_current_org := current_setting('app.current_organization_id', true);
  v_current_env := current_setting('app.current_environment_id', true);

  -- Obter valores legados (não usados mais)
  v_legacy_org := current_setting('app.organization_id', true);
  v_legacy_env := current_setting('app.environment_id', true);

  RETURN json_build_object(
    'correct_variables', json_build_object(
      'app.current_organization_id', v_current_org,
      'app.current_environment_id', v_current_env,
      'is_set', v_current_org IS NOT NULL AND v_current_env IS NOT NULL
    ),
    'legacy_variables', json_build_object(
      'app.organization_id', v_legacy_org,
      'app.environment_id', v_legacy_env,
      'is_set', v_legacy_org IS NOT NULL AND v_legacy_env IS NOT NULL
    ),
    'diagnosis', CASE
      WHEN v_current_org IS NOT NULL AND v_current_env IS NOT NULL THEN 'OK - Contexto configurado corretamente'
      WHEN v_legacy_org IS NOT NULL AND v_legacy_env IS NOT NULL THEN 'AVISO - Usando variáveis legadas (app.organization_id)'
      ELSE 'ERRO - Nenhum contexto configurado. Chame set_session_context() primeiro'
    END,
    'timestamp', EXTRACT(EPOCH FROM NOW())
  );
END;
$$;

COMMENT ON FUNCTION debug_whatsapp_session_context() IS
'Função de debug para verificar quais variáveis de sessão estão configuradas';

-- Permissões
GRANT EXECUTE ON FUNCTION debug_whatsapp_session_context() TO anon;
GRANT EXECUTE ON FUNCTION debug_whatsapp_session_context() TO authenticated;