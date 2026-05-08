ALTER TABLE public.freight_rate_additional_fees 
  ALTER COLUMN min_weight_kg TYPE NUMERIC(15, 4),
  ALTER COLUMN max_weight_kg TYPE NUMERIC(15, 4);
