/*
  # Atualizar status existentes e constraints

  1. Mudanças
    - Atualiza status existentes para português
    - Remove constraints antigas
    - Adiciona novas constraints com status em português
    
  2. Tabelas afetadas
    - invoices: Emitida, Coletada, Em Trânsito, Saiu p/ Entrega, Entregue, Cancelada
    - pickups: Emitida, Solicitada, Realizada, Cancelada
    - bills: Importada, Auditada e Aprovada, Auditada e Reprovada, Com NF-e Referenciada, Cancelada
*/

-- PICKUPS: Remover constraint e atualizar registros existentes
ALTER TABLE pickups DROP CONSTRAINT IF EXISTS pickups_status_check;

UPDATE pickups SET status = 'Realizada' WHERE status IN ('completed', 'confirmed');
UPDATE pickups SET status = 'Cancelada' WHERE status = 'cancelled';
UPDATE pickups SET status = 'Solicitada' WHERE status IN ('scheduled', 'in_progress');
UPDATE pickups SET status = 'Emitida' WHERE status = 'failed';

ALTER TABLE pickups ADD CONSTRAINT pickups_status_check 
CHECK (status IN ('Emitida', 'Solicitada', 'Realizada', 'Cancelada'));

-- BILLS: Remover constraint e atualizar registros existentes
ALTER TABLE bills DROP CONSTRAINT IF EXISTS bills_status_check;

UPDATE bills SET status = 'Importada' WHERE status = 'pending';
UPDATE bills SET status = 'Auditada e Aprovada' WHERE status = 'paid';
UPDATE bills SET status = 'Auditada e Reprovada' WHERE status = 'overdue';
UPDATE bills SET status = 'Cancelada' WHERE status = 'cancelled';
UPDATE bills SET status = 'Com NF-e Referenciada' WHERE status = 'partial';

ALTER TABLE bills ADD CONSTRAINT bills_status_check 
CHECK (status IN ('Importada', 'Auditada e Aprovada', 'Auditada e Reprovada', 'Com NF-e Referenciada', 'Cancelada'));

-- INVOICES: Remover constraints e manter status atuais
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_nfe_status_check;

-- Atualizar invoices existentes se houver
UPDATE invoices SET status = 'Emitida' WHERE status IN ('pending', 'Pendente');
UPDATE invoices SET status = 'Cancelada' WHERE status IN ('cancelled', 'denied');
UPDATE invoices SET status = 'Coletada' WHERE status = 'authorized';

ALTER TABLE invoices ADD CONSTRAINT invoices_status_check 
CHECK (status IN ('Emitida', 'Coletada', 'Em Trânsito', 'Saiu p/ Entrega', 'Entregue', 'Cancelada'));
