/*
  Adiciona establishment_id à tabela carriers para isolamento por estabelecimento
*/

-- 1. Adicionar a coluna establishment_id
ALTER TABLE public.carriers 
  ADD COLUMN IF NOT EXISTS establishment_id uuid REFERENCES public.establishments(id) ON DELETE CASCADE;

-- 2. Atualizar constraint única para incluir establishment_id
-- Diferentes estabelecimentos podem ter transportadores com o mesmo código (ex: 0001)
ALTER TABLE public.carriers DROP CONSTRAINT IF EXISTS carriers_organization_id_environment_id_codigo_key;
ALTER TABLE public.carriers DROP CONSTRAINT IF EXISTS carriers_org_env_estab_codigo_key;

-- Adiciona a nova constraint usando o padrão de nome do Supabase para uniques
ALTER TABLE public.carriers ADD CONSTRAINT carriers_org_env_estab_codigo_key UNIQUE (organization_id, environment_id, establishment_id, codigo);

-- 3. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_carriers_establishment ON public.carriers(organization_id, environment_id, establishment_id);
