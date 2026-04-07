-- Script de Ajuste de Numeração de Coletas com Filtro Seguro de Tenant
-- Ambiente: Homologação (5feefd7d-de71-473d-8d1e-4262336c3f19)
-- Estabelecimento: 0001 - Biosys Ltda (4858949c-fe30-45e7-b7c6-7f63c8b3aaf3)

START TRANSACTION;

UPDATE pickups
SET numero_coleta = 'COL-0001'
WHERE numero_coleta = 'COL-0008'
  AND environment_id = '5feefd7d-de71-473d-8d1e-4262336c3f19'
  AND establishment_id = '4858949c-fe30-45e7-b7c6-7f63c8b3aaf3';

UPDATE pickups
SET numero_coleta = 'COL-0002'
WHERE numero_coleta = 'COL-0009'
  AND environment_id = '5feefd7d-de71-473d-8d1e-4262336c3f19'
  AND establishment_id = '4858949c-fe30-45e7-b7c6-7f63c8b3aaf3';

COMMIT;
