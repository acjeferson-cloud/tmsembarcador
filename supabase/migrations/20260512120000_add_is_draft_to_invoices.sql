-- Migration to add is_draft to invoices_nfe
ALTER TABLE invoices_nfe ADD COLUMN IF NOT EXISTS is_draft boolean DEFAULT false;
