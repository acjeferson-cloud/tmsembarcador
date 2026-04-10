-- =========================================================================
-- UPDATE FORÇADO: Injeção de Contexto (Hard Multi-Tenancy)
-- Alinhando faturas órfãs à raiz da Organização atual
-- =========================================================================

-- 1. Atualizar todas as faturas (bills) que estão soltas ou sem preenchimento correto
UPDATE public.bills
SET 
  organization_id = 'a7c49619-53f0-4401-9b17-2a830dd4da40',
  environment_id = 'b0d1aa42-38bb-4a33-8e51-0c6a0a390fd1',
  establishment_id = '5ca0807a-7e5f-44fe-80c9-cb5e30d5d984'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- 2. Atualizar todos os vínculos com CT-es (bill_ctes) para a exata mesma raiz
UPDATE public.bill_ctes
SET 
  organization_id = 'a7c49619-53f0-4401-9b17-2a830dd4da40',
  environment_id = 'b0d1aa42-38bb-4a33-8e51-0c6a0a390fd1',
  establishment_id = '5ca0807a-7e5f-44fe-80c9-cb5e30d5d984'
WHERE organization_id IS NULL OR environment_id IS NULL;
