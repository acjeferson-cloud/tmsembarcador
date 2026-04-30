ALTER TABLE user_innovations ADD COLUMN IF NOT EXISTS status varchar(20) DEFAULT 'approved';

-- Atualizar registros existentes para 'approved'
UPDATE user_innovations SET status = 'approved' WHERE is_active = true;