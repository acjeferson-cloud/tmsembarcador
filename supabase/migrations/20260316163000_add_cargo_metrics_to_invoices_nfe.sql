-- Add cargo metrics columns to invoices_nfe
ALTER TABLE invoices_nfe ADD COLUMN IF NOT EXISTS peso_total numeric(15,4) DEFAULT 0;
ALTER TABLE invoices_nfe ADD COLUMN IF NOT EXISTS quantidade_volumes integer DEFAULT 1;
ALTER TABLE invoices_nfe ADD COLUMN IF NOT EXISTS cubagem_total numeric(15,4) DEFAULT 0;


