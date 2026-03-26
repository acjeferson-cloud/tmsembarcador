-- Fix the NPS Queue Trigger email lookup process (relying on business_partners_details and strictly matching organization_id/environment_id)
-- Restore exact tenant fields on insertion.

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
        
        -- Verificar regras específicas da unidade/estabelecimento com as variáveis garantidas
        SELECT automation_active, delay_hours 
        INTO v_automation_active, v_delay_hours
        FROM public.nps_settings 
        WHERE environment_id = v_env_id 
          AND organization_id = v_org_id 
          AND establishment_id = v_est_id;

        -- Tentativa de puxar email em cascata 
        BEGIN
            v_partner_id := NULL;
            IF v_dest_cnpj IS NOT NULL THEN
                -- Busca o Parceiro de Negócio estritamente na Org e Env corretos
                SELECT id INTO v_partner_id FROM public.business_partners 
                WHERE (REGEXP_REPLACE(cnpj, '[^0-9]', '', 'g') = REGEXP_REPLACE(v_dest_cnpj, '[^0-9]', '', 'g') 
                       OR REGEXP_REPLACE(cpf, '[^0-9]', '', 'g') = REGEXP_REPLACE(v_dest_cnpj, '[^0-9]', '', 'g'))
                AND environment_id = v_env_id 
                AND organization_id = v_org_id 
                LIMIT 1;
            END IF;

            IF v_partner_id IS NOT NULL THEN
                -- 1. Tentar E-mail Exclusivo de Aviso de Entrega dos Detalhes Operacionais do Parceiro
                SELECT contato_avisos_entrega INTO v_customer_email 
                FROM public.business_partners_details 
                WHERE business_partner_id = v_partner_id 
                AND contato_avisos_entrega IS NOT NULL AND contato_avisos_entrega != ''
                LIMIT 1;

                -- 2. Email Array Default do Parceiro (Primeiro item)
                IF v_customer_email IS NULL OR v_customer_email = '' THEN
                    SELECT emails[1] INTO v_customer_email 
                    FROM public.business_partners_details 
                    WHERE business_partner_id = v_partner_id 
                    AND array_length(emails, 1) > 0 
                    LIMIT 1;
                END IF;

                -- 3. Email Raiz do Cadastro Mestre do Parceiro
                IF v_customer_email IS NULL OR v_customer_email = '' THEN
                    SELECT email INTO v_customer_email FROM public.business_partners
                    WHERE id = v_partner_id AND email IS NOT NULL AND email != '' 
                    AND environment_id = v_env_id AND organization_id = v_org_id 
                    LIMIT 1;
                END IF;
            END IF;

            -- 4. Somente como Último Recurso, Tentar e-mail injetado via tabelas secundárias / XML
            IF (v_customer_email IS NULL OR v_customer_email = '') AND TG_TABLE_NAME = 'invoices_nfe' THEN
                SELECT email INTO v_customer_email FROM public.invoices_nfe_customers 
                WHERE invoice_nfe_id = NEW.id AND email IS NOT NULL AND email != '' 
                LIMIT 1;
                
                IF v_customer_email IS NULL OR v_customer_email = '' THEN
                   v_customer_email := NEW.metadata->'dest'->>'email';
                END IF;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            -- Se qualquer crash SQL ocorrer na pesquisa dos contacts, zera para não abortar
            v_customer_email := NULL;
        END;

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
        ) ON CONFLICT (invoice_id) DO NOTHING;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
