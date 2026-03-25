-- Create RPC to fetch NPS Settings bypassing standard REST RLS drops
CREATE OR REPLACE FUNCTION public.get_nps_settings(p_environment_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT to_jsonb(t) INTO v_result 
    FROM public.nps_settings t 
    WHERE environment_id = p_environment_id;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_nps_settings(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_nps_settings(UUID) TO anon;
