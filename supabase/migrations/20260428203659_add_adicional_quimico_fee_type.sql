-- Adiciona 'ADICIONAL_QUIMICO' ao fee_type da tabela freight_rate_additional_fees

ALTER TABLE public.freight_rate_additional_fees DROP CONSTRAINT IF EXISTS freight_rate_additional_fees_fee_type_check;
ALTER TABLE public.freight_rate_additional_fees ADD CONSTRAINT freight_rate_additional_fees_fee_type_check CHECK (fee_type IN ('TDA', 'TDE', 'TRT', 'TEC', 'ADICIONAL_QUIMICO'));

-- Recarrega o cache do PostgREST para reconhecer a nova enumeração
NOTIFY pgrst, 'reload schema';
