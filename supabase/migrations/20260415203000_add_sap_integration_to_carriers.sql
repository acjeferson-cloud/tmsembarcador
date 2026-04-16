-- Migração para adicionar suporte a campos de integração SAP em carriers
-- Data: 2026-04-15 20:30

-- 1. Adicionar colunas
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS sap_cardcode TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS sap_bpl_id TEXT;

-- 2. Comentários para documentação
COMMENT ON COLUMN carriers.sap_cardcode IS 'Código do Parceiro de Negócio (Fornecedor) no SAP Business One';
COMMENT ON COLUMN carriers.sap_bpl_id IS 'ID da Filial (Business Place) padrão para lançamentos desta transportadora no SAP';

-- 3. Atualizar permissões (se necessário, embora usualmente herdado)
-- GRANT ALL ON carriers TO authenticated;
-- GRANT ALL ON carriers TO service_role;
