/*
  # Corrigir estrutura completa da tabela whatsapp_config
  
  1. Problema
    - Código espera: access_token, phone_number_id, business_account_id
    - Banco tem: api_key, phone_number, api_url
    - Erro: "Could not find the 'access_token' column"
  
  2. Solução
    - Adicionar colunas compatíveis com WhatsApp Business API
    - Migrar dados existentes para novas colunas
    - Manter colunas antigas para compatibilidade
    - Configurar RLS policies corretas
*/

-- 1. Adicionar colunas novas para WhatsApp Business API
ALTER TABLE whatsapp_config
ADD COLUMN IF NOT EXISTS access_token TEXT,
ADD COLUMN IF NOT EXISTS phone_number_id TEXT,
ADD COLUMN IF NOT EXISTS business_account_id TEXT,
ADD COLUMN IF NOT EXISTS webhook_verify_token TEXT,
ADD COLUMN IF NOT EXISTS test_status TEXT,
ADD COLUMN IF NOT EXISTS last_tested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS created_by TEXT;

-- 2. Migrar dados existentes das colunas antigas para novas
UPDATE whatsapp_config
SET 
  access_token = COALESCE(access_token, api_key),
  phone_number_id = COALESCE(phone_number_id, phone_number)
WHERE access_token IS NULL OR phone_number_id IS NULL;

-- 3. Atualizar registros com organization_id padrão se necessário
UPDATE whatsapp_config
SET organization_id = 'ddbbb51d-6134-420f-a28c-bcbc27269239'
WHERE organization_id IS NULL;

-- 4. Remover constraints NOT NULL das colunas antigas (para não quebrar)
ALTER TABLE whatsapp_config
ALTER COLUMN api_key DROP NOT NULL,
ALTER COLUMN phone_number DROP NOT NULL,
ALTER COLUMN api_url DROP NOT NULL;

-- 5. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_config_org_env 
ON whatsapp_config(organization_id, environment_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_config_active 
ON whatsapp_config(is_active) 
WHERE is_active = true;

-- 6. Remover policies antigas
DROP POLICY IF EXISTS "whatsapp_config_anon_all" ON whatsapp_config;
DROP POLICY IF EXISTS "whatsapp_config_anon_select" ON whatsapp_config;
DROP POLICY IF EXISTS "whatsapp_config_anon_insert" ON whatsapp_config;
DROP POLICY IF EXISTS "whatsapp_config_anon_update" ON whatsapp_config;
DROP POLICY IF EXISTS "whatsapp_config_anon_delete" ON whatsapp_config;

-- 7. Criar policies corretas com isolamento por organização
CREATE POLICY "whatsapp_config_anon_select"
ON whatsapp_config FOR SELECT TO anon
USING (
  organization_id IS NULL
  OR organization_id::text = current_setting('app.current_organization_id', true)
);

CREATE POLICY "whatsapp_config_anon_insert"
ON whatsapp_config FOR INSERT TO anon
WITH CHECK (
  organization_id IS NULL
  OR organization_id::text = current_setting('app.current_organization_id', true)
);

CREATE POLICY "whatsapp_config_anon_update"
ON whatsapp_config FOR UPDATE TO anon
USING (
  organization_id IS NULL
  OR organization_id::text = current_setting('app.current_organization_id', true)
)
WITH CHECK (
  organization_id IS NULL
  OR organization_id::text = current_setting('app.current_organization_id', true)
);

CREATE POLICY "whatsapp_config_anon_delete"
ON whatsapp_config FOR DELETE TO anon
USING (
  organization_id IS NULL
  OR organization_id::text = current_setting('app.current_organization_id', true)
);

-- 8. Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_whatsapp_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_whatsapp_config_updated_at ON whatsapp_config;
CREATE TRIGGER trigger_update_whatsapp_config_updated_at
  BEFORE UPDATE ON whatsapp_config
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_config_updated_at();

-- 9. Adicionar comentários para documentação
COMMENT ON COLUMN whatsapp_config.access_token IS 'Token de acesso permanente da Meta for Developers (substitui api_key)';
COMMENT ON COLUMN whatsapp_config.phone_number_id IS 'ID do número de telefone do WhatsApp Business (substitui phone_number)';
COMMENT ON COLUMN whatsapp_config.business_account_id IS 'ID da conta comercial do WhatsApp Business';
COMMENT ON COLUMN whatsapp_config.webhook_verify_token IS 'Token para verificação de webhooks (opcional)';
COMMENT ON COLUMN whatsapp_config.api_key IS 'DEPRECATED: Use access_token';
COMMENT ON COLUMN whatsapp_config.phone_number IS 'DEPRECATED: Use phone_number_id';
