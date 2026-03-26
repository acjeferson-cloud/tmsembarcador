-- CORTEX_STEP_TYPE_EDIT_FILE
-- Fix the NPS Trigger to use the correct `business_partner_contacts` schema
-- The query for step 1 and 2 previously queried `business_partners_details` which no longer exists.

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
    v_status TEXT;
    v_old_status TEXT;
BEGIN
    RAISE LOG '[NPS Queue] Trigger init for table %, op %', TG_TABLE_NAME, TG_OP;

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
            
            -- Se não veio no metadata (frequentemente o caso após a extração), busca da tabela relacional
            IF v_dest_cnpj IS NULL THEN
                 SELECT cnpj_cpf INTO v_dest_cnpj FROM public.invoices_nfe_customers WHERE invoice_nfe_id = NEW.id LIMIT 1;
            END IF;

            RAISE LOG '[NPS Queue - NFe] Invoice % status % -> %, Dest CNPJ/CPF: %', NEW.id, v_old_status, v_status, v_dest_cnpj;
        EXCEPTION WHEN OTHERS THEN
            v_dest_cnpj := NULL;
            RAISE LOG '[NPS Queue - NFe] Error extracting CNPJ for NFe %: %', NEW.id, SQLERRM;
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
        RAISE LOG '[NPS Queue - Order] Order % status % -> %', NEW.id, v_old_status, v_status;
    ELSE
        RETURN NEW;
    END IF;

    -- Verificar mudança de status para ENTREGUE case-insensitive
    IF v_status = 'ENTREGUE' AND (v_old_status IS NULL OR v_old_status != 'ENTREGUE') THEN
        RAISE LOG '[NPS Queue] Target status ENTREGUE reached for % %', TG_TABLE_NAME, NEW.id;
        
        v_automation_active := false;
        v_delay_hours := 24;
        
        -- Verificar regras específicas da unidade/estabelecimento com as variáveis garantidas
        SELECT automation_active, delay_hours 
        INTO v_automation_active, v_delay_hours
        FROM public.nps_settings 
        WHERE environment_id = v_env_id 
          AND organization_id = v_org_id 
          AND establishment_id = v_est_id;

        RAISE LOG '[NPS Queue] Context env: %, org: %, est: %. Automation: %, delay_hours: %', v_env_id, v_org_id, v_est_id, v_automation_active, v_delay_hours;

        -- Tentativa de puxar email em cascata 
        BEGIN
            v_partner_id := NULL;
            IF v_dest_cnpj IS NOT NULL THEN
                -- Busca o Parceiro de Negócio estritamente na Org e Env corretos (usando cpf_cnpj)
                SELECT id INTO v_partner_id FROM public.business_partners 
                WHERE REGEXP_REPLACE(cpf_cnpj, '[^0-9]', '', 'g') = REGEXP_REPLACE(v_dest_cnpj, '[^0-9]', '', 'g') 
                AND environment_id = v_env_id 
                AND organization_id = v_org_id 
                LIMIT 1;
                RAISE LOG '[NPS Queue] Searched partner with CNPJ %, Found ID: %', v_dest_cnpj, v_partner_id;
            END IF;

            IF v_partner_id IS NOT NULL THEN
                -- 1. Tentar Contato configurado especificamente para Aviso de Entrega
                SELECT email INTO v_customer_email 
                FROM public.business_partner_contacts 
                WHERE partner_id = v_partner_id 
                AND email_notify_delivered = true
                AND email IS NOT NULL AND email != ''
                LIMIT 1;
                RAISE LOG '[NPS Queue] Step 1 (Avisos de Entrega): %', v_customer_email;

                -- 2. Tentar email do Contato Primário
                IF v_customer_email IS NULL OR v_customer_email = '' THEN
                    SELECT email INTO v_customer_email 
                    FROM public.business_partner_contacts 
                    WHERE partner_id = v_partner_id 
                    AND is_primary = true
                    AND email IS NOT NULL AND email != ''
                    LIMIT 1;
                    RAISE LOG '[NPS Queue] Step 2 (Contato Primario): %', v_customer_email;
                END IF;

                -- 3. Email Raiz do Cadastro Mestre do Parceiro
                IF v_customer_email IS NULL OR v_customer_email = '' THEN
                    SELECT email INTO v_customer_email FROM public.business_partners
                    WHERE id = v_partner_id AND email IS NOT NULL AND email != '' 
                    AND environment_id = v_env_id AND organization_id = v_org_id 
                    LIMIT 1;
                    RAISE LOG '[NPS Queue] Step 3 (Master Partner Email): %', v_customer_email;
                END IF;
            END IF;

            -- 4. Somente como Último Recurso, Tentar e-mail injetado via tabelas secundárias / XML
            IF (v_customer_email IS NULL OR v_customer_email = '') AND TG_TABLE_NAME = 'invoices_nfe' THEN
                SELECT email INTO v_customer_email FROM public.invoices_nfe_customers 
                WHERE invoice_nfe_id = NEW.id AND email IS NOT NULL AND email != '' 
                LIMIT 1;
                RAISE LOG '[NPS Queue] Step 4a (NFe Customers table): %', v_customer_email;
                
                IF v_customer_email IS NULL OR v_customer_email = '' THEN
                   v_customer_email := NEW.metadata->'dest'->>'email';
                   RAISE LOG '[NPS Queue] Step 4b (XML Dest Email): %', v_customer_email;
                END IF;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            -- Se qualquer crash SQL ocorrer na pesquisa dos contacts, ignora e tenta usar o que já achou
            RAISE LOG '[NPS Queue] !CRASH! Exception during email resolution: %', SQLERRM;
            IF v_customer_email IS NULL OR v_customer_email = '' THEN
                v_customer_email := NULL;
            END IF;
        END;

        RAISE LOG '[NPS Queue] Final resolved email: %', v_customer_email;

        -- Enfileirar despacho na fila do NPS garantindo Organization, Environment e Establishment idênticos a Nota!
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
                WHEN v_customer_email IS NULL OR v_customer_email = '' THEN 'erro'
                ELSE 'pendente'
            END,
            CURRENT_TIMESTAMP + (COALESCE(v_delay_hours, 24) || ' hours')::interval,
            CASE WHEN v_customer_email IS NULL OR v_customer_email = '' THEN 'Nenhum contato com permissão prévia ou email associado ao parceiro ou XML foi encontrado.' ELSE NULL END
        ) ON CONFLICT (invoice_id) 
        DO UPDATE SET 
            recipient_email = EXCLUDED.recipient_email,
            status = EXCLUDED.status,
            error_reason = EXCLUDED.error_reason
        WHERE nps_dispatches.status = 'pendente' OR nps_dispatches.status = 'erro';
        
        RAISE LOG '[NPS Queue] Inserted/Updated nps_dispatches for invoice % with email %', NEW.id, v_customer_email;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
