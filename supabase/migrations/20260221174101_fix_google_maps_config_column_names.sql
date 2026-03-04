/*
  # Corrigir nomes de colunas da tabela google_maps_config
  
  1. Problema
    - Tabela tem coluna "ativo" (português)
    - Service espera "is_active" (inglês)
    - Erro: "Could not find the 'is_active' column"
  
  2. Solução
    - Renomear "ativo" para "is_active"
    - Garantir compatibilidade com código frontend
  
  3. Outras melhorias
    - Adicionar organization_id e environment_id se faltarem
    - Garantir RLS policies para anon
*/

-- 1. Renomear coluna ativo para is_active
ALTER TABLE google_maps_config 
RENAME COLUMN ativo TO is_active;

-- 2. Garantir que organization_id e environment_id existem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'google_maps_config' 
    AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE google_maps_config ADD COLUMN organization_id UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'google_maps_config' 
    AND column_name = 'environment_id'
  ) THEN
    ALTER TABLE google_maps_config ADD COLUMN environment_id UUID;
  END IF;
END $$;

-- 3. Habilitar RLS
ALTER TABLE google_maps_config ENABLE ROW LEVEL SECURITY;

-- 4. Remover policies antigas
DROP POLICY IF EXISTS "google_maps_config_anon_select" ON google_maps_config;
DROP POLICY IF EXISTS "google_maps_config_anon_insert" ON google_maps_config;
DROP POLICY IF EXISTS "google_maps_config_anon_update" ON google_maps_config;
DROP POLICY IF EXISTS "google_maps_config_anon_delete" ON google_maps_config;

-- 5. Criar policies para anon com contexto
CREATE POLICY "google_maps_config_anon_select"
ON google_maps_config FOR SELECT TO anon
USING (
  organization_id IS NULL
  OR organization_id::text = current_setting('app.current_organization_id', true)
);

CREATE POLICY "google_maps_config_anon_insert"
ON google_maps_config FOR INSERT TO anon
WITH CHECK (
  organization_id IS NULL
  OR organization_id::text = current_setting('app.current_organization_id', true)
);

CREATE POLICY "google_maps_config_anon_update"
ON google_maps_config FOR UPDATE TO anon
USING (
  organization_id IS NULL
  OR organization_id::text = current_setting('app.current_organization_id', true)
)
WITH CHECK (
  organization_id IS NULL
  OR organization_id::text = current_setting('app.current_organization_id', true)
);

CREATE POLICY "google_maps_config_anon_delete"
ON google_maps_config FOR DELETE TO anon
USING (
  organization_id IS NULL
  OR organization_id::text = current_setting('app.current_organization_id', true)
);

-- 6. Atualizar registros existentes sem organization_id
UPDATE google_maps_config
SET 
  organization_id = 'ddbbb51d-6134-420f-a28c-bcbc27269239',
  environment_id = '2989afa7-5010-419b-bb43-7f2cd559628a'
WHERE organization_id IS NULL;
