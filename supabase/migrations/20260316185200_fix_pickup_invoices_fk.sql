-- Migration para corrigir a Foreign Key em pickup_invoices
-- O sistema não estava permitindo associar Notas Fiscais às Coletas porque 
-- a tabela-ponte "pickup_invoices" ainda referia-se à tabela legada "invoices",
-- rejeitando os IDs gerados pela tabela nova "invoices_nfe". 

BEGIN;

-- 1. Remove a restrição (Foreign Key) antiga que aponta para invoices
ALTER TABLE public.pickup_invoices 
  DROP CONSTRAINT IF EXISTS pickup_invoices_invoice_id_fkey;

-- 2. Recria a restrição apontando para a nova tabela invoices_nfe
ALTER TABLE public.pickup_invoices
  ADD CONSTRAINT pickup_invoices_invoice_id_fkey 
  FOREIGN KEY (invoice_id) 
  REFERENCES public.invoices_nfe(id) 
  ON DELETE CASCADE;

COMMIT;
