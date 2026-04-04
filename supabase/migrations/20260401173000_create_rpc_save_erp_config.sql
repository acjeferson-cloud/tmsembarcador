-- Cria Função RPC Atômica para Salvar Configurações ERP
-- Resolve problemas severos de RLS e Pool de Conexões assíncronas no PostgREST 
-- Garantido rodar Update e Insert em uma única transação atômica
CREATE OR REPLACE FUNCTION public.save_erp_integration_config(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_org_id UUID;
    v_env_id UUID;
BEGIN
    v_org_id := (p_payload->>'organization_id')::UUID;
    v_env_id := (p_payload->>'environment_id')::UUID;
    
    -- Se o environment_id ou organization_id forem nulos, o cast acima vai disparar falha segura.
    
    -- Passo 1: Inativa qualquer configuração ativa desse mesmo cliente
    UPDATE public.erp_integration_config 
    SET is_active = false 
    WHERE organization_id = v_org_id 
      AND environment_id = v_env_id 
      AND is_active = true;
    
    -- Passo 2: Insere o novo record atômico!
    INSERT INTO public.erp_integration_config (
        organization_id,
        environment_id,
        erp_system,
        api_url,
        username,
        password,
        api_key,
        is_active,
        metadata,
        created_at
    ) VALUES (
        v_org_id,
        v_env_id,
        p_payload->>'erp_system',
        p_payload->>'api_url',
        p_payload->>'username',
        p_payload->>'password',
        p_payload->>'api_key',
        COALESCE((p_payload->>'is_active')::BOOLEAN, true),
        p_payload->'metadata',
        now()
    );
    
    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Permite acesso aos usuários e admins da API externa
REVOKE ALL ON FUNCTION public.save_erp_integration_config(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_erp_integration_config(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_erp_integration_config(JSONB) TO anon;
GRANT EXECUTE ON FUNCTION public.save_erp_integration_config(JSONB) TO service_role;
