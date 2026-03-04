/*
  # Adicionar TODAS as colunas faltantes à tabela freight_rates

  Correção crítica: A tabela freight_rates está incompleta.
  O frontend espera 36 colunas que não existem.
  
  1. Adicionar todas as colunas faltantes
  2. Todas nullable para compatibilidade com dados existentes
*/

-- Adicionar colunas básicas
ALTER TABLE freight_rates 
ADD COLUMN IF NOT EXISTS tipo_aplicacao TEXT,
ADD COLUMN IF NOT EXISTS prazo_entrega INTEGER,
ADD COLUMN IF NOT EXISTS valor NUMERIC(15,2);

-- Adicionar colunas de pedágio
ALTER TABLE freight_rates 
ADD COLUMN IF NOT EXISTS pedagio_minimo NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS pedagio_por_kg NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS pedagio_a_cada_kg NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS pedagio_tipo_kg TEXT;

-- Adicionar colunas de ICMS
ALTER TABLE freight_rates 
ADD COLUMN IF NOT EXISTS icms_embutido_tabela TEXT;

-- Adicionar colunas de fator m³
ALTER TABLE freight_rates 
ADD COLUMN IF NOT EXISTS fator_m3 NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS fator_m3_apartir_kg NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS fator_m3_apartir_m3 NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS fator_m3_apartir_valor NUMERIC(15,2);

-- Adicionar colunas de taxas
ALTER TABLE freight_rates 
ADD COLUMN IF NOT EXISTS percentual_gris NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS gris_minimo NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS seccat NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS despacho NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS itr NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS taxa_adicional NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS coleta_entrega NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS tde_trt NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS tas NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS taxa_suframa NUMERIC(15,2);

-- Adicionar colunas de outros valores
ALTER TABLE freight_rates 
ADD COLUMN IF NOT EXISTS valor_outros_percent NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS valor_outros_minimo NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS taxa_outros_valor NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS taxa_outros_tipo_valor TEXT,
ADD COLUMN IF NOT EXISTS taxa_apartir_de NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS taxa_apartir_de_tipo TEXT,
ADD COLUMN IF NOT EXISTS taxa_outros_a_cada NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS taxa_outros_minima NUMERIC(15,2);

-- Adicionar colunas de frete mínimo
ALTER TABLE freight_rates 
ADD COLUMN IF NOT EXISTS frete_peso_minimo NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS frete_valor_minimo NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS frete_tonelada_minima NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS frete_percentual_minimo NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS frete_m3_minimo NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS valor_total_minimo NUMERIC(15,2);

-- Log sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ TODAS as 36 colunas faltantes adicionadas à freight_rates';
    RAISE NOTICE '✅ Sistema pronto para funcionar completamente';
END $$;
