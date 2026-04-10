-- =========================================================================
-- UPDATE FORÇADO: Ajuste de Tenant (Hard Multi-Tenancy)
-- Tabela: email_outgoing_config
-- Alinhando configuração de servidor SMTP à raiz da Organização atual
-- =========================================================================

UPDATE public.email_outgoing_config
SET 
  organization_id = 'a7c49619-53f0-4401-9b17-2a830dd4da40',
  environment_id = 'b0d1aa42-38bb-4a33-8e51-0c6a0a390fd1'
WHERE organization_id IS NULL OR environment_id IS NULL;
