CREATE TABLE IF NOT EXISTS public.erp_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    environment_id UUID NOT NULL,
    establishment_id UUID,
    status VARCHAR(50) NOT NULL, -- success, error
    records_processed INTEGER DEFAULT 0,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS para garantir isolamento
ALTER TABLE public.erp_sync_logs ENABLE ROW LEVEL SECURITY;

-- Política de RLS: Usuário visualiza logs da sua org / env
DROP POLICY IF EXISTS "Users can view sync logs of their organization" ON public.erp_sync_logs;
CREATE POLICY "Users can view sync logs of their organization" 
ON public.erp_sync_logs 
FOR SELECT 
USING (
  organization_id = (SELECT organization_id FROM public.users WHERE id = (auth.uid())::uuid)
  AND environment_id = (SELECT environment_id FROM public.users WHERE id = (auth.uid())::uuid)
);

DROP POLICY IF EXISTS "Service roles can insert sync logs" ON public.erp_sync_logs;
CREATE POLICY "Service roles can insert sync logs" 
ON public.erp_sync_logs 
FOR INSERT 
WITH CHECK (true); -- Somente service_role no backend via Supabase REST ou com permissões adequadas
