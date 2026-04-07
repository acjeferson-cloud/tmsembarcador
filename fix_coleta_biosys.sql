-- Script de Ajuste de Numeração de Coletas com Filtro Seguro de Tenant
-- Organização: 83833da2-1106-4bb9-9326-5d8f9ec574c2
-- Ambiente: 5feefd7d-de71-473d-8d1e-4262336c3f19
-- Estabelecimento 3: 1e1e1563-37a5-4275-b2f9-78ef967a0e35

START TRANSACTION;

UPDATE pickups
SET numero_coleta = 'COL-0001'
WHERE numero_coleta = 'COL-0010'
  AND organization_id = '83833da2-1106-4bb9-9326-5d8f9ec574c2'
  AND environment_id = '5feefd7d-de71-473d-8d1e-4262336c3f19'
  AND establishment_id = '1e1e1563-37a5-4275-b2f9-78ef967a0e35';

COMMIT;
