/*
  # Corrigir políticas RLS do whatsapp_config

  1. Problema Identificado
    - Políticas muito restritivas causando erro 42501 (new row violates row-level security policy)
    - Necessário permitir acesso baseado em environment_id também

  2. Solução
    - Atualizar políticas para incluir environment_id no contexto
    - Simplificar verificações para evitar bloqueios
*/

-- Remover políticas antigas
DROP POLICY IF EXISTS "whatsapp_config_anon_select" ON whatsapp_config;
DROP POLICY IF EXISTS "whatsapp_config_anon_insert" ON whatsapp_config;
DROP POLICY IF EXISTS "whatsapp_config_anon_update" ON whatsapp_config;
DROP POLICY IF EXISTS "whatsapp_config_anon_delete" ON whatsapp_config;

-- Política SELECT: Permitir leitura baseada em organização E ambiente
CREATE POLICY "whatsapp_config_anon_select"
  ON whatsapp_config FOR SELECT
  TO anon
  USING (
    (organization_id IS NULL) OR (
      organization_id::text = current_setting('app.current_organization_id', true)
      AND (
        environment_id IS NULL OR 
        environment_id::text = current_setting('app.current_environment_id', true)
      )
    )
  );

-- Política INSERT: Permitir inserção com validação de organização e ambiente
CREATE POLICY "whatsapp_config_anon_insert"
  ON whatsapp_config FOR INSERT
  TO anon
  WITH CHECK (
    (organization_id IS NULL) OR (
      organization_id::text = current_setting('app.current_organization_id', true)
      AND (
        environment_id IS NULL OR 
        environment_id::text = current_setting('app.current_environment_id', true)
      )
    )
  );

-- Política UPDATE: Permitir atualização com validação de organização e ambiente
CREATE POLICY "whatsapp_config_anon_update"
  ON whatsapp_config FOR UPDATE
  TO anon
  USING (
    (organization_id IS NULL) OR (
      organization_id::text = current_setting('app.current_organization_id', true)
      AND (
        environment_id IS NULL OR 
        environment_id::text = current_setting('app.current_environment_id', true)
      )
    )
  )
  WITH CHECK (
    (organization_id IS NULL) OR (
      organization_id::text = current_setting('app.current_organization_id', true)
      AND (
        environment_id IS NULL OR 
        environment_id::text = current_setting('app.current_environment_id', true)
      )
    )
  );

-- Política DELETE: Permitir deleção com validação de organização e ambiente
CREATE POLICY "whatsapp_config_anon_delete"
  ON whatsapp_config FOR DELETE
  TO anon
  USING (
    (organization_id IS NULL) OR (
      organization_id::text = current_setting('app.current_organization_id', true)
      AND (
        environment_id IS NULL OR 
        environment_id::text = current_setting('app.current_environment_id', true)
      )
    )
  );

-- Comentários
COMMENT ON POLICY "whatsapp_config_anon_select" ON whatsapp_config IS 
  'Permite leitura de configurações do WhatsApp baseado em organização e ambiente do contexto';
COMMENT ON POLICY "whatsapp_config_anon_insert" ON whatsapp_config IS 
  'Permite inserção de configurações do WhatsApp com validação de organização e ambiente';
COMMENT ON POLICY "whatsapp_config_anon_update" ON whatsapp_config IS 
  'Permite atualização de configurações do WhatsApp com validação de organização e ambiente';
COMMENT ON POLICY "whatsapp_config_anon_delete" ON whatsapp_config IS 
  'Permite deleção de configurações do WhatsApp com validação de organização e ambiente';
