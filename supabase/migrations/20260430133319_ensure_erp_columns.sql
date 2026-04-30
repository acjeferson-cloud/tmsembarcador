ALTER TABLE public.erp_integration_config 
ADD COLUMN IF NOT EXISTS invoice_model VARCHAR(50),
ADD COLUMN IF NOT EXISTS invoice_default_item VARCHAR(255);
