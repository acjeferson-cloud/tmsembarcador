-- 1. Fix get_session_organization_id
CREATE OR REPLACE FUNCTION get_session_organization_id()
RETURNS UUID AS $$
DECLARE
  v_id TEXT;
BEGIN
  -- Primeiramente tenta pegar da variável de sessão (set_session_context)
  v_id := current_setting('app.organization_id', true);
  
  -- Se estiver vazio/nulo (devido ao connection pooling dropando variáveis), tenta pegar do JWT claim
  IF v_id IS NULL OR v_id = '' THEN
    v_id := current_setting('request.jwt.claim.organization_id', true);
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

-- 2. Fix get_session_environment_id
CREATE OR REPLACE FUNCTION get_session_environment_id()
RETURNS UUID AS $$
DECLARE
  v_id TEXT;
BEGIN
  -- Primeiramente tenta pegar da variável de sessão (set_session_context)
  v_id := current_setting('app.environment_id', true);
  
  -- Se estiver vazio/nulo, tenta pegar do JWT claim
  IF v_id IS NULL OR v_id = '' THEN
    v_id := current_setting('request.jwt.claim.environment_id', true);
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
