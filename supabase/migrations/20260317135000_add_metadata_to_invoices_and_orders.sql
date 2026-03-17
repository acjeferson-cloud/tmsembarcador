-- Adicionar coluna metadata na tabela invoices_nfe se não existir
ALTER TABLE invoices_nfe ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Adicionar coluna metadata na tabela orders se não existir
ALTER TABLE orders ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
