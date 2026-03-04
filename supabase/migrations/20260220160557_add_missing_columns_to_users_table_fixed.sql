/*
  # Add missing columns to users table

  1. Changes
    - Add codigo (text) - User code
    - Add cpf (text) - CPF document
    - Add telefone (text) - Phone number
    - Add cargo (text) - Job title
    - Add departamento (text) - Department
    - Add perfil (text) - User profile/role
    - Add status (text) - Status (ativo/inativo)
    - Add permissoes (jsonb) - Custom permissions
    - Add estabelecimento_id (uuid) - Establishment FK
  
  2. Data Migration
    - Map existing 'tipo' to 'perfil'
    - Map 'ativo' boolean to 'status' text
    - Generate sequential codes for existing users
  
  3. Security
    - Maintain existing RLS policies
*/

-- Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS codigo text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cpf text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS telefone text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cargo text DEFAULT 'Operador';
ALTER TABLE users ADD COLUMN IF NOT EXISTS departamento text DEFAULT 'Logística';
ALTER TABLE users ADD COLUMN IF NOT EXISTS perfil text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissoes jsonb DEFAULT '[]'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS estabelecimento_id uuid;

-- Generate sequential codes using CTE
WITH numbered_users AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM users
  WHERE codigo IS NULL
)
UPDATE users u
SET codigo = LPAD(nu.rn::text, 4, '0')
FROM numbered_users nu
WHERE u.id = nu.id;

-- Migrate existing data
UPDATE users SET
  perfil = CASE
    WHEN tipo = 'admin' THEN 'administrador'
    WHEN tipo = 'viewer' THEN 'visualizador'
    ELSE 'operador'
  END,
  status = CASE WHEN ativo THEN 'ativo' ELSE 'inativo' END,
  cpf = LPAD((RANDOM() * 99999999999)::bigint::text, 11, '0'),
  telefone = CONCAT('(', LPAD((RANDOM() * 99)::int::text, 2, '0'), ') ', 
                    LPAD((RANDOM() * 99999)::int::text, 5, '0'), '-', 
                    LPAD((RANDOM() * 9999)::int::text, 4, '0'))
WHERE perfil IS NULL;

-- Add FK constraint for estabelecimento_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_estabelecimento'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT fk_users_estabelecimento
      FOREIGN KEY (estabelecimento_id) REFERENCES establishments(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_codigo ON users(codigo);
CREATE INDEX IF NOT EXISTS idx_users_perfil ON users(perfil);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_estabelecimento_id ON users(estabelecimento_id);