/*
  # Correção no Trigger de Disparo de NPS para NFe

  1. Problema
    - A trigger `trg_queue_nps_dispatch` vinculada à `invoices_nfe` acionava a function `queue_nps_dispatch()`.
    - Esta function tentava acessar `NEW.status` e `NEW.customer_id`, mas a tabela `invoices_nfe` possui `situacao` e `destinatario_cnpj`.
    - Isso causava um erro "record new has no field status" ao editar notas fiscais (NF-e).

  2. Solução
    - Adicionado suporte condicional para o `TG_TABLE_NAME`.
    - Se for `invoices_nfe`, resolve a situação usando `NEW.situacao` e o array de contatos usando `destinatario_cnpj` ou e-mail de fallback.
    - Se for `orders`, mantém a resolução atual via `NEW.status`.
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
        v_status := NEW.situacao;
        v_old_status := OLD.situacao;
        v_dest_cnpj := NEW.destinatario_cnpj;
        v_customer_id := NULL;
    ELSIF TG_TABLE_NAME = 'orders' THEN
        v_status := NEW.status;
        v_old_status := OLD.status;
        v_customer_id := NEW.customer_id;
    ELSE
        -- Em caso de trigger mal configurada em outra tabela, não bloquear o fluxo
        RETURN NEW;
    END IF;

    -- Verificar se o status mudou para 'ENTREGUE'
    IF v_status = 'ENTREGUE' AND (v_old_status IS NULL OR v_old_status != 'ENTREGUE') THEN
        
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
            -- Se for NFe, não sabemos o ID do cliente diretamente. Vamos buscar pelo CNPJ!
            IF v_customer_id IS NULL AND v_dest_cnpj IS NOT NULL THEN
                SELECT id INTO v_customer_id FROM public.business_partners 
                WHERE (cnpj = v_dest_cnpj OR cpf = v_dest_cnpj)
                AND environment_id = v_env_id LIMIT 1;
            END IF;

            -- Busca as preferências de notificação do parceiro de negócio
            IF v_customer_id IS NOT NULL THEN
                -- Tentativa 1: Email específico para avisos de entrega
                SELECT contato_avisos_entrega INTO v_customer_email 
                FROM public.business_partners_details 
                WHERE business_partner_id = v_customer_id AND contato_avisos_entrega IS NOT NULL LIMIT 1;

                -- Tentativa 2: Array genérico de emails
                IF v_customer_email IS NULL THEN
                    SELECT emails[1] INTO v_customer_email 
                    FROM public.business_partners_details 
                    WHERE business_partner_id = v_customer_id AND array_length(emails, 1) > 0 LIMIT 1;
                END IF;

                -- Tentativa 3: E-mail raiz do parceiro
                IF v_customer_email IS NULL THEN
                    SELECT email INTO v_customer_email 
                    FROM public.business_partners 
                    WHERE id = v_customer_id LIMIT 1;
                END IF;
            END IF;

            -- Tentativa 4: E-mail fornecido no momento do XML para o Destinatário da NFe
            IF v_customer_email IS NULL AND TG_TABLE_NAME = 'invoices_nfe' THEN
                SELECT email INTO v_customer_email
                FROM public.invoices_nfe_customers
                WHERE invoice_nfe_id = NEW.id AND email IS NOT NULL AND TRIM(email) != '' LIMIT 1;
            END IF;
            
        EXCEPTION
            WHEN OTHERS THEN
                v_customer_email := NULL;
        END;

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
            CURRENT_TIMESTAMP + (v_delay_hours || ' hours')::interval,
            v_automation_active,
            jsonb_build_object(
                'source', 'nfe_trigger',
                'auto_queued', v_automation_active,
                'resolved_email_by', CASE WHEN v_customer_id IS NOT NULL THEN 'business_partner' ELSE 'xml_destinatario' END,
                'error', CASE WHEN v_customer_email IS NULL THEN 'Missing recipient email' ELSE NULL END
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
