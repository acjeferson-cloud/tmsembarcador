-- Fix the NPS Queue Trigger column names that were causing silent PostgreSQL transaction rollbacks
-- (nfe_id -> invoice_id) and (dispatch_status -> status)

CREATE OR REPLACE FUNCTION public.queue_nps_dispatch()
RETURNS trigger AS $$
DECLARE
    v_automation_active BOOLEAN;
    v_delay_hours INTEGER;
    v_customer_email TEXT;
    v_env_id UUID;
    v_org_id UUID;
    v_est_id UUID;
    v_partner_id UUID;
    v_dest_cnpj TEXT;
    v_nfe_customer_email TEXT;
    v_status TEXT;
    v_old_status TEXT;
BEGIN
    -- Determinar tabela dinamicamente e extrair status
    IF TG_TABLE_NAME = 'invoices_nfe' THEN
        v_status := UPPER(NEW.situacao);
        IF TG_OP = 'UPDATE' THEN
            v_old_status := UPPER(OLD.situacao);
        ELSE
            v_old_status := NULL;
        END IF;
        
        v_env_id := NEW.environment_id;
        v_org_id := NEW.organization_id;
        v_est_id := NEW.establishment_id;
        v_dest_cnpj := NULL;
        
        -- Extrair CNPJ do Destinatario via metadata (caso possua)
        BEGIN
            v_dest_cnpj := NEW.metadata->'dest'->>'CNPJ';
            IF v_dest_cnpj IS NULL THEN
                 v_dest_cnpj := NEW.metadata->'dest'->>'CPF';
            END IF;
        EXCEPTION WHEN OTHERS THEN
            v_dest_cnpj := NULL;
        END;

    ELSIF TG_TABLE_NAME = 'orders' THEN
        v_status := UPPER(NEW.status);
        IF TG_OP = 'UPDATE' THEN
            v_old_status := UPPER(OLD.status);
        ELSE
            v_old_status := NULL;
        END IF;
        
        v_env_id := NEW.environment_id;
        v_org_id := NEW.organization_id;
        v_est_id := NEW.establishment_id;
        v_dest_cnpj := NULL;

    ELSE
        RETURN NEW;
    END IF;

    -- Verificar mudança de status para ENTREGUE case-insensitive
    IF v_status = 'ENTREGUE' AND (v_old_status IS NULL OR v_old_status != 'ENTREGUE') THEN
        
        v_automation_active := false;
        v_delay_hours := 24;
        
        -- Verificar regras específicas da unidade/estabelecimento
        SELECT automation_active, delay_hours 
        INTO v_automation_active, v_delay_hours
        FROM public.nps_settings 
        WHERE environment_id = v_env_id AND establishment_id = v_est_id;

        -- Tentativa robusta de puxar email em cascata 
        BEGIN
            v_partner_id := NULL;
            IF v_dest_cnpj IS NOT NULL THEN
                SELECT id INTO v_partner_id FROM public.business_partners 
                WHERE (REGEXP_REPLACE(cnpj, '[^0-9]', '', 'g') = REGEXP_REPLACE(v_dest_cnpj, '[^0-9]', '', 'g') 
                       OR REGEXP_REPLACE(cpf, '[^0-9]', '', 'g') = REGEXP_REPLACE(v_dest_cnpj, '[^0-9]', '', 'g'))
                AND environment_id = v_env_id LIMIT 1;
            END IF;

            IF v_partner_id IS NOT NULL THEN
                -- 1. Contato de Notificação NPS
                SELECT email INTO v_customer_email FROM public.business_partner_contacts
                WHERE partner_id = v_partner_id AND receive_email_notifications = true AND email_notify_delivered = true AND email IS NOT NULL AND email != ''
                ORDER BY updated_at DESC LIMIT 1;

                -- 2. Contato Primario
                IF v_customer_email IS NULL OR v_customer_email = '' THEN
                    SELECT email INTO v_customer_email FROM public.business_partner_contacts
                    WHERE partner_id = v_partner_id AND is_primary = true AND email IS NOT NULL AND email != ''
                    ORDER BY updated_at DESC LIMIT 1;
                END IF;

                -- 3. Email do Partner
                IF v_customer_email IS NULL OR v_customer_email = '' THEN
                    SELECT email INTO v_customer_email FROM public.business_partners
                    WHERE id = v_partner_id AND email IS NOT NULL AND email != '' LIMIT 1;
                END IF;
            END IF;

            -- 4. Email XML
            IF (v_customer_email IS NULL OR v_customer_email = '') AND TG_TABLE_NAME = 'invoices_nfe' THEN
                SELECT email INTO v_customer_email FROM public.invoices_nfe_customers WHERE invoice_nfe_id = NEW.id AND email IS NOT NULL AND email != '' LIMIT 1;
                IF v_customer_email IS NULL OR v_customer_email = '' THEN
                   v_customer_email := NEW.metadata->'dest'->>'email';
                END IF;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            v_customer_email := NULL;
        END;

        -- Enfileirar despacho na fila do NPS com nomes corretos: invoice_id e status
        INSERT INTO public.nps_dispatches (
            environment_id,
            organization_id,
            establishment_id,
            invoice_id,
            recipient_email,
            status,
            scheduled_for,
            error_reason
        ) VALUES (
            v_env_id,
            v_org_id,
            v_est_id,
            NEW.id,
            v_customer_email,
            CASE 
                WHEN v_customer_email IS NULL THEN 'erro'
                ELSE 'pendente'
            END,
            CURRENT_TIMESTAMP + (COALESCE(v_delay_hours, 24) || ' hours')::interval,
            CASE WHEN v_customer_email IS NULL THEN 'Nenhum email válido encontrado para o cliente/destinatário.' ELSE NULL END
        ) ON CONFLICT (invoice_id) DO NOTHING;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
