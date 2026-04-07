-- Script de Migração: Corrigir Constraint de Numeração por Estabelecimento

START TRANSACTION;

-- 1. Removemos a trava global de ambiente (que impedia estabelecimentos diferentes de terem a mesma COL-0001)
ALTER TABLE pickups 
DROP CONSTRAINT IF EXISTS pickups_organization_id_environment_id_numero_coleta_key;

-- 2. Recriamos a trava corretamente: A COL-XXXX só não pode repetir dentro da mesma Organização + Ambiente + *Estabelecimento*
ALTER TABLE pickups 
ADD CONSTRAINT pickups_org_env_est_numero_coleta_key 
UNIQUE (organization_id, environment_id, establishment_id, numero_coleta);

-- 3. Agora sim aplicamos o ajuste das coletas que você solicitou!
UPDATE pickups
SET numero_coleta = 'COL-0001'
WHERE numero_coleta = 'COL-0010'
  AND organization_id = '83833da2-1106-4bb9-9326-5d8f9ec574c2'
  AND environment_id = '5feefd7d-de71-473d-8d1e-4262336c3f19'
  AND establishment_id = '1e1e1563-37a5-4275-b2f9-78ef967a0e35';

COMMIT;
