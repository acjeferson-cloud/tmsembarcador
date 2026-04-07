-- Script de Ajuste de Numeração de Coletas
-- Altera as coletas geradas globalmente (COL-0008, 0009, 0010) 
-- para a sequência correta de cada filial.

START TRANSACTION;

-- Para o primeiro estabelecimento que gerou a 0008 e 0009
UPDATE pickups
SET numero_coleta = 'COL-0001'
WHERE numero_coleta = 'COL-0008';

UPDATE pickups
SET numero_coleta = 'COL-0002'
WHERE numero_coleta = 'COL-0009';

-- Para o novo estabelecimento (0003 - Biosys) que gerou a 0010
UPDATE pickups
SET numero_coleta = 'COL-0001'
WHERE numero_coleta = 'COL-0010';

COMMIT;
