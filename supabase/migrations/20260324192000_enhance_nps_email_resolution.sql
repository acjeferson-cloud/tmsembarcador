-- Enhance the NPS Queue Trigger to use an intelligent hierarchical email extraction strategy
-- Follows a 4-step fallback plan: NPS Contact -> Primary Contact -> Business Partner -> NFE XML Email

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
BEGIN
    -- Check if situacao changed TO 'ENTREGUE' (case-insensitive)
    IF UPPER(NEW.situacao) = 'ENTREGUE' AND (OLD.situacao IS NULL OR UPPER(OLD.situacao) != 'ENTREGUE') THEN
        
        -- Get tenant context
        v_env_id := NEW.environment_id;
        v_org_id := NEW.organization_id;
        
        -- Default settings
        v_automation_active := false;
        v_delay_hours := 24;
        
        -- Check if settings exist for the environment to avoid errors
        SELECT automation_active, delay_hours 
        INTO v_automation_active, v_delay_hours
        FROM public.nps_settings 
        WHERE environment_id = v_env_id;

        -- Attempt to fetch the best recipient email for NPS using logic hierarchy
        BEGIN
            v_customer_email := NULL;
            v_partner_id := NULL;
            v_nfe_customer_email := NULL;
            
            -- Step 0: Find the customer ID linked to this NFe and extract the XML raw email
            -- Since invoices_nfe_customers links nfe to business_partners via cnpj_cpf
            SELECT 
                bp.id,
                nc.email
            INTO
                v_partner_id,
                v_nfe_customer_email
            FROM public.invoices_nfe_customers nc
            LEFT JOIN public.business_partners bp 
                ON REGEXP_REPLACE(bp.cpf_cnpj, '\D', '', 'g') = REGEXP_REPLACE(nc.cnpj_cpf, '\D', '', 'g')
                AND bp.environment_id = v_env_id
            WHERE nc.nfe_id = NEW.id
            LIMIT 1;

            IF v_partner_id IS NOT NULL THEN
                -- Step 1: Specific Delivery Notification Contact
                SELECT email INTO v_customer_email
                FROM public.business_partner_contacts
                WHERE partner_id = v_partner_id
                  AND receive_email_notifications = true
                  AND email_notify_delivered = true
                  AND email IS NOT NULL AND email != ''
                ORDER BY updated_at DESC
                LIMIT 1;

                -- Step 2: Primary Contact
                IF v_customer_email IS NULL OR v_customer_email = '' THEN
                    SELECT email INTO v_customer_email
                    FROM public.business_partner_contacts
                    WHERE partner_id = v_partner_id
                      AND is_primary = true
                      AND email IS NOT NULL AND email != ''
                    ORDER BY updated_at DESC
                    LIMIT 1;
                END IF;

                -- Step 3: Business Partner General Email
                IF v_customer_email IS NULL OR v_customer_email = '' THEN
                    SELECT email INTO v_customer_email
                    FROM public.business_partners
                    WHERE id = v_partner_id
                      AND email IS NOT NULL AND email != ''
                    LIMIT 1;
                END IF;
            END IF;

            -- Step 4: XML Dest Email (Fallback)
            IF v_customer_email IS NULL OR v_customer_email = '' THEN
                v_customer_email := v_nfe_customer_email;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            -- Safe fallback in case of any SQL execution errors during string parsing
            v_customer_email := NULL;
        END;
        
        -- Insert ignoring conflicts
        INSERT INTO public.nps_dispatches (
            invoice_id, 
            environment_id, 
            organization_id, 
            status, 
            recipient_email, 
            scheduled_for,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            v_env_id,
            v_org_id,
            'pendente',
            v_customer_email,
            NOW() + (COALESCE(v_delay_hours, 24) || ' hours')::interval,
            NOW(),
            NOW()
        ) ON CONFLICT (invoice_id) DO UPDATE SET
            recipient_email = EXCLUDED.recipient_email
        WHERE nps_dispatches.status = 'pendente'; 
        -- Also update email if it was previously "Sem-Email" and is still waiting to be sent
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
