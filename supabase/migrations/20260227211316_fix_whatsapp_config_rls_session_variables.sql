/*
  # Corrigir políticas RLS do whatsapp_config - Variáveis de sessão

  1. Problema Identificado
    - Políticas RLS usam: current_setting('app.current_organization_id', true)
    - Função set_session_context define: set_config('app.organization_id', ...)
    - Inconsistência nos nomes causa violação RLS (erro 42501)

  2. Solução
    - Atualizar políticas RLS para usar 'app.organization_id' e 'app.environment_id'
    - Garantir consistência com a função set_session_context
    - Manter isolamento multi-tenant correto

  3. Impacto
    - Correção crítica para permitir INSERT/UPDATE na tabela whatsapp_config
    - Mantém segurança e isolamento entre organizações
*/

-- =====================================================
-- REMOVER POLÍTICAS ANTIGAS
-- =====================================================

DROP POLICY IF EXISTS "whatsapp_config_anon_select" ON whatsapp_config;
DROP POLICY IF EXISTS "whatsapp_config_anon_insert" ON whatsapp_config;
DROP POLICY IF EXISTS "whatsapp_config_anon_update" ON whatsapp_config;
DROP POLICY IF EXISTS "whatsapp_config_anon_delete" ON whatsapp_config;

-- =====================================================
-- POLÍTICAS RLS CORRIGIDAS
-- =====================================================

-- Política SELECT: Permitir leitura baseada em organização E ambiente
CREATE POLICY "whatsapp_config_anon_select"
  ON whatsapp_config FOR SELECT
  TO anon
  USING (
    (organization_id IS NULL) OR (
      organization_id::text = current_setting('app.organization_id', true)
      AND (
        environment_id IS NULL OR
        environment_id::text = current_setting('app.environment_id', true)
      )
    )
  );

-- Política INSERT: Permitir inserção com validação de organização e ambiente
CREATE POLICY "whatsapp_config_anon_insert"
  ON whatsapp_config FOR INSERT
  TO anon
  WITH CHECK (
    (organization_id IS NULL) OR (
      organization_id::text = current_setting('app.organization_id', true)
      AND (
        environment_id IS NULL OR
        environment_id::text = current_setting('app.environment_id', true)
      )
    )
  );

-- Política UPDATE: Permitir atualização com validação de organização e ambiente
CREATE POLICY "whatsapp_config_anon_update"
  ON whatsapp_config FOR UPDATE
  TO anon
  USING (
    (organization_id IS NULL) OR (
      organization_id::text = current_setting('app.organization_id', true)
      AND (
        environment_id IS NULL OR
        environment_id::text = current_setting('app.environment_id', true)
      )
    )
  )
  WITH CHECK (
    (organization_id IS NULL) OR (
      organization_id::text = current_setting('app.organization_id', true)
      AND (
        environment_id IS NULL OR
        environment_id::text = current_setting('app.environment_id', true)
      )
    )
  );

-- Política DELETE: Permitir deleção com validação de organização e ambiente
CREATE POLICY "whatsapp_config_anon_delete"
  ON whatsapp_config FOR DELETE
  TO anon
  USING (
    (organization_id IS NULL) OR (
      organization_id::text = current_setting('app.organization_id', true)
      AND (
        environment_id IS NULL OR
        environment_id::text = current_setting('app.environment_id', true)
      )
    )
  );

-- =====================================================
-- COMENTÁRIOS DOCUMENTAÇÃO
-- =====================================================

COMMENT ON POLICY "whatsapp_config_anon_select" ON whatsapp_config IS
  'Permite leitura de configurações do WhatsApp baseado em organização e ambiente do contexto (app.organization_id)';

COMMENT ON POLICY "whatsapp_config_anon_insert" ON whatsapp_config IS
  'Permite inserção de configurações do WhatsApp com validação de organização e ambiente (app.organization_id)';

COMMENT ON POLICY "whatsapp_config_anon_update" ON whatsapp_config IS
  'Permite atualização de configurações do WhatsApp com validação de organização e ambiente (app.organization_id)';

COMMENT ON POLICY "whatsapp_config_anon_delete" ON whatsapp_config IS
  'Permite deleção de configurações do WhatsApp com validação de organização e ambiente (app.organization_id)';
