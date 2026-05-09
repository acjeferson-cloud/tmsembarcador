-- Ativa a extensão unaccent se não existir
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Cria uma função imutável para contornar a limitação do Postgres
CREATE OR REPLACE FUNCTION public.unaccent_immutable(text)
RETURNS text AS $$
  SELECT unaccent('unaccent', $1);
$$ LANGUAGE sql IMMUTABLE STRICT;

-- Adiciona a coluna gerada automaticamente
ALTER TABLE public.cities 
ADD COLUMN IF NOT EXISTS nome_sem_acento text 
GENERATED ALWAYS AS (public.unaccent_immutable(nome)) STORED;

-- Cria um índice para otimizar as buscas
CREATE INDEX IF NOT EXISTS idx_cities_nome_sem_acento ON public.cities (nome_sem_acento);
