ALTER TABLE public.freight_rate_additional_fees DROP CONSTRAINT IF EXISTS freight_rate_additional_fees_fee_type_check;

UPDATE public.freight_rate_additional_fees SET fee_type = 'TAG' WHERE fee_type = 'TEA';
UPDATE public.freight_rate_additional_fees SET fee_type = 'TCP' WHERE fee_type = 'ADICIONAL_QUIMICO';

ALTER TABLE public.freight_rate_additional_fees ADD CONSTRAINT freight_rate_additional_fees_fee_type_check 
CHECK (fee_type IN ('TDA', 'TDE', 'TRT', 'TEC', 'TCP', 'TCD', 'TAG'));
