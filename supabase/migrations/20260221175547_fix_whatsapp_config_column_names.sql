/*
  # Corrigir nomes de colunas da tabela whatsapp_config
  
  1. Problema
    - Tabela tem coluna "ativo" (português)
    - Service espera "is_active" (inglês)
    - Erro: "Could not find the 'is_active' column"
  
  2. Solução
    - Renomear "ativo" para "is_active"
    - Garantir RLS policies para anon
    - Adicionar contexto org/env
*/

-- 1. Renomear coluna ativo para is_active
ALTER TABLE whatsapp_config 
RENAME COLUMN ativo TO is_active;

-- 2. Verificar se já tem tabela whatsapp_transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'whatsapp_transactions'
  ) THEN
    -- Criar tabela de transações se não existir
    CREATE TABLE whatsapp_transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID,
      environment_id UUID,
      whatsapp_config_id UUID REFERENCES whatsapp_config(id),
      phone_to TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'sent',
      cost NUMERIC DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT now()
    );
    
    ALTER TABLE whatsapp_transactions ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 3. Verificar se já tem tabela whatsapp_templates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'whatsapp_templates'
  ) THEN
    -- Criar tabela de templates se não existir
    CREATE TABLE whatsapp_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID,
      environment_id UUID,
      name TEXT NOT NULL,
      content TEXT NOT NULL,
      variables TEXT[],
      category TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
    
    ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 4. Habilitar RLS em whatsapp_config
ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;

-- 5. Remover policies antigas
DROP POLICY IF EXISTS "whatsapp_config_anon_select" ON whatsapp_config;
DROP POLICY IF EXISTS "whatsapp_config_anon_insert" ON whatsapp_config;
DROP POLICY IF EXISTS "whatsapp_config_anon_update" ON whatsapp_config;
DROP POLICY IF EXISTS "whatsapp_config_anon_delete" ON whatsapp_config;

-- 6. Criar policies para whatsapp_config
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

-- 7. Policies para whatsapp_transactions
DROP POLICY IF EXISTS "whatsapp_transactions_anon_select" ON whatsapp_transactions;
DROP POLICY IF EXISTS "whatsapp_transactions_anon_insert" ON whatsapp_transactions;

CREATE POLICY "whatsapp_transactions_anon_select"
ON whatsapp_transactions FOR SELECT TO anon
USING (
  organization_id::text = current_setting('app.current_organization_id', true)
);

CREATE POLICY "whatsapp_transactions_anon_insert"
ON whatsapp_transactions FOR INSERT TO anon
WITH CHECK (
  organization_id::text = current_setting('app.current_organization_id', true)
);

-- 8. Policies para whatsapp_templates
DROP POLICY IF EXISTS "whatsapp_templates_anon_all" ON whatsapp_templates;

CREATE POLICY "whatsapp_templates_anon_all"
ON whatsapp_templates FOR ALL TO anon
USING (
  organization_id IS NULL
  OR organization_id::text = current_setting('app.current_organization_id', true)
)
WITH CHECK (
  organization_id IS NULL
  OR organization_id::text = current_setting('app.current_organization_id', true)
);

-- 9. Atualizar registros existentes sem organization_id
UPDATE whatsapp_config
SET 
  organization_id = 'ddbbb51d-6134-420f-a28c-bcbc27269239',
  environment_id = '2989afa7-5010-419b-bb43-7f2cd559628a'
WHERE organization_id IS NULL;
