-- MIGRATION: Adicionar Contexto Multi-Tenant para a tabela associativa de Faturas e CT-es (bill_ctes)
-- Execute este script no painel SQL do seu Supabase para reforçar a segurança e acelerar queries RLS.

ALTER TABLE public.bill_ctes
  ADD COLUMN IF NOT EXISTS organization_id UUID,
  ADD COLUMN IF NOT EXISTS environment_id UUID,
  ADD COLUMN IF NOT EXISTS establishment_id UUID;

-- (Opcional) Script de saneamento histórico:
-- Caso você já tenha dezenas de faturas na base e queira herdar automaticamente o tenant da tabela 'bills':
-- 
-- UPDATE public.bill_ctes bc
-- SET 
--    organization_id = b.organization_id,
--    environment_id = b.environment_id,
--    establishment_id = b.establishment_id
-- FROM public.bills b
-- WHERE bc.bill_id = b.id;
