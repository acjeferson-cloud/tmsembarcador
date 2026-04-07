-- Script de Correção 2.0: Criar coluna faltante e corrigir nulos

START TRANSACTION;

-- 1. A tabela pickup_requests não possuía a coluna establishment_id fisicamente no banco! Vamos criá-la:
ALTER TABLE public.pickup_requests 
ADD COLUMN IF NOT EXISTS establishment_id uuid;

-- 2. Resgata os dados de tenant da "coleta mestra" e injeta em todos os logs de request nulos
UPDATE public.pickup_requests pr
SET 
  organization_id = p.organization_id,
  environment_id = p.environment_id,
  establishment_id = p.establishment_id
FROM public.pickups p
WHERE pr.pickup_id = p.id
  AND (pr.organization_id IS NULL OR pr.environment_id IS NULL OR pr.establishment_id IS NULL);

-- 3. Trava a tabela para REJEITAR qualquer tentativa de gerar log sem tenant
ALTER TABLE public.pickup_requests
ALTER COLUMN organization_id SET NOT NULL,
ALTER COLUMN environment_id SET NOT NULL,
ALTER COLUMN establishment_id SET NOT NULL;

COMMIT;
