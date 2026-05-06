-- Migração para tabelas de Exceção de Taxas (TDE/TDA) em grande volume

CREATE TABLE IF NOT EXISTS public.tax_exception_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.saas_organizations(id) ON DELETE CASCADE,
  carrier_id UUID REFERENCES public.carriers(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  type VARCHAR NOT NULL, -- Ex: 'TDE', 'TDA'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativar RLS
ALTER TABLE public.tax_exception_groups ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.tax_exception_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES public.tax_exception_groups(id) ON DELETE CASCADE,
  document VARCHAR NOT NULL, -- O CNPJ limpo
  name VARCHAR, -- Nome do cliente para visualização
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices vitais para performance O(log N) no cálculo de frete
CREATE INDEX IF NOT EXISTS idx_tax_exception_members_document ON public.tax_exception_members(document);
CREATE INDEX IF NOT EXISTS idx_tax_exception_members_group_id ON public.tax_exception_members(group_id);

-- Ativar RLS
ALTER TABLE public.tax_exception_members ENABLE ROW LEVEL SECURITY;

-- Adicionar vínculo na tabela de taxas adicionais (ATUALIZADO)
ALTER TABLE public.freight_rate_additional_fees ADD COLUMN IF NOT EXISTS exception_group_id UUID REFERENCES public.tax_exception_groups(id) ON DELETE SET NULL;

-- Políticas de RLS para tax_exception_groups
DROP POLICY IF EXISTS "Users can view tax exception groups from their organization" ON public.tax_exception_groups;
CREATE POLICY "Users can view tax exception groups from their organization" 
ON public.tax_exception_groups FOR SELECT 
USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert tax exception groups in their organization" ON public.tax_exception_groups;
CREATE POLICY "Users can insert tax exception groups in their organization" 
ON public.tax_exception_groups FOR INSERT 
WITH CHECK (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update tax exception groups in their organization" ON public.tax_exception_groups;
CREATE POLICY "Users can update tax exception groups in their organization" 
ON public.tax_exception_groups FOR UPDATE 
USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete tax exception groups in their organization" ON public.tax_exception_groups;
CREATE POLICY "Users can delete tax exception groups in their organization" 
ON public.tax_exception_groups FOR DELETE 
USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Políticas de RLS para tax_exception_members
DROP POLICY IF EXISTS "Users can view tax exception members from their organization" ON public.tax_exception_members;
CREATE POLICY "Users can view tax exception members from their organization" 
ON public.tax_exception_members FOR SELECT 
USING (group_id IN (SELECT id FROM public.tax_exception_groups WHERE organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())));

DROP POLICY IF EXISTS "Users can insert tax exception members" ON public.tax_exception_members;
CREATE POLICY "Users can insert tax exception members" 
ON public.tax_exception_members FOR INSERT 
WITH CHECK (group_id IN (SELECT id FROM public.tax_exception_groups WHERE organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())));

DROP POLICY IF EXISTS "Users can delete tax exception members" ON public.tax_exception_members;
CREATE POLICY "Users can delete tax exception members" 
ON public.tax_exception_members FOR DELETE 
USING (group_id IN (SELECT id FROM public.tax_exception_groups WHERE organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())));
