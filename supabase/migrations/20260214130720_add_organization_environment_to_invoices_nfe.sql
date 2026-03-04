/*
  # Adicionar organization_id e environment_id em invoices_nfe
  
  1. Problema
    - Tabela invoices_nfe não tem organization_id e environment_id
    - Isso causa violação de RLS ao importar XMLs de NFe
    - Erro: "new row violates row-level security policy for table invoices_nfe"
  
  2. Solução
    - Adicionar organization_id e environment_id na tabela invoices_nfe
    - Migrar dados existentes para a organization "Demonstração"
    - Criar políticas RLS adequadas
    
  3. Índices
    - Criar índices para performance em queries multi-tenant
*/

-- =====================================================
-- TABELA: invoices_nfe
-- =====================================================

-- Adicionar colunas (nullable inicialmente)
ALTER TABLE invoices_nfe 
ADD COLUMN IF NOT EXISTS organization_id UUID,
ADD COLUMN IF NOT EXISTS environment_id UUID;

-- Migrar dados existentes para a organization "Demonstração"
UPDATE invoices_nfe 
SET organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
    environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL;

-- Tornar NOT NULL
ALTER TABLE invoices_nfe 
ALTER COLUMN organization_id SET NOT NULL,
ALTER COLUMN environment_id SET NOT NULL;

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_invoices_nfe_organization_id ON invoices_nfe(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_nfe_environment_id ON invoices_nfe(environment_id);
CREATE INDEX IF NOT EXISTS idx_invoices_nfe_org_env ON invoices_nfe(organization_id, environment_id);

-- =====================================================
-- ATUALIZAR POLÍTICAS RLS
-- =====================================================

-- Habilitar RLS se ainda não estiver
ALTER TABLE invoices_nfe ENABLE ROW LEVEL SECURITY;

-- RLS para invoices_nfe
DROP POLICY IF EXISTS "Users can view invoices_nfe from their organization and environment" ON invoices_nfe;
CREATE POLICY "Users can view invoices_nfe from their organization and environment"
  ON invoices_nfe FOR SELECT
  TO authenticated
  USING (
    organization_id::text = current_setting('app.current_organization_id', true)
    AND environment_id::text = current_setting('app.current_environment_id', true)
  );

DROP POLICY IF EXISTS "Users can insert invoices_nfe in their organization and environment" ON invoices_nfe;
CREATE POLICY "Users can insert invoices_nfe in their organization and environment"
  ON invoices_nfe FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id::text = current_setting('app.current_organization_id', true)
    AND environment_id::text = current_setting('app.current_environment_id', true)
  );

DROP POLICY IF EXISTS "Users can update invoices_nfe in their organization and environment" ON invoices_nfe;
CREATE POLICY "Users can update invoices_nfe in their organization and environment"
  ON invoices_nfe FOR UPDATE
  TO authenticated
  USING (
    organization_id::text = current_setting('app.current_organization_id', true)
    AND environment_id::text = current_setting('app.current_environment_id', true)
  )
  WITH CHECK (
    organization_id::text = current_setting('app.current_organization_id', true)
    AND environment_id::text = current_setting('app.current_environment_id', true)
  );

DROP POLICY IF EXISTS "Users can delete invoices_nfe in their organization and environment" ON invoices_nfe;
CREATE POLICY "Users can delete invoices_nfe in their organization and environment"
  ON invoices_nfe FOR DELETE
  TO authenticated
  USING (
    organization_id::text = current_setting('app.current_organization_id', true)
    AND environment_id::text = current_setting('app.current_environment_id', true)
  );