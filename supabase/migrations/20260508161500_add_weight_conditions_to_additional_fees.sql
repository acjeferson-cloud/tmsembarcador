-- Add weight conditions to freight_rate_additional_fees
ALTER TABLE public.freight_rate_additional_fees 
  ADD COLUMN IF NOT EXISTS min_weight_kg NUMERIC(10, 4) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS max_weight_kg NUMERIC(10, 4) DEFAULT NULL;

-- Update the check constraint for fee_type
ALTER TABLE public.freight_rate_additional_fees 
  DROP CONSTRAINT IF EXISTS freight_rate_additional_fees_fee_type_check;

ALTER TABLE public.freight_rate_additional_fees 
  ADD CONSTRAINT freight_rate_additional_fees_fee_type_check 
  CHECK (fee_type IN ('TDA', 'TDE', 'TRT', 'TEC', 'TCP', 'TCD', 'TAG', 'EMEX', 'DESPACHO'));
