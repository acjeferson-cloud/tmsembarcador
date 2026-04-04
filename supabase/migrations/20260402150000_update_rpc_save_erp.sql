-- Atualização da Função RPC para suportar TODAS as colunas do ERP (Novo e Antigo schema)
CREATE OR REPLACE FUNCTION public.save_erp_integration_config(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_org_id UUID;
    v_env_id UUID;
    v_est_id UUID;
BEGIN
    v_org_id := (p_payload->>'organization_id')::UUID;
    v_env_id := (p_payload->>'environment_id')::UUID;
    
    -- establishment_id pode ser null
    IF p_payload->>'establishment_id' IS NOT NULL THEN
        v_est_id := (p_payload->>'establishment_id')::UUID;
    END IF;
    
    -- Passo 1: Inativa qualquer configuração ativa do mesmo tenant
    UPDATE public.erp_integration_config 
    SET is_active = false 
    WHERE organization_id = v_org_id 
      AND environment_id = v_env_id 
      AND (v_est_id IS NULL OR establishment_id = v_est_id)
      AND is_active = true;
    
    -- Passo 2: Insere o novo record atômico!
    -- Mapeamos os campos novos (erp_name) para os antigos (erp_system) também para não violar constraints
    INSERT INTO public.erp_integration_config (
        organization_id,
        environment_id,
        establishment_id,
        erp_system,            -- OLD column (NOT NULL)
        erp_name,              -- NEW column
        api_url,               -- OLD column
        service_layer_address, -- NEW column
        port,
        username,
        password,
        api_key,               -- OLD column
        database,
        cte_integration_type,
        cte_model,
        invoice_model,
        billing_nfe_item,
        billing_usage,
        billing_control_account,
        outbound_nf_item,
        cte_without_nf_item,
        cte_usage,
        inbound_nf_control_account,
        invoice_transitory_account,
        nfe_xml_network_address,
        fiscal_module,
        is_active,
        created_at
    ) VALUES (
        v_org_id,
        v_env_id,
        v_est_id,
        p_payload->>'erp_name',                 -- Populating erp_system
        p_payload->>'erp_name',                 -- Populating erp_name
        p_payload->>'service_layer_address',    -- Populating api_url
        p_payload->>'service_layer_address',    -- Populating service_layer_address
        p_payload->>'port',
        p_payload->>'username',
        p_payload->>'password',
        COALESCE(p_payload->>'api_key', ''),    -- api_key can be empty string if not used
        p_payload->>'database',
        p_payload->>'cte_integration_type',
        p_payload->>'cte_model',
        p_payload->>'invoice_model',
        p_payload->>'billing_nfe_item',
        p_payload->>'billing_usage',
        p_payload->>'billing_control_account',
        p_payload->>'outbound_nf_item',
        p_payload->>'cte_without_nf_item',
        p_payload->>'cte_usage',
        p_payload->>'inbound_nf_control_account',
        p_payload->>'invoice_transitory_account',
        p_payload->>'nfe_xml_network_address',
        p_payload->>'fiscal_module',
        COALESCE((p_payload->>'is_active')::BOOLEAN, true),
        now()
    );
    
    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
