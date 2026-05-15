ALTER TABLE email_outgoing_config 
ADD COLUMN IF NOT EXISTS oauth2_token_url text;
