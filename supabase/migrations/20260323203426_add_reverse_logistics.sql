-- Migration para implementar Logística Reversa no TMS Embarcador

-- 1. Adição de campos na tabela invoices
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS direction text DEFAULT 'outbound' CHECK (direction IN ('outbound', 'inbound', 'reverse')),
ADD COLUMN IF NOT EXISTS original_invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL;

-- Comentários para a tabela invoices
COMMENT ON COLUMN public.invoices.direction IS 'Direção do fluxo da nota: outbound (saída normal), inbound (entrada normal), reverse (logística reversa)';
COMMENT ON COLUMN public.invoices.original_invoice_id IS 'Vincula uma nota reversa à sua nota de saída original';

-- 2. Adição de campos na tabela ctes
ALTER TABLE public.ctes 
ADD COLUMN IF NOT EXISTS direction text DEFAULT 'outbound' CHECK (direction IN ('outbound', 'inbound', 'reverse'));

-- Comentários para a tabela ctes
COMMENT ON COLUMN public.ctes.direction IS 'Direção do frete do CT-e correspondente';

-- Forçar update nos registros existentes para outbound caso null
UPDATE public.invoices SET direction = 'outbound' WHERE direction IS NULL;
UPDATE public.ctes SET direction = 'outbound' WHERE direction IS NULL;
