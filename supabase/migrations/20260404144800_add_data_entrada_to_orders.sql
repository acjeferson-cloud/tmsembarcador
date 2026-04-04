-- Adiciona o campo data_entrada à tabela orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS data_entrada date;
