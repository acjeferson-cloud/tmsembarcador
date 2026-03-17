-- Add peso and cubagem columns to invoices_nfe_products
ALTER TABLE invoices_nfe_products ADD COLUMN IF NOT EXISTS peso numeric(15,4) DEFAULT 0;
ALTER TABLE invoices_nfe_products ADD COLUMN IF NOT EXISTS cubagem numeric(15,4) DEFAULT 0;
