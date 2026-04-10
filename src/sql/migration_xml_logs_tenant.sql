-- =========================================================================
-- MIGRATION & UPDATE: Hard Multi-Tenancy para xml_auto_import_logs
-- Garantindo que a tabela de logs tenha as colunas de Tenant preenchidas
-- =========================================================================

-- 1. Cria as colunas caso a tabela ainda não as tenha
ALTER TABLE public.xml_auto_import_logs
  ADD COLUMN IF NOT EXISTS organization_id UUID,
  ADD COLUMN IF NOT EXISTS environment_id UUID,
  ADD COLUMN IF NOT EXISTS establishment_id UUID;

-- 2. Atualiza a tabela para preencher os logs órfãos/existentes
UPDATE public.xml_auto_import_logs
SET 
  organization_id = 'a7c49619-53f0-4401-9b17-2a830dd4da40',
  environment_id = 'b0d1aa42-38bb-4a33-8e51-0c6a0a390fd1'
WHERE organization_id IS NULL OR environment_id IS NULL;
