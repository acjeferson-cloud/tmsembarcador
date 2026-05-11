-- Adiciona a coluna regime_tributario na tabela carriers
ALTER TABLE public.carriers 
ADD COLUMN IF NOT EXISTS regime_tributario VARCHAR(50) DEFAULT 'regime_normal'
CHECK (regime_tributario IN ('regime_normal', 'simples_nacional', 'isento'));

-- Atualiza a função calculate_freight_b2b para suportar regime_tributario
-- O regime tributário não é obrigatoriamente incluído no output, mas a query faz join na tabela carriers,
-- O cálculo comercial e de ICMS (Gross Up) no B2B RPC atualmente não projeta impostos em tempo real no SQL,
-- Então o SQL em si pode continuar como está, pois o Gross Up é feito via código (Edge/TypeScript) com os componentes de tarifa que vêm dali, ou podemos deixar preparado.
-- Neste momento, focaremos o motor SQL em apenas retornar as tarifas como já estava.
