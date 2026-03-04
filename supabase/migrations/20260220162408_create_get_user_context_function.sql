/*
  # Create User Context Function
  
  Creates the missing function `get_user_context_for_session` that returns
  organization and environment context for the current session user.
  
  This function is used by the RLS policies to determine which organization
  and environment the user belongs to.
*/

-- Drop function if exists
DROP FUNCTION IF EXISTS public.get_user_context_for_session(text);

-- Create the function to get user context
CREATE OR REPLACE FUNCTION public.get_user_context_for_session(p_email text)
RETURNS TABLE (
  organization_id uuid,
  environment_id uuid,
  user_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log the attempt for debugging
  RAISE NOTICE 'Getting context for email: %', p_email;
  
  -- Return the user's organization and environment
  RETURN QUERY
  SELECT 
    u.organization_id,
    u.environment_id,
    u.id as user_id
  FROM users u
  WHERE u.email = p_email
  LIMIT 1;
  
  -- If no result found, log it
  IF NOT FOUND THEN
    RAISE NOTICE 'No user found for email: %', p_email;
  END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_context_for_session(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_context_for_session(text) TO authenticated;

-- Create a simpler version that reads from session variables
CREATE OR REPLACE FUNCTION public.get_current_user_context()
RETURNS TABLE (
  organization_id uuid,
  environment_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_env_id uuid;
BEGIN
  -- Try to get from session settings
  BEGIN
    v_org_id := current_setting('app.current_organization_id', true)::uuid;
    v_env_id := current_setting('app.current_environment_id', true)::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_org_id := NULL;
    v_env_id := NULL;
  END;
  
  RETURN QUERY SELECT v_org_id, v_env_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_current_user_context() TO anon;
GRANT EXECUTE ON FUNCTION public.get_current_user_context() TO authenticated;