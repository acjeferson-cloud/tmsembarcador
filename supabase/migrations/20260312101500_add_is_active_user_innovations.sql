
-- Adiciona a coluna is_active na tabela user_innovations
ALTER TABLE user_innovations 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Adiciona activated_at na tabela user_innovations caso não exista
ALTER TABLE user_innovations 
ADD COLUMN IF NOT EXISTS activated_at timestamptz DEFAULT now();

-- Adiciona notes na tabela user_innovations caso não exista
ALTER TABLE user_innovations 
ADD COLUMN IF NOT EXISTS notes text;
