/*
  # Add fracao_base to freight_rate_details

  Adiciona a coluna fracao_base para possibilitar o cálculo do frete usando 
  unidades de referência baseadas em multiplicadores (ex: R$ 208,00 por Tonelada -> fracao_base: 1000).
*/

ALTER TABLE freight_rate_details 
ADD COLUMN IF NOT EXISTS fracao_base numeric;

-- Informar ao cache do PostgREST a mudança de schema
NOTIFY pgrst, 'reload schema';
