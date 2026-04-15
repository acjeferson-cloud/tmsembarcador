-- Migration: 20260414143700_add_reentrega_devolucao_to_freight_rates.sql
-- Adiciona colunas para precificação de Reentrega e Devolução com tipagem Enum (PERCENTUAL ou VALOR_FIXO)

-- Adicionando Constraints de Check para garantir os Enums via texto
ALTER TABLE public.freight_rate_tables
ADD COLUMN IF NOT EXISTS devolucao_tipo_cobranca VARCHAR(20) CHECK (devolucao_tipo_cobranca IN ('PERCENTUAL', 'VALOR_FIXO')),
ADD COLUMN IF NOT EXISTS devolucao_valor NUMERIC(15, 2),
ADD COLUMN IF NOT EXISTS reentrega_tipo_cobranca VARCHAR(20) CHECK (reentrega_tipo_cobranca IN ('PERCENTUAL', 'VALOR_FIXO')),
ADD COLUMN IF NOT EXISTS reentrega_valor NUMERIC(15, 2);

-- Atualização dos Comments
COMMENT ON COLUMN public.freight_rate_tables.devolucao_tipo_cobranca IS 'Tipo de taxação do frete de devolução (PERCENTUAL ou VALOR_FIXO).';
COMMENT ON COLUMN public.freight_rate_tables.devolucao_valor IS 'Fração paramétrica ou Valor Fixo contratual a ser acrescido ao devolver um CTE.';
COMMENT ON COLUMN public.freight_rate_tables.reentrega_tipo_cobranca IS 'Tipo de taxação do frete de reentrega (PERCENTUAL ou VALOR_FIXO).';
COMMENT ON COLUMN public.freight_rate_tables.reentrega_valor IS 'Fração paramétrica ou Valor Fixo contratual a ser cobrado por reentrega de CTE.';
