/*
  # Corrigir estrutura completa de licenças
  
  1. Problema
    - Tabela "licenses" com colunas em PT
    - Falta tabela "license_logs"
    - Falta coluna users.has_license
    - Falta coluna licenses.company_id
    - Sem RLS policies
  
  2. Solução
    - Adicionar colunas faltantes em licenses
    - Criar tabela license_logs
    - Adicionar coluna has_license em users
    - Configurar RLS completo
*/

-- 1. Adicionar colunas faltantes em licenses
ALTER TABLE licenses 
ADD COLUMN IF NOT EXISTS environment_id UUID,
ADD COLUMN IF NOT EXISTS company_id UUID,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS license_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available' 
  CHECK (status IN ('contracted', 'in_use', 'available', 'expired', 'suspended')),
ADD COLUMN IF NOT EXISTS plan_name TEXT,
ADD COLUMN IF NOT EXISTS monthly_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS annual_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS contract_date DATE,
ADD COLUMN IF NOT EXISTS activation_date DATE,
ADD COLUMN IF NOT EXISTS expiration_date DATE,
ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 2. Renomear colunas PT para EN (manter compatibilidade)
DO $$
BEGIN
  -- tipo → license_type (manter tipo também)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'licenses' AND column_name = 'license_type'
  ) THEN
    ALTER TABLE licenses ADD COLUMN license_type TEXT;
    UPDATE licenses SET license_type = tipo;
  END IF;

  -- data_inicio → start_date (manter data_inicio também)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'licenses' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE licenses ADD COLUMN start_date DATE;
    UPDATE licenses SET start_date = data_inicio;
  END IF;

  -- data_fim → end_date (manter data_fim também)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'licenses' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE licenses ADD COLUMN end_date DATE;
    UPDATE licenses SET end_date = data_fim;
  END IF;

  -- ativa → is_active (manter ativa também)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'licenses' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE licenses ADD COLUMN is_active BOOLEAN;
    UPDATE licenses SET is_active = ativa;
  END IF;
END $$;

-- 3. Criar tabela license_logs se não existir
CREATE TABLE IF NOT EXISTS license_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  environment_id UUID,
  license_id UUID REFERENCES licenses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN 
    ('created', 'activated', 'deactivated', 'renewed', 'expired', 
     'assigned', 'unassigned', 'updated', 'deleted')),
  old_status TEXT,
  new_status TEXT,
  old_user_id UUID,
  new_user_id UUID,
  performed_by TEXT,
  ip_address TEXT,
  user_agent TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Adicionar coluna has_license em users se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'has_license'
  ) THEN
    ALTER TABLE users ADD COLUMN has_license BOOLEAN DEFAULT false;
  END IF;

  -- Adicionar também license_id para FK
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'license_id'
  ) THEN
    ALTER TABLE users ADD COLUMN license_id UUID REFERENCES licenses(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 5. Criar função para gerar código de licença
CREATE OR REPLACE FUNCTION generate_license_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
BEGIN
  -- Gerar código único: XXXX-XXXX-XXXX-XXXX
  code := upper(substring(md5(random()::text) from 1 for 4) || '-' ||
                substring(md5(random()::text) from 1 for 4) || '-' ||
                substring(md5(random()::text) from 1 for 4) || '-' ||
                substring(md5(random()::text) from 1 for 4));
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- 6. Criar trigger para gerar código automaticamente
CREATE OR REPLACE FUNCTION set_license_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.license_code IS NULL THEN
    NEW.license_code := generate_license_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_license_code ON licenses;
CREATE TRIGGER trigger_set_license_code
  BEFORE INSERT ON licenses
  FOR EACH ROW
  EXECUTE FUNCTION set_license_code();

-- 7. Habilitar RLS
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_logs ENABLE ROW LEVEL SECURITY;

-- 8. Remover policies antigas
DROP POLICY IF EXISTS "licenses_anon_select" ON licenses;
DROP POLICY IF EXISTS "licenses_anon_insert" ON licenses;
DROP POLICY IF EXISTS "licenses_anon_update" ON licenses;
DROP POLICY IF EXISTS "licenses_anon_delete" ON licenses;

-- 9. Criar policies para licenses
CREATE POLICY "licenses_anon_select"
ON licenses FOR SELECT TO anon
USING (
  organization_id IS NULL
  OR organization_id::text = current_setting('app.current_organization_id', true)
);

CREATE POLICY "licenses_anon_insert"
ON licenses FOR INSERT TO anon
WITH CHECK (
  organization_id IS NULL
  OR organization_id::text = current_setting('app.current_organization_id', true)
);

CREATE POLICY "licenses_anon_update"
ON licenses FOR UPDATE TO anon
USING (
  organization_id IS NULL
  OR organization_id::text = current_setting('app.current_organization_id', true)
)
WITH CHECK (
  organization_id IS NULL
  OR organization_id::text = current_setting('app.current_organization_id', true)
);

CREATE POLICY "licenses_anon_delete"
ON licenses FOR DELETE TO anon
USING (
  organization_id IS NULL
  OR organization_id::text = current_setting('app.current_organization_id', true)
);

-- 10. Policies para license_logs
DROP POLICY IF EXISTS "license_logs_anon_select" ON license_logs;
DROP POLICY IF EXISTS "license_logs_anon_insert" ON license_logs;

CREATE POLICY "license_logs_anon_select"
ON license_logs FOR SELECT TO anon
USING (
  organization_id::text = current_setting('app.current_organization_id', true)
);

CREATE POLICY "license_logs_anon_insert"
ON license_logs FOR INSERT TO anon
WITH CHECK (
  organization_id::text = current_setting('app.current_organization_id', true)
);

-- 11. Criar índices
CREATE INDEX IF NOT EXISTS idx_licenses_org_env 
ON licenses(organization_id, environment_id);

CREATE INDEX IF NOT EXISTS idx_licenses_status 
ON licenses(status);

CREATE INDEX IF NOT EXISTS idx_licenses_user 
ON licenses(user_id);

CREATE INDEX IF NOT EXISTS idx_licenses_code 
ON licenses(license_code);

CREATE INDEX IF NOT EXISTS idx_license_logs_license 
ON license_logs(license_id);

CREATE INDEX IF NOT EXISTS idx_license_logs_user 
ON license_logs(user_id);

-- 12. Atualizar registros existentes
UPDATE licenses
SET 
  organization_id = 'ddbbb51d-6134-420f-a28c-bcbc27269239',
  environment_id = '2989afa7-5010-419b-bb43-7f2cd559628a',
  status = 'available'
WHERE organization_id IS NULL;
