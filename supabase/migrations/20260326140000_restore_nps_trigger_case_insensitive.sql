/*
  # Restore Case Insensitive Check on NPS Dispatch Trigger

  1. Problema
    - A migration anterior retirou inadvertidamente a conversão UPPER() ao lidar com o status da NFe,
      fazendo com que notas marcadas como "Entregue" ou "entregue" fossem ignoradas.
  2. Solução
    - Adição de UPPER() no carregamento de `v_status` e `v_old_status`.
    - Adição de logs (RAISE NOTICE) solicitados para apoiar em futuras depurações.
*/

CREATE OR REPLACE FUNCTION public.queue_nps_dispatch()
RETURNS TRIGGER AS $$
DECLARE
    v_automation_active BOOLEAN;
    v_delay_hours INTEGER;
    v_expiration_days INTEGER;
    v_customer_email TEXT;
    v_env_id UUID;
    v_org_id UUID;
    v_est_id UUID;
    v_dest_cnpj TEXT;
    v_status TEXT;
    v_old_status TEXT;
    v_customer_id UUID;
BEGIN
    -- Determinar tabela dinamicamente e extrair status
    IF TG_TABLE_NAME = 'invoices_nfe' THEN
        v_status := UPPER(NEW.situacao);
        IF TG_OP = 'UPDATE' THEN
            v_old_status := UPPER(OLD.situacao);
        ELSE
            v_old_status := NULL;
        END IF;
        v_dest_cnpj := NEW.destinatario_cnpj;
        v_customer_id := NULL;
    ELSIF TG_TABLE_NAME = 'orders' THEN
        v_status := UPPER(NEW.status);
        IF TG_OP = 'UPDATE' THEN
            v_old_status := UPPER(OLD.status);
        ELSE
            v_old_status := NULL;
        END IF;
        v_customer_id := NEW.customer_id;
    ELSE
        RETURN NEW;
    END IF;

    -- Logs opcionais para identificar o disparo da Trigger
    RAISE NOTICE 'NPS Trigger check for % (ID: %). Status: % | Old: %', TG_TABLE_NAME, NEW.id, v_status, v_old_status;

    -- Verificar se o status mudou para 'ENTREGUE'
    IF v_status = 'ENTREGUE' AND (v_old_status IS NULL OR v_old_status != 'ENTREGUE') THEN
        
        RAISE NOTICE 'NPS Trigger: Marcando evento de entrega (ID: %)...', NEW.id;

        -- Coletar contexto de Tenant
        v_env_id := NEW.environment_id;
        v_org_id := NEW.organization_id;
        v_est_id := NEW.establishment_id;
        
        -- Configurações padrão
        v_automation_active := false;
        v_delay_hours := 24;
        
        -- Verificar regras específicas da unidade/estabelecimento
        SELECT automation_active, delay_hours 
        INTO v_automation_active, v_delay_hours
        FROM public.nps_settings 
        WHERE environment_id = v_env_id AND establishment_id = v_est_id;

        -- Tentativa robusta de puxar email em cascata 
        BEGIN
            IF v_customer_id IS NULL AND v_dest_cnpj IS NOT NULL THEN
                SELECT id INTO v_customer_id FROM public.business_partners 
                WHERE (cnpj = v_dest_cnpj OR cpf = v_dest_cnpj)
                AND environment_id = v_env_id LIMIT 1;
            END IF;

            IF v_customer_id IS NOT NULL THEN
                SELECT contato_avisos_entrega INTO v_customer_email 
                FROM public.business_partners_details 
                WHERE business_partner_id = v_customer_id AND contato_avisos_entrega IS NOT NULL LIMIT 1;

                IF v_customer_email IS NULL THEN
                    SELECT emails[1] INTO v_customer_email 
                    FROM public.business_partners_details 
                    WHERE business_partner_id = v_customer_id AND array_length(emails, 1) > 0 LIMIT 1;
                END IF;

                IF v_customer_email IS NULL THEN
                    SELECT email INTO v_customer_email 
                    FROM public.business_partners 
                    WHERE id = v_customer_id LIMIT 1;
                END IF;
            END IF;

            IF v_customer_email IS NULL AND TG_TABLE_NAME = 'invoices_nfe' THEN
                SELECT email INTO v_customer_email
                FROM public.invoices_nfe_customers
                WHERE invoice_nfe_id = NEW.id AND email IS NOT NULL AND TRIM(email) != '' LIMIT 1;
            END IF;
            
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'NPS Trigger: Exceção ao capturar email: %', SQLERRM;
                v_customer_email := NULL;
        END;

        RAISE NOTICE 'NPS Trigger resolvido com email: % e delay (horas) de %', v_customer_email, v_delay_hours;

        -- Enfileirar despacho
        INSERT INTO public.nps_dispatches (
            environment_id,
            organization_id,
            establishment_id,
            nfe_id,
            recipient_email,
            dispatch_status,
            scheduled_for,
            requires_automation,
            metadata
        ) VALUES (
            v_env_id,
            v_org_id,
            v_est_id,
            NEW.id,
            v_customer_email,
            CASE 
                WHEN v_customer_email IS NULL THEN 'failed'
                WHEN v_automation_active THEN 'pending'
                ELSE 'pending_manual'
            END,
            CURRENT_TIMESTAMP + (COALESCE(v_delay_hours, 24) || ' hours')::interval,
            v_automation_active,
            jsonb_build_object(
                'source', 'nfe_trigger',
                'auto_queued', v_automation_active,
                'resolved_email_by', CASE WHEN v_customer_id IS NOT NULL THEN 'business_partner' ELSE 'xml_destinatario' END,
                'error', CASE WHEN v_customer_email IS NULL THEN 'Missing recipient email' ELSE NULL END
            )
        ) ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
