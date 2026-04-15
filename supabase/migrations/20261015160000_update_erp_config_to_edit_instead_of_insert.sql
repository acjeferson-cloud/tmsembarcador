-- Atualiza a RPC save_erp_integration_config para EDITAR o registro existente em vez de inserir um novo
CREATE OR REPLACE FUNCTION public.save_erp_integration_config(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_org_id UUID;
    v_env_id UUID;
    v_est_id UUID;
    v_existing_id UUID;
BEGIN
    v_org_id := (p_payload->>'organization_id')::UUID;
    v_env_id := (p_payload->>'environment_id')::UUID;
    
    -- establishment_id pode ser null
    IF p_payload->>'establishment_id' IS NOT NULL THEN
        v_est_id := (p_payload->>'establishment_id')::UUID;
    END IF;
    
    -- Tenta encontrar o registro ATIVO existente para este tenant específico
    -- Usamos IS NOT DISTINCT FROM para tratar v_est_id NULL corretamente
    SELECT id INTO v_existing_id 
    FROM public.erp_integration_config 
    WHERE organization_id = v_org_id 
      AND environment_id = v_env_id 
      AND establishment_id IS NOT DISTINCT FROM v_est_id
      AND is_active = true
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
        -- Realiza o UPDATE no registro existente
        UPDATE public.erp_integration_config SET
            erp_system = p_payload->>'erp_name',
            erp_name = p_payload->>'erp_name',
            api_url = p_payload->>'service_layer_address',
            service_layer_address = p_payload->>'service_layer_address',
            port = p_payload->>'port',
            username = p_payload->>'username',
            password = p_payload->>'password',
            api_key = COALESCE(p_payload->>'api_key', ''),
            database = p_payload->>'database',
            sap_bpl_id = p_payload->>'sap_bpl_id',
            cte_integration_type = p_payload->>'cte_integration_type',
            cte_model = p_payload->>'cte_model',
            invoice_model = p_payload->>'invoice_model',
            invoice_default_item = p_payload->>'invoice_default_item',
            billing_nfe_item = p_payload->>'billing_nfe_item',
            billing_usage = p_payload->>'billing_usage',
            billing_control_account = p_payload->>'billing_control_account',
            outbound_nf_item = p_payload->>'outbound_nf_item',
            cte_without_nf_item = p_payload->>'cte_without_nf_item',
            cte_usage = p_payload->>'cte_usage',
            inbound_nf_control_account = p_payload->>'inbound_nf_control_account',
            invoice_transitory_account = p_payload->>'invoice_transitory_account',
            nfe_xml_network_address = p_payload->>'nfe_xml_network_address',
            cte_xml_network_address = p_payload->>'cte_xml_network_address',
            fiscal_module = p_payload->>'fiscal_module',
            auto_sync_enabled = COALESCE((p_payload->>'auto_sync_enabled')::BOOLEAN, false),
            sync_interval_minutes = COALESCE((p_payload->>'sync_interval_minutes')::INTEGER, 5),
            updated_at = now()
        WHERE id = v_existing_id;
    ELSE
        -- Insere um novo registro se não existir
        INSERT INTO public.erp_integration_config (
            organization_id,
            environment_id,
            establishment_id,
            erp_system,            
            erp_name,              
            api_url,               
            service_layer_address, 
            port,
            username,
            password,
            api_key,               
            database,
            sap_bpl_id,
            cte_integration_type,
            cte_model,
            invoice_model,
            invoice_default_item,
            billing_nfe_item,
            billing_usage,
            billing_control_account,
            outbound_nf_item,
            cte_without_nf_item,
            cte_usage,
            inbound_nf_control_account,
            invoice_transitory_account,
            nfe_xml_network_address,
            cte_xml_network_address,
            fiscal_module,
            is_active,
            auto_sync_enabled,
            sync_interval_minutes,
            created_at,
            updated_at
        ) VALUES (
            v_org_id,
            v_env_id,
            v_est_id,
            p_payload->>'erp_name',                 
            p_payload->>'erp_name',                 
            p_payload->>'service_layer_address',    
            p_payload->>'service_layer_address',    
            p_payload->>'port',
            p_payload->>'username',
            p_payload->>'password',
            COALESCE(p_payload->>'api_key', ''),    
            p_payload->>'database',
            p_payload->>'sap_bpl_id',
            p_payload->>'cte_integration_type',
            p_payload->>'cte_model',
            p_payload->>'invoice_model',
            p_payload->>'invoice_default_item',
            p_payload->>'billing_nfe_item',
            p_payload->>'billing_usage',
            p_payload->>'billing_control_account',
            p_payload->>'outbound_nf_item',
            p_payload->>'cte_without_nf_item',
            p_payload->>'cte_usage',
            p_payload->>'inbound_nf_control_account',
            p_payload->>'invoice_transitory_account',
            p_payload->>'nfe_xml_network_address',
            p_payload->>'cte_xml_network_address',
            p_payload->>'fiscal_module',
            COALESCE((p_payload->>'is_active')::BOOLEAN, true),
            COALESCE((p_payload->>'auto_sync_enabled')::BOOLEAN, false),
            COALESCE((p_payload->>'sync_interval_minutes')::INTEGER, 5),
            now(),
            now()
        );
    END IF;
    
    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
