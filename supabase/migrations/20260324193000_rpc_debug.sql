CREATE OR REPLACE FUNCTION public.debug_nps_email(p_nfe_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_partner_id UUID;
    v_nfe_customer_email TEXT;
    v_env_id UUID;
BEGIN
    SELECT environment_id INTO v_env_id FROM public.invoices_nfe WHERE id = p_nfe_id;

    SELECT 
        jsonb_build_object(
            'partner_id', bp.id,
            'nfe_email', nc.email,
            'nfe_cnpj', nc.cnpj_cpf,
            'bp_cnpj', bp.cpf_cnpj,
            'env_id', v_env_id,
            'bp_env_id', bp.environment_id
        )
    INTO v_result
    FROM public.invoices_nfe_customers nc
    LEFT JOIN public.business_partners bp 
        ON REGEXP_REPLACE(bp.cpf_cnpj, '\D', '', 'g') = REGEXP_REPLACE(nc.cnpj_cpf, '\D', '', 'g')
    WHERE nc.nfe_id = p_nfe_id
    LIMIT 1;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
