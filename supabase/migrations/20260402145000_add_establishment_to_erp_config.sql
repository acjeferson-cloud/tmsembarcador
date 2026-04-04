-- Adiciona a coluna establishment_id para suportar configurações individuais por estabelecimento
ALTER TABLE public.erp_integration_config
ADD COLUMN IF NOT EXISTS establishment_id UUID;

-- Atualiza as políticas de RLS para incluir o estabelecimento
DROP POLICY IF EXISTS "erp_integration_config_isolation_insert_auth" ON public.erp_integration_config;
CREATE POLICY "erp_integration_config_isolation_insert_auth" 
ON public.erp_integration_config 
FOR INSERT 
TO authenticated 
WITH CHECK (
    organization_id = get_session_organization_id() 
    AND (
        establishment_id IS NULL OR 
        establishment_id = get_session_establishment_id()
    )
);

DROP POLICY IF EXISTS "erp_integration_config_isolation_update_auth" ON public.erp_integration_config;
CREATE POLICY "erp_integration_config_isolation_update_auth" 
ON public.erp_integration_config 
FOR UPDATE 
TO authenticated 
USING (
    organization_id = get_session_organization_id() 
)
WITH CHECK (
    organization_id = get_session_organization_id() 
    AND (
        establishment_id IS NULL OR 
        establishment_id = get_session_establishment_id()
    )
);

DROP POLICY IF EXISTS "erp_integration_config_isolation_select_auth" ON public.erp_integration_config;
CREATE POLICY "erp_integration_config_isolation_select_auth" 
ON public.erp_integration_config 
FOR SELECT 
TO authenticated 
USING (
    organization_id = get_session_organization_id() 
    AND (
        establishment_id IS NULL OR 
        establishment_id = get_session_establishment_id()
    )
);

-- Recarrega o cache do PostgREST
NOTIFY pgrst, 'reload schema';
