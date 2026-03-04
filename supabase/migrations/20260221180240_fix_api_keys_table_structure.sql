/*
  # Corrigir estrutura da tabela de API Keys
  
  1. Problema
    - Service espera tabela "api_keys_config"
    - Tabela atual é "api_keys"
    - Colunas em português (nome, chave, ativa)
    - Service espera em inglês
  
  2. Solução
    - Renomear tabela api_keys → api_keys_config
    - Renomear colunas para inglês
    - Adicionar colunas faltantes
    - Configurar RLS
*/

-- 1. Renomear tabela
ALTER TABLE IF EXISTS api_keys 
RENAME TO api_keys_config;

-- 2. Renomear e ajustar colunas
DO $$
BEGIN
  -- nome → key_name
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'api_keys_config' AND column_name = 'nome'
  ) THEN
    ALTER TABLE api_keys_config RENAME COLUMN nome TO key_name;
  END IF;

  -- chave → api_key
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'api_keys_config' AND column_name = 'chave'
  ) THEN
    ALTER TABLE api_keys_config RENAME COLUMN chave TO api_key;
  END IF;

  -- ativa → is_active
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'api_keys_config' AND column_name = 'ativa'
  ) THEN
    ALTER TABLE api_keys_config RENAME COLUMN ativa TO is_active;
  END IF;

  -- tipo → key_type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'api_keys_config' AND column_name = 'tipo'
  ) THEN
    ALTER TABLE api_keys_config RENAME COLUMN tipo TO key_type;
  END IF;

  -- expira_em → expires_at
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'api_keys_config' AND column_name = 'expira_em'
  ) THEN
    ALTER TABLE api_keys_config RENAME COLUMN expira_em TO expires_at;
  END IF;

  -- ultimo_uso → last_used_at
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'api_keys_config' AND column_name = 'ultimo_uso'
  ) THEN
    ALTER TABLE api_keys_config RENAME COLUMN ultimo_uso TO last_used_at;
  END IF;

  -- permissoes → permissions
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'api_keys_config' AND column_name = 'permissoes'
  ) THEN
    ALTER TABLE api_keys_config RENAME COLUMN permissoes TO permissions;
  END IF;
END $$;

-- 3. Adicionar colunas faltantes
ALTER TABLE api_keys_config 
ADD COLUMN IF NOT EXISTS estabelecimento_id UUID,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS environment TEXT DEFAULT 'production',
ADD COLUMN IF NOT EXISTS monthly_limit INTEGER,
ADD COLUMN IF NOT EXISTS current_usage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS usage_reset_day INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS rotated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rotated_by TEXT,
ADD COLUMN IF NOT EXISTS rotation_schedule TEXT,
ADD COLUMN IF NOT EXISTS next_rotation_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS alert_threshold_percent INTEGER DEFAULT 80,
ADD COLUMN IF NOT EXISTS alert_emails TEXT[],
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS created_by TEXT;

-- 4. Remover coluna prefixo se existir
ALTER TABLE api_keys_config 
DROP COLUMN IF EXISTS prefixo;

-- 5. Criar tabela de histórico de rotação se não existir
CREATE TABLE IF NOT EXISTS api_keys_rotation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  environment_id UUID,
  key_config_id UUID REFERENCES api_keys_config(id) ON DELETE CASCADE,
  old_key_hash TEXT,
  new_key_hash TEXT NOT NULL,
  rotated_by TEXT,
  rotation_reason TEXT,
  rotation_type TEXT CHECK (rotation_type IN ('manual', 'scheduled', 'emergency', 'expired')),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  rotated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Criar tabela de estatísticas de uso se não existir
CREATE TABLE IF NOT EXISTS api_keys_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  environment_id UUID,
  key_config_id UUID REFERENCES api_keys_config(id) ON DELETE CASCADE,
  endpoint TEXT,
  method TEXT,
  status_code INTEGER,
  response_time_ms INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Habilitar RLS
ALTER TABLE api_keys_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys_rotation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys_usage_logs ENABLE ROW LEVEL SECURITY;

-- 8. Remover policies antigas
DROP POLICY IF EXISTS "api_keys_config_anon_select" ON api_keys_config;
DROP POLICY IF EXISTS "api_keys_config_anon_insert" ON api_keys_config;
DROP POLICY IF EXISTS "api_keys_config_anon_update" ON api_keys_config;
DROP POLICY IF EXISTS "api_keys_config_anon_delete" ON api_keys_config;

-- 9. Criar policies para api_keys_config
CREATE POLICY "api_keys_config_anon_select"
ON api_keys_config FOR SELECT TO anon
USING (
  organization_id IS NULL
  OR organization_id::text = current_setting('app.current_organization_id', true)
);

CREATE POLICY "api_keys_config_anon_insert"
ON api_keys_config FOR INSERT TO anon
WITH CHECK (
  organization_id IS NULL
  OR organization_id::text = current_setting('app.current_organization_id', true)
);

CREATE POLICY "api_keys_config_anon_update"
ON api_keys_config FOR UPDATE TO anon
USING (
  organization_id IS NULL
  OR organization_id::text = current_setting('app.current_organization_id', true)
)
WITH CHECK (
  organization_id IS NULL
  OR organization_id::text = current_setting('app.current_organization_id', true)
);

CREATE POLICY "api_keys_config_anon_delete"
ON api_keys_config FOR DELETE TO anon
USING (
  organization_id IS NULL
  OR organization_id::text = current_setting('app.current_organization_id', true)
);

-- 10. Policies para api_keys_rotation_history
CREATE POLICY "api_keys_rotation_history_anon_all"
ON api_keys_rotation_history FOR ALL TO anon
USING (
  organization_id::text = current_setting('app.current_organization_id', true)
)
WITH CHECK (
  organization_id::text = current_setting('app.current_organization_id', true)
);

-- 11. Policies para api_keys_usage_logs
CREATE POLICY "api_keys_usage_logs_anon_select"
ON api_keys_usage_logs FOR SELECT TO anon
USING (
  organization_id::text = current_setting('app.current_organization_id', true)
);

CREATE POLICY "api_keys_usage_logs_anon_insert"
ON api_keys_usage_logs FOR INSERT TO anon
WITH CHECK (
  organization_id::text = current_setting('app.current_organization_id', true)
);

-- 12. Atualizar registros existentes sem organization_id
UPDATE api_keys_config
SET 
  organization_id = 'ddbbb51d-6134-420f-a28c-bcbc27269239',
  environment_id = '2989afa7-5010-419b-bb43-7f2cd559628a'
WHERE organization_id IS NULL;

-- 13. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_api_keys_config_org_env 
ON api_keys_config(organization_id, environment_id);

CREATE INDEX IF NOT EXISTS idx_api_keys_config_type 
ON api_keys_config(key_type);

CREATE INDEX IF NOT EXISTS idx_api_keys_config_active 
ON api_keys_config(is_active);

CREATE INDEX IF NOT EXISTS idx_api_keys_rotation_history_key 
ON api_keys_rotation_history(key_config_id);

CREATE INDEX IF NOT EXISTS idx_api_keys_usage_logs_key 
ON api_keys_usage_logs(key_config_id);
