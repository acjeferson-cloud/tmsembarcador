
ALTER TABLE freight_rates 
  ALTER COLUMN pedagio_por_kg TYPE NUMERIC(15,5),
  ALTER COLUMN percentual_gris TYPE NUMERIC(15,5),
  ALTER COLUMN valor_outros_percent TYPE NUMERIC(15,5),
  ALTER COLUMN aliquota_icms TYPE NUMERIC(15,5);

ALTER TABLE freight_rate_details
  ALTER COLUMN valor_faixa TYPE NUMERIC(15,5),
  ALTER COLUMN frete_valor TYPE NUMERIC(15,5);

NOTIFY pgrst, 'reload schema';
