ALTER TABLE email_outgoing_config 
ADD COLUMN IF NOT EXISTS auth_type text DEFAULT 'LOGIN',
ADD COLUMN IF NOT EXISTS oauth2_client_id text,
ADD COLUMN IF NOT EXISTS oauth2_client_secret text,
ADD COLUMN IF NOT EXISTS oauth2_refresh_token text,
ADD COLUMN IF NOT EXISTS reply_to_email text,
ADD COLUMN IF NOT EXISTS test_email_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_test_date timestamptz;

-- Permitir null na senha quando for OAuth2
ALTER TABLE email_outgoing_config ALTER COLUMN smtp_password DROP NOT NULL;
