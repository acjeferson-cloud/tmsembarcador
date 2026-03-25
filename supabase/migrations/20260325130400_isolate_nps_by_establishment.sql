-- 0. Auth Wrapper for Establishment Isolation
CREATE OR REPLACE FUNCTION get_session_establishment_id()
RETURNS UUID AS $$
DECLARE
  v_id TEXT;
BEGIN
  v_id := current_setting('app.establishment_id', true);
  IF v_id IS NULL OR v_id = '' THEN
    v_id := current_setting('request.jwt.claim.establishment_id', true);
  END IF;

  IF v_id IS NOT NULL AND v_id != '' THEN
    RETURN v_id::UUID;
  END IF;

  RETURN NULL;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 1. Add Establishment Columns
ALTER TABLE public.nps_settings ADD COLUMN IF NOT EXISTS establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE;
ALTER TABLE public.nps_dispatches ADD COLUMN IF NOT EXISTS establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE;

-- 2. Clean up Old Settings and Change Unique Constraints
-- We delete existing settings to enforce the new precise isolation logic without breaking conflict schemas
DELETE FROM public.nps_settings;

ALTER TABLE public.nps_settings DROP CONSTRAINT IF EXISTS nps_settings_environment_id_key;
ALTER TABLE public.nps_settings ADD CONSTRAINT nps_settings_env_est_key UNIQUE (environment_id, establishment_id);

-- 3. Backfill existing NPS Dispatches with Establishment from Invoice
UPDATE public.nps_dispatches 
SET establishment_id = (
    SELECT establishment_id 
    FROM public.invoices_nfe 
    WHERE invoices_nfe.id = nps_dispatches.invoice_id
);

-- 4. Recreate RLS Policies for NPS Settings
DROP POLICY IF EXISTS "nps_settings_isolation_select" ON public.nps_settings;
DROP POLICY IF EXISTS "nps_settings_isolation_insert" ON public.nps_settings;
DROP POLICY IF EXISTS "nps_settings_isolation_update" ON public.nps_settings;
DROP POLICY IF EXISTS "nps_settings_isolation_delete" ON public.nps_settings;
DROP POLICY IF EXISTS "nps_settings_isolation_select_auth" ON public.nps_settings;
DROP POLICY IF EXISTS "nps_settings_isolation_insert_auth" ON public.nps_settings;
DROP POLICY IF EXISTS "nps_settings_isolation_update_auth" ON public.nps_settings;
DROP POLICY IF EXISTS "nps_settings_isolation_delete_auth" ON public.nps_settings;

CREATE POLICY "nps_settings_isolation_select" ON public.nps_settings FOR SELECT TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id() AND establishment_id = get_session_establishment_id());
CREATE POLICY "nps_settings_isolation_insert" ON public.nps_settings FOR INSERT TO anon
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id() AND establishment_id = get_session_establishment_id());
CREATE POLICY "nps_settings_isolation_update" ON public.nps_settings FOR UPDATE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id() AND establishment_id = get_session_establishment_id())
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id() AND establishment_id = get_session_establishment_id());
CREATE POLICY "nps_settings_isolation_delete" ON public.nps_settings FOR DELETE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id() AND establishment_id = get_session_establishment_id());

CREATE POLICY "nps_settings_isolation_select_auth" ON public.nps_settings FOR SELECT TO authenticated
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id() AND establishment_id = get_session_establishment_id());
CREATE POLICY "nps_settings_isolation_insert_auth" ON public.nps_settings FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id() AND establishment_id = get_session_establishment_id());
CREATE POLICY "nps_settings_isolation_update_auth" ON public.nps_settings FOR UPDATE TO authenticated
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id() AND establishment_id = get_session_establishment_id())
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id() AND establishment_id = get_session_establishment_id());
CREATE POLICY "nps_settings_isolation_delete_auth" ON public.nps_settings FOR DELETE TO authenticated
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id() AND establishment_id = get_session_establishment_id());

-- 5. Recreate RLS Policies for NPS Dispatches
DROP POLICY IF EXISTS "nps_dispatches_isolation_select" ON public.nps_dispatches;
DROP POLICY IF EXISTS "nps_dispatches_isolation_insert" ON public.nps_dispatches;
DROP POLICY IF EXISTS "nps_dispatches_isolation_update" ON public.nps_dispatches;
DROP POLICY IF EXISTS "nps_dispatches_isolation_delete" ON public.nps_dispatches;
DROP POLICY IF EXISTS "nps_dispatches_isolation_select_auth" ON public.nps_dispatches;
DROP POLICY IF EXISTS "nps_dispatches_isolation_insert_auth" ON public.nps_dispatches;
DROP POLICY IF EXISTS "nps_dispatches_isolation_update_auth" ON public.nps_dispatches;
DROP POLICY IF EXISTS "nps_dispatches_isolation_delete_auth" ON public.nps_dispatches;

CREATE POLICY "nps_dispatches_isolation_select" ON public.nps_dispatches FOR SELECT TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id() AND establishment_id = get_session_establishment_id());
CREATE POLICY "nps_dispatches_isolation_insert" ON public.nps_dispatches FOR INSERT TO anon
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id() AND establishment_id = get_session_establishment_id());
CREATE POLICY "nps_dispatches_isolation_update" ON public.nps_dispatches FOR UPDATE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id() AND establishment_id = get_session_establishment_id())
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id() AND establishment_id = get_session_establishment_id());
CREATE POLICY "nps_dispatches_isolation_delete" ON public.nps_dispatches FOR DELETE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id() AND establishment_id = get_session_establishment_id());

