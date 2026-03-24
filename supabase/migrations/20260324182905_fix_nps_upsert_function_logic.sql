-- 4. RPC Fix for PgBouncer Session Variable Drops During REST Inserts (Definitive Fix)
CREATE OR REPLACE FUNCTION public.save_nps_settings(p_payload JSONB)
RETURNS JSONB AS $$
DECLARE
    v_env_id UUID;
    v_org_id UUID;
    v_result JSONB;
BEGIN
    -- Extract context from payload
    v_env_id := (p_payload->>'environment_id')::UUID;
    v_org_id := (p_payload->>'organization_id')::UUID;

    -- Basic security validation: Must belong to someone
    IF v_env_id IS NULL OR v_org_id IS NULL THEN
        RAISE EXCEPTION 'environment_id and organization_id are required';
    END IF;

    -- Upsert strategy based ONLY on environment_id (which is UNIQUE in the table)
    INSERT INTO public.nps_settings (
        environment_id,
        organization_id,
        automation_active,
        delay_hours,
        expiration_days
    ) VALUES (
        v_env_id,
        v_org_id,
        COALESCE((p_payload->>'automation_active')::BOOLEAN, false),
        COALESCE((p_payload->>'delay_hours')::INTEGER, 24),
        COALESCE((p_payload->>'expiration_days')::INTEGER, 7)
    )
    ON CONFLICT (environment_id) DO UPDATE SET
        automation_active = EXCLUDED.automation_active,
        delay_hours = EXCLUDED.delay_hours,
        expiration_days = EXCLUDED.expiration_days,
        updated_at = NOW()
    RETURNING to_jsonb(nps_settings.*) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure permissions
GRANT EXECUTE ON FUNCTION public.save_nps_settings(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_nps_settings(JSONB) TO anon;
