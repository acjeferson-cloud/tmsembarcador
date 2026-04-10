-- =========================================================================
-- CORREÇÃO DO SCHEMA "ESTABLISHMENT_ID" NA "ELECTRONIC_DOCUMENTS"
-- =========================================================================

-- 1. A tabela no Supabase foi criada esquecendo de uma das chaves da tríade
ALTER TABLE public.electronic_documents 
ADD COLUMN IF NOT EXISTS establishment_id UUID;

-- 2. Repopula todos os registros mortos 
UPDATE public.electronic_documents
SET 
  organization_id = 'a7c49619-53f0-4401-9b17-2a830dd4da40',
  environment_id = 'b0d1aa42-38bb-4a33-8e51-0c6a0a390fd1',
  establishment_id = '5ca0807a-7e5f-44fe-80c9-cb5e30d5d984';
