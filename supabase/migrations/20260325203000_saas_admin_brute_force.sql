-- saas_login_attempts table to track every authentication trial
CREATE TABLE IF NOT EXISTS saas_login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT,
    ip_address TEXT NOT NULL,
    success BOOLEAN NOT NULL,
    attempt_type TEXT NOT NULL, -- 'password' or 'mfa'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- saas_login_blocks to track active blocks (15 mins)
CREATE TABLE IF NOT EXISTS saas_login_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT,
    ip_address TEXT,
    blocked_until TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for lightning fast lookups during login
CREATE INDEX IF NOT EXISTS idx_saas_login_attempts_created ON saas_login_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_saas_login_attempts_email_ip ON saas_login_attempts(email, ip_address);
CREATE INDEX IF NOT EXISTS idx_saas_login_blocks_active ON saas_login_blocks(blocked_until);

-- Function to extract real IP safely from PostgREST headers
CREATE OR REPLACE FUNCTION get_real_ip() RETURNS TEXT AS $$
DECLARE
  v_headers JSON;
  v_ip TEXT;
BEGIN
  BEGIN
    v_headers := current_setting('request.headers', true)::json;
    v_ip := v_headers->>'x-forwarded-for';
    
    -- Pick the first IP in the chain if multiple are present
    IF v_ip LIKE '%,%' THEN
      v_ip := split_part(v_ip, ',', 1);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_ip := 'unknown';
  END;
  RETURN COALESCE(v_ip, 'unknown');
END;
$$ LANGUAGE plpgsql;

-- Check if currently blocked
CREATE OR REPLACE FUNCTION check_saas_login_block(p_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_ip TEXT;
  v_blocked BOOLEAN;
BEGIN
  v_ip := get_real_ip();

  SELECT EXISTS (
    SELECT 1 FROM saas_login_blocks
    WHERE (
      (email = p_email AND email IS NOT NULL) OR 
      (ip_address = v_ip AND ip_address != 'unknown')
    )
    AND blocked_until > NOW()
  ) INTO v_blocked;
  
  RETURN v_blocked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Register attempt and evaluate brute force conditions
CREATE OR REPLACE FUNCTION register_saas_login_attempt(
  p_email TEXT,
  p_success BOOLEAN,
  p_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_ip TEXT;
  v_recent_failures INT;
  v_recent_attempts_ip INT;
BEGIN
  v_ip := get_real_ip();
  
  -- Insert the attempt
  INSERT INTO saas_login_attempts (email, ip_address, success, attempt_type)
  VALUES (p_email, v_ip, p_success, p_type);

  -- RULE 1: RATE LIMIT (Max 10 attempts per minute strictly per IP)
  IF v_ip != 'unknown' THEN
    SELECT COUNT(*) INTO v_recent_attempts_ip
    FROM saas_login_attempts
    WHERE ip_address = v_ip
      AND created_at > NOW() - INTERVAL '1 minute';

    IF v_recent_attempts_ip >= 10 THEN
      -- Block this IP for 15 minutes
      IF NOT EXISTS (
        SELECT 1 FROM saas_login_blocks 
        WHERE email IS NULL AND ip_address = v_ip AND blocked_until > NOW()
      ) THEN
        INSERT INTO saas_login_blocks (email, ip_address, blocked_until)
        VALUES (NULL, v_ip, NOW() + INTERVAL '15 minutes');
      END IF;
      RETURN TRUE; -- Returning true means the user should be treated as blocked from now on
    END IF;
  END IF;

  -- RULE 2: BRUTE FORCE (Max 5 failed attempts in 15 minutes per Email AND/OR IP)
  SELECT COUNT(*) INTO v_recent_failures
  FROM saas_login_attempts
  WHERE (
    (email = p_email AND email IS NOT NULL) OR 
    (ip_address = v_ip AND ip_address != 'unknown')
  )
    AND success = false
    AND created_at > NOW() - INTERVAL '15 minutes';

  IF v_recent_failures >= 5 THEN
    -- Block both email and IP for 15 mins
    IF NOT EXISTS (
      SELECT 1 FROM saas_login_blocks 
      WHERE email = p_email AND ip_address = v_ip AND blocked_until > NOW()
    ) THEN
      INSERT INTO saas_login_blocks (email, ip_address, blocked_until)
      VALUES (p_email, v_ip, NOW() + INTERVAL '15 minutes');
    END IF;
    RETURN TRUE;
  END IF;

  -- RULE 3: SUCCESS RESET
  -- On a successful login, purge their temporary failure records to reset the counting mechanism
  IF p_success THEN
    DELETE FROM saas_login_attempts 
    WHERE (email = p_email OR ip_address = v_ip) AND success = false;
    
    DELETE FROM saas_login_blocks 
    WHERE email = p_email OR ip_address = v_ip;
  END IF;

  RETURN FALSE; 
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
