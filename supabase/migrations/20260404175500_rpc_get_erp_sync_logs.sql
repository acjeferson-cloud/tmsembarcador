CREATE OR REPLACE FUNCTION public.get_erp_sync_logs(
    p_organization_id uuid DEFAULT NULL,
    p_environment_id uuid DEFAULT NULL,
    p_establishment_id uuid DEFAULT NULL,
    p_limit integer DEFAULT 50
)
RETURNS SETOF public.erp_sync_logs
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.erp_sync_logs
    WHERE (p_organization_id IS NULL OR organization_id = p_organization_id)
      AND (p_environment_id IS NULL OR environment_id = p_environment_id)
      AND (p_establishment_id IS NULL OR establishment_id = p_establishment_id)
    ORDER BY created_at DESC
    LIMIT p_limit;
END;
$$;
