-- Add force_password_reset column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS force_password_reset BOOLEAN DEFAULT false;

COMMENT ON COLUMN users.force_password_reset IS 'Sinaliza se o usuário deve obrigatoriamente redefinir a senha no próximo login.';
