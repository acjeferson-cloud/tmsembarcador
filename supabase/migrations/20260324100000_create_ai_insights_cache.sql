-- Tabela para cache de insights da OpenAI
CREATE TABLE IF NOT EXISTS public.ai_insights_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.saas_organizations(id) ON DELETE CASCADE,
    environment_id UUID REFERENCES public.saas_environments(id) ON DELETE CASCADE,
    establishment_code TEXT,
    partner_id UUID NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('carrier', 'business_partner')),
    insight_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Índices para performance
    CONSTRAINT uk_ai_insights_cache UNIQUE (organization_id, partner_id, type)
);

-- Habilitar RLS
ALTER TABLE public.ai_insights_cache ENABLE ROW LEVEL SECURITY;

-- Índice para acelerar a busca por expiração
CREATE INDEX IF NOT EXISTS idx_ai_insights_cache_created_at ON public.ai_insights_cache(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_insights_cache_tenant ON public.ai_insights_cache(organization_id, environment_id);

-- Políticas RLS
-- Permitir select para usuários autenticados da mesma organização
CREATE POLICY "Usuários podem ver cache da sua organizacao"
    ON public.ai_insights_cache
    FOR SELECT
    USING (organization_id = ((get_user_context())->>'org_id')::uuid);

-- Permitir insert para usuários autenticados da mesma organização
CREATE POLICY "Usuários podem inserir cache na sua organizacao"
    ON public.ai_insights_cache
    FOR INSERT
    WITH CHECK (organization_id = ((get_user_context())->>'org_id')::uuid);

-- Permitir update para usuários autenticados da mesma organização
CREATE POLICY "Usuários podem atualizar cache na sua organizacao"
    ON public.ai_insights_cache
    FOR UPDATE
    USING (organization_id = ((get_user_context())->>'org_id')::uuid)
    WITH CHECK (organization_id = ((get_user_context())->>'org_id')::uuid);

-- Para a Edge Function bypassar o RLS, ela conectará com Service Role.
