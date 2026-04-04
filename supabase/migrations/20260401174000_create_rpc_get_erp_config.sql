-- Cria Função RPC Atômica para Buscar a Configuração ERP Ativa
-- Bypass seguro de RLS para evitar o drop de variáveis de sessão no connection pooling do PostgREST

CREATE OR REPLACE FUNCTION public.get_erp_integration_config(p_org_id UUID, p_env_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT row_to_json(e)::jsonb INTO v_result
    FROM public.erp_integration_config e
    WHERE e.organization_id = p_org_id
      AND e.environment_id = p_env_id
      AND e.is_active = true
    ORDER BY e.created_at DESC
    LIMIT 1;
    
    RETURN v_result;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- Permite acesso aos usuários
REVOKE ALL ON FUNCTION public.get_erp_integration_config(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_erp_integration_config(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_erp_integration_config(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_erp_integration_config(UUID, UUID) TO service_role;
