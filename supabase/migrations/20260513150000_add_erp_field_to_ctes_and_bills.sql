-- Migration to add `erp` column to ctes_complete, bills and invoices_nfe

ALTER TABLE public.ctes_complete ADD COLUMN IF NOT EXISTS erp VARCHAR(100);
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS erp VARCHAR(100);
ALTER TABLE public.invoices_nfe ADD COLUMN IF NOT EXISTS erp VARCHAR(100);

-- Since ctes_complete has sap_doc_entry and sap_doc_num, we can migrate existing data
-- if any exist, but it's optional. We'll just leave the new column empty initially.
