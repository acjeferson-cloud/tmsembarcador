-- Fix the NPS Queue Trigger to handle case-insensitivity
-- This resolves the issue where "entregue" (lowercase) bypassed the trigger because it expected "ENTREGUE" (uppercase).

CREATE OR REPLACE FUNCTION public.queue_nps_dispatch()
RETURNS trigger AS $$
DECLARE
    v_automation_active BOOLEAN;
    v_delay_hours INTEGER;
    v_expiration_days INTEGER;
    v_customer_email TEXT;
    v_env_id UUID;
    v_org_id UUID;
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
        -- We just queue them up as 'pendente', let the background job honor 'automation_active'
        SELECT automation_active, delay_hours 
        INTO v_automation_active, v_delay_hours
        FROM public.nps_settings 
        WHERE environment_id = v_env_id;

        -- Attempt to fetch customer email directly from customer_id lookup
        BEGIN
            IF NEW.customer_id IS NOT NULL THEN
                SELECT email INTO v_customer_email 
                FROM public.business_partners 
                WHERE id = NEW.customer_id;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            v_customer_email := NULL;
        END;
        
        -- Ignore completely if no email is found (Optional by business rule: "Apenas se tiver email valido")
        -- We will still queue it as pendente so the UI shows it, and user can manually set email and send.
        
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
        ) ON CONFLICT (invoice_id) DO NOTHING;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
