-- Fix the NPS Queue Trigger column name reference from nfe_id to invoice_nfe_id
-- The invoices_nfe_customers table uses invoice_nfe_id to reference invoices_nfe.

CREATE OR REPLACE FUNCTION public.queue_nps_dispatch()
RETURNS trigger AS $$
DECLARE
    v_automation_active BOOLEAN;
    v_delay_hours INTEGER;
    v_customer_email TEXT;
    v_env_id UUID;
    v_org_id UUID;
    v_partner_id UUID;
    v_nfe_customer_email TEXT;
    v_debug_log TEXT;
BEGIN
    IF UPPER(NEW.situacao) = 'ENTREGUE' AND (OLD.situacao IS NULL OR UPPER(OLD.situacao) != 'ENTREGUE') THEN
        
        v_env_id := NEW.environment_id;
        v_org_id := NEW.organization_id;
        v_debug_log := 'Iniciando busca. EnvID: ' || COALESCE(v_env_id::text, 'null') || '. ';
        
        -- Default settings
        v_automation_active := false;
        v_delay_hours := 24;
        
        SELECT automation_active, delay_hours INTO v_automation_active, v_delay_hours
        FROM public.nps_settings WHERE environment_id = v_env_id;

        BEGIN
            v_customer_email := NULL;
            v_partner_id := NULL;
            v_nfe_customer_email := NULL;
            
            -- Step 0: Find Partner ID using standard Regex [^0-9] instead of \D
            SELECT bp.id, nc.email INTO v_partner_id, v_nfe_customer_email
            FROM public.invoices_nfe_customers nc
            LEFT JOIN public.business_partners bp 
                ON REGEXP_REPLACE(bp.cpf_cnpj, '[^0-9]', '', 'g') = REGEXP_REPLACE(nc.cnpj_cpf, '[^0-9]', '', 'g')
                AND bp.environment_id = v_env_id
            WHERE nc.invoice_nfe_id = NEW.id
            LIMIT 1;

            v_debug_log := v_debug_log || 'XML Email: ' || COALESCE(v_nfe_customer_email, 'null') || '. ';
            v_debug_log := v_debug_log || 'BP ID: ' || COALESCE(v_partner_id::text, 'null') || '. ';

            IF v_partner_id IS NOT NULL THEN
                -- Step 1
                SELECT email INTO v_customer_email FROM public.business_partner_contacts
                WHERE partner_id = v_partner_id AND receive_email_notifications = true AND email_notify_delivered = true AND email IS NOT NULL AND email != ''
                ORDER BY updated_at DESC LIMIT 1;

                IF v_customer_email IS NOT NULL THEN
                    v_debug_log := v_debug_log || 'Achou Contato Notificacao. ';
                END IF;

                -- Step 2
                IF v_customer_email IS NULL OR v_customer_email = '' THEN
                    SELECT email INTO v_customer_email FROM public.business_partner_contacts
                    WHERE partner_id = v_partner_id AND is_primary = true AND email IS NOT NULL AND email != ''
                    ORDER BY updated_at DESC LIMIT 1;
                    
                    IF v_customer_email IS NOT NULL THEN v_debug_log := v_debug_log || 'Achou Contato Principal. '; END IF;
                END IF;

                -- Step 3
                IF v_customer_email IS NULL OR v_customer_email = '' THEN
                    SELECT email INTO v_customer_email FROM public.business_partners
                    WHERE id = v_partner_id AND email IS NOT NULL AND email != '' LIMIT 1;
                    
                    IF v_customer_email IS NOT NULL THEN v_debug_log := v_debug_log || 'Achou Email Parceiro. '; END IF;
                END IF;
            END IF;

            -- Step 4
            IF v_customer_email IS NULL OR v_customer_email = '' THEN
                v_customer_email := v_nfe_customer_email;
                IF v_customer_email IS NOT NULL THEN v_debug_log := v_debug_log || 'Usou Email XML. '; END IF;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            v_debug_log := v_debug_log || 'ERRO SQL: ' || SQLERRM || '. ';
            v_customer_email := NULL;
        END;
        
        IF v_customer_email IS NULL OR v_customer_email = '' THEN
             v_debug_log := v_debug_log || 'FALHA TOTAL. Sem-Email Encontrado.';
        ELSE
             v_debug_log := NULL; -- Limpa o log se encontrou com sucesso, para não poluir
        END IF;

        INSERT INTO public.nps_dispatches (
            invoice_id, environment_id, organization_id, status, recipient_email, scheduled_for, created_at, updated_at, error_reason
        ) VALUES (
            NEW.id, v_env_id, v_org_id, 'pendente', v_customer_email, NOW() + (COALESCE(v_delay_hours, 24) || ' hours')::interval, NOW(), NOW(), v_debug_log
        ) ON CONFLICT (invoice_id) DO UPDATE SET
            recipient_email = EXCLUDED.recipient_email,
            error_reason = EXCLUDED.error_reason,
            updated_at = NOW()
        WHERE nps_dispatches.status = 'pendente' OR nps_dispatches.status = 'erro'; 
        
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
