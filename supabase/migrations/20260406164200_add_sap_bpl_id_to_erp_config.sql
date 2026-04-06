-- Add sap_bpl_id to handle Branch ID isolation in SAP B1
ALTER TABLE public.erp_integration_config ADD COLUMN IF NOT EXISTS sap_bpl_id VARCHAR(50);

-- Update RPC to process this field
CREATE OR REPLACE FUNCTION public.save_erp_integration_config(p_payload JSONB)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_org_id UUID;
    v_env_id UUID;
    v_est_id UUID;
    v_count INT;
    v_new_record JSONB;
BEGIN
    -- Bypass RLS capturing standard vars
    v_user_id := auth.uid();
    
    -- Extract context from payload
    v_org_id := (p_payload->>'organization_id')::UUID;
    v_env_id := (p_payload->>'environment_id')::UUID;
    v_est_id := (p_payload->>'establishment_id')::UUID;
    
    IF v_org_id IS NULL OR v_env_id IS NULL THEN
        RAISE EXCEPTION 'organization_id and environment_id are required';
    END IF;

    -- Check if record exists
    SELECT COUNT(1) INTO v_count 
    FROM public.erp_integration_config 
    WHERE organization_id = v_org_id 
      AND environment_id = v_env_id
      AND (establishment_id = v_est_id OR (establishment_id IS NULL AND v_est_id IS NULL));
      
    IF v_count > 0 THEN
        -- Update
        UPDATE public.erp_integration_config 
        SET 
            erp_name = p_payload->>'erp_name',
            service_layer_address = p_payload->>'service_layer_address',
            port = p_payload->>'port',
            username = p_payload->>'username',
            password_hash = p_payload->>'password_hash',
            company_db = p_payload->>'company_db',
            sap_bpl_id = p_payload->>'sap_bpl_id',
            billing_control_account = p_payload->>'billing_control_account',
            financial_account_code = p_payload->>'financial_account_code',
            fiscal_account_code = p_payload->>'fiscal_account_code',
            cte_xml_network_address = p_payload->>'cte_xml_network_address',
            invoice_default_item = p_payload->>'invoice_default_item',
            status = p_payload->>'status',
            last_sync_time = (p_payload->>'last_sync_time')::TIMESTAMP WITH TIME ZONE,
            updated_at = NOW()
        WHERE organization_id = v_org_id 
          AND environment_id = v_env_id
          AND (establishment_id = v_est_id OR (establishment_id IS NULL AND v_est_id IS NULL));
    ELSE
        -- Insert
        INSERT INTO public.erp_integration_config (
            organization_id, environment_id, establishment_id,
            erp_name, service_layer_address, port, username, password_hash, company_db, sap_bpl_id,
            billing_control_account, financial_account_code, fiscal_account_code,
            cte_xml_network_address, invoice_default_item, status, last_sync_time, enable_auto_sync
        ) VALUES (
            v_org_id, v_env_id, v_est_id,
            p_payload->>'erp_name', p_payload->>'service_layer_address', p_payload->>'port',
            p_payload->>'username', p_payload->>'password_hash', p_payload->>'company_db',
            p_payload->>'sap_bpl_id',
            p_payload->>'billing_control_account', p_payload->>'financial_account_code', p_payload->>'fiscal_account_code',
            p_payload->>'cte_xml_network_address', p_payload->>'invoice_default_item', COALESCE(p_payload->>'status', 'active'),
            (p_payload->>'last_sync_time')::TIMESTAMP WITH TIME ZONE,
            COALESCE((p_payload->>'enable_auto_sync')::BOOLEAN, false)
        );
    END IF;

    -- Return the merged/updated record back
    SELECT to_jsonb(t) INTO v_new_record
    FROM public.erp_integration_config t 
    WHERE organization_id = v_org_id 
      AND environment_id = v_env_id
      AND (establishment_id = v_est_id OR (establishment_id IS NULL AND v_est_id IS NULL))
    LIMIT 1;
    
    RETURN v_new_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
