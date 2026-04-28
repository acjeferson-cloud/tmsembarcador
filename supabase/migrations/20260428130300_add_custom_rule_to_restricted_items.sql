-- Adiciona o campo custom_rule do tipo JSONB para suportar regras dinamicas (UDFs)
ALTER TABLE public.freight_rate_restricted_items
ADD COLUMN custom_rule JSONB;

-- Cria um indice GIN para buscas performaticas em chaves do JSONB (opcional mas recomendado)
CREATE INDEX IF NOT EXISTS idx_restricted_items_custom_rule ON public.freight_rate_restricted_items USING GIN (custom_rule);
