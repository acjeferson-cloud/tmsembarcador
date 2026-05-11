ALTER TABLE public.freight_rates 
ADD COLUMN IF NOT EXISTS coleta_franquia_kg NUMERIC(15,3),
ADD COLUMN IF NOT EXISTS coleta_excedente_kg NUMERIC(15,4),
ADD COLUMN IF NOT EXISTS entrega_franquia_kg NUMERIC(15,3),
ADD COLUMN IF NOT EXISTS entrega_excedente_kg NUMERIC(15,4);