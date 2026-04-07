-- Script de Correção: pickup_requests

START TRANSACTION;

-- 1. Resgata os dados de tenant da "coleta primária" e injeta em todos os logs de request que ficaram "órfãos" / vazios
UPDATE public.pickup_requests pr
SET 
  organization_id = p.organization_id,
  environment_id = p.environment_id,
  establishment_id = p.establishment_id
FROM public.pickups p
WHERE pr.pickup_id = p.id
  AND (pr.organization_id IS NULL OR pr.environment_id IS NULL OR pr.establishment_id IS NULL);

-- 2. Trava a estrutura do banco de dados para rejeitar cabalmente qualquer log que não contiver a trilha de auditoria e tenant
ALTER TABLE public.pickup_requests
ALTER COLUMN organization_id SET NOT NULL,
ALTER COLUMN environment_id SET NOT NULL,
ALTER COLUMN establishment_id SET NOT NULL;

COMMIT;
