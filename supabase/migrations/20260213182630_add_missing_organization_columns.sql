/*
  # Adicionar Colunas organization_id Faltantes

  1. Problema
    - Tabelas invoices e ctes_complete NÃO têm organization_id
    - Isso permite vazamento de dados entre organizations
    - É crítico para o isolamento multi-tenant

  2. Solução
    - Adicionar organization_id e environment_id em todas tabelas que faltam
    - Migrar dados existentes usando organization da Demonstração
    - Tornar as colunas NOT NULL após migração

  3. Tabelas Afetadas
    - invoices
    - ctes_complete
*/

-- =====================================================
-- ADICIONAR organization_id e environment_id em INVOICES
-- =====================================================

-- Adicionar colunas (nullable inicialmente)
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS organization_id UUID,
ADD COLUMN IF NOT EXISTS environment_id UUID;

-- Migrar dados existentes para a organization "Demonstração" (00000001)
UPDATE invoices 
SET organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
    environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL;

-- Tornar NOT NULL
ALTER TABLE invoices 
ALTER COLUMN organization_id SET NOT NULL,
ALTER COLUMN environment_id SET NOT NULL;

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_invoices_organization_id ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_environment_id ON invoices(environment_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org_env ON invoices(organization_id, environment_id);

-- =====================================================
-- ADICIONAR organization_id e environment_id em CTES_COMPLETE
-- =====================================================

-- Adicionar colunas (nullable inicialmente)
ALTER TABLE ctes_complete 
ADD COLUMN IF NOT EXISTS organization_id UUID,
ADD COLUMN IF NOT EXISTS environment_id UUID;

-- Migrar dados existentes para a organization "Demonstração" (00000001)
UPDATE ctes_complete 
SET organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
    environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL;

-- Tornar NOT NULL
ALTER TABLE ctes_complete 
ALTER COLUMN organization_id SET NOT NULL,
ALTER COLUMN environment_id SET NOT NULL;

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_ctes_complete_organization_id ON ctes_complete(organization_id);
CREATE INDEX IF NOT EXISTS idx_ctes_complete_environment_id ON ctes_complete(environment_id);
CREATE INDEX IF NOT EXISTS idx_ctes_complete_org_env ON ctes_complete(organization_id, environment_id);
