ALTER TABLE public.freight_rate_additional_fees DROP CONSTRAINT IF EXISTS freight_rate_additional_fees_value_type_check;
ALTER TABLE public.freight_rate_additional_fees ADD CONSTRAINT freight_rate_additional_fees_value_type_check CHECK (value_type IN ('fixed', 'percent_weight', 'percent_value', 'percent_weight_value', 'percent_cte', 'percent_freight_without_icms', 'per_kg'));