CREATE POLICY "nps_dispatches_isolation_select_auth" ON public.nps_dispatches FOR SELECT TO authenticated
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id() AND establishment_id = get_session_establishment_id());
CREATE POLICY "nps_dispatches_isolation_insert_auth" ON public.nps_dispatches FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id() AND establishment_id = get_session_establishment_id());
CREATE POLICY "nps_dispatches_isolation_update_auth" ON public.nps_dispatches FOR UPDATE TO authenticated
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id() AND establishment_id = get_session_establishment_id())
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id() AND establishment_id = get_session_establishment_id());
CREATE POLICY "nps_dispatches_isolation_delete_auth" ON public.nps_dispatches FOR DELETE TO authenticated
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id() AND establishment_id = get_session_establishment_id());

-- 6. RPC: Save NPS Settings with Establishment Logic
CREATE OR REPLACE FUNCTION public.save_nps_settings(p_payload JSONB)
RETURNS JSONB AS $$
DECLARE
    v_env_id UUID;
    v_org_id UUID;
    v_est_id UUID;
    v_result JSONB;
BEGIN
    -- Extract context from payload
    v_env_id := (p_payload->>'environment_id')::UUID;
    v_org_id := (p_payload->>'organization_id')::UUID;
    v_est_id := (p_payload->>'establishment_id')::UUID;

    -- Basic security validation
    IF v_env_id IS NULL OR v_org_id IS NULL OR v_est_id IS NULL THEN
        RAISE EXCEPTION 'environment_id, organization_id, and establishment_id are required';
    END IF;

    -- Upsert strategy based on environment_id + establishment_id composite key
    INSERT INTO public.nps_settings (
        environment_id,
        organization_id,
        establishment_id,
        automation_active,
        delay_hours,
        expiration_days
    ) VALUES (
        v_env_id,
        v_org_id,
        v_est_id,
        COALESCE((p_payload->>'automation_active')::BOOLEAN, false),
        COALESCE((p_payload->>'delay_hours')::INTEGER, 24),
        COALESCE((p_payload->>'expiration_days')::INTEGER, 7)
    )
    ON CONFLICT (environment_id, establishment_id) DO UPDATE SET
        automation_active = EXCLUDED.automation_active,
        delay_hours = EXCLUDED.delay_hours,
        expiration_days = EXCLUDED.expiration_days,
        updated_at = NOW()
    RETURNING to_jsonb(nps_settings.*) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RPC: Get NPS Settings with Establishment Logic
CREATE OR REPLACE FUNCTION public.get_nps_settings(p_environment_id UUID, p_establishment_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT to_jsonb(t) INTO v_result 
    FROM public.nps_settings t 
    WHERE environment_id = p_environment_id AND establishment_id = p_establishment_id;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_nps_settings(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_nps_settings(UUID, UUID) TO anon;

-- 8. Trigger: Automatically Queue NPS Dispatch with Establishment Isolation
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
BEGIN
    -- Check if status changed TO 'ENTREGUE'
    IF NEW.status = 'ENTREGUE' AND (OLD.status IS NULL OR OLD.status != 'ENTREGUE') THEN
        
        -- Get tenant context
        v_env_id := NEW.environment_id;
        v_org_id := NEW.organization_id;
        v_est_id := NEW.establishment_id;
        
        -- Default settings
        v_automation_active := false;
        v_delay_hours := 24;
        
        -- Check if settings exist for the specific establishment branch
        SELECT automation_active, delay_hours 
        INTO v_automation_active, v_delay_hours
        FROM public.nps_settings 
        WHERE environment_id = v_env_id AND establishment_id = v_est_id;

        -- Attempt to fetch customer email correctly with fallback
        BEGIN
            IF NEW.customer_id IS NOT NULL THEN
                -- Try 1: Specific Delivery Notification Mail (Avisos de Entrega)
                SELECT contato_avisos_entrega INTO v_customer_email 
                FROM public.business_partners_details 
                WHERE business_partner_id = NEW.customer_id AND contato_avisos_entrega IS NOT NULL LIMIT 1;

                -- Try 2: General email array
                IF v_customer_email IS NULL THEN
                    SELECT emails[1] INTO v_customer_email 
                    FROM public.business_partners_details 
                    WHERE business_partner_id = NEW.customer_id AND array_length(emails, 1) > 0 LIMIT 1;
                END IF;

                -- Try 3: Root table email
                IF v_customer_email IS NULL THEN
                    SELECT email INTO v_customer_email 
                    FROM public.business_partners 
                    WHERE id = NEW.customer_id LIMIT 1;
                END IF;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            v_customer_email := NULL;
        END;

        -- Fallback to XML embedded email if standard registry fails
        IF v_customer_email IS NULL AND NEW.nfe_id IS NOT NULL THEN
            SELECT dest_email INTO v_customer_email
            FROM public.nfe_data
            WHERE id = NEW.nfe_id;
        END IF;
        
        -- Insert ignoring conflicts
        INSERT INTO public.nps_dispatches (
            invoice_id, 
            environment_id, 
            organization_id, 
            establishment_id,
            status, 
            recipient_email, 
            scheduled_for,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            v_env_id,
            v_org_id,
            v_est_id,
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
