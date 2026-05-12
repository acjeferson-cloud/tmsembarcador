CREATE OR REPLACE FUNCTION public.get_erp_integration_config(
  p_organization_id UUID,
  p_environment_id UUID,
  p_establishment_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT to_jsonb(t) INTO v_result 
    FROM public.erp_integration_config t 
    WHERE organization_id = p_organization_id 
      AND environment_id = p_environment_id 
      AND (
          (p_establishment_id IS NULL AND establishment_id IS NULL)
          OR establishment_id = p_establishment_id
      )
      AND is_active = true
    ORDER BY created_at DESC
    LIMIT 1;
    
    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_erp_integration_config(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_erp_integration_config(UUID, UUID, UUID) TO anon;
