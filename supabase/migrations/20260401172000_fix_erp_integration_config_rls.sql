-- Garante a política de RLS permissiva (via isolamento de tenant) para erp_integration_config
-- Isso resolve a falta de políticas (ou políticas incompletas) que bloqueavam o banco de aceitar novos inserts de ERP

DO $$ 
BEGIN
    ---------------------------------------------
    -- 1. INSERT POLICY
    ---------------------------------------------
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'erp_integration_config' 
        AND policyname = 'erp_integration_config_isolation_insert_auth'
    ) THEN
        CREATE POLICY "erp_integration_config_isolation_insert_auth" 
        ON public.erp_integration_config 
        FOR INSERT 
        TO authenticated 
        WITH CHECK (
            organization_id = get_session_organization_id() 
        );
    END IF;

    ---------------------------------------------
    -- 2. UPDATE POLICY
    ---------------------------------------------
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'erp_integration_config' 
        AND policyname = 'erp_integration_config_isolation_update_auth'
    ) THEN
        CREATE POLICY "erp_integration_config_isolation_update_auth" 
        ON public.erp_integration_config 
        FOR UPDATE 
        TO authenticated 
        USING (
            organization_id = get_session_organization_id() 
        )
        WITH CHECK (
            organization_id = get_session_organization_id() 
        );
    END IF;

    ---------------------------------------------
    -- 3. SELECT POLICY
    ---------------------------------------------
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'erp_integration_config' 
        AND policyname = 'erp_integration_config_isolation_select_auth'
    ) THEN
        CREATE POLICY "erp_integration_config_isolation_select_auth" 
        ON public.erp_integration_config 
        FOR SELECT 
        TO authenticated 
        USING (
            organization_id = get_session_organization_id() 
        );
    END IF;
    
END $$;
