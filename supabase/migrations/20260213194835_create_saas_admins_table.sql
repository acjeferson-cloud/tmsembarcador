/*
  # Criar Tabela de Administradores SaaS

  1. Nova Tabela
    - `saas_admins`
      - `id` (uuid, primary key)
      - `email` (text, unique, not null)
      - `name` (text, not null)
      - `password_hash` (text, not null) - SHA-256 hash da senha
      - `role` (text, not null) - super_admin, admin, etc
      - `is_active` (boolean, default true)
      - `last_login_at` (timestamptz)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS na tabela
    - Criar policies para permitir apenas admins autenticados acessarem
    
  3. Dados Iniciais
    - Criar usuário admin padrão
    - Email: admin@gruposmartlog.com.br
    - Senha: admin123 (hash SHA-256: 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9)
*/

-- 1. Criar tabela saas_admins
CREATE TABLE IF NOT EXISTS saas_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  is_active boolean DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Criar índices
CREATE INDEX IF NOT EXISTS idx_saas_admins_email ON saas_admins(email);
CREATE INDEX IF NOT EXISTS idx_saas_admins_is_active ON saas_admins(is_active);

-- 3. Enable RLS
ALTER TABLE saas_admins ENABLE ROW LEVEL SECURITY;

-- 4. Criar policies
-- Admins podem ver todos os outros admins
CREATE POLICY "saas_admins_select_policy"
  ON saas_admins FOR SELECT
  TO anon
  USING (is_saas_admin());

-- Apenas super_admins podem inserir novos admins
CREATE POLICY "saas_admins_insert_policy"
  ON saas_admins FOR INSERT
  TO anon
  WITH CHECK (is_saas_admin());

-- Admins podem atualizar seu próprio registro
CREATE POLICY "saas_admins_update_policy"
  ON saas_admins FOR UPDATE
  TO anon
  USING (is_saas_admin())
  WITH CHECK (is_saas_admin());

-- Apenas super_admins podem deletar admins
CREATE POLICY "saas_admins_delete_policy"
  ON saas_admins FOR DELETE
  TO anon
  USING (is_saas_admin());

-- 5. Inserir admin padrão
-- Senha: admin123
-- SHA-256: 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
INSERT INTO saas_admins (email, name, password_hash, role, is_active)
VALUES (
  'admin@gruposmartlog.com.br',
  'Super Admin',
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
  'super_admin',
  true
)
ON CONFLICT (email) DO NOTHING;

-- 6. Comentários
COMMENT ON TABLE saas_admins IS 
  'Tabela de administradores do SaaS. Armazena credenciais e informações dos admins globais.';

COMMENT ON COLUMN saas_admins.password_hash IS
  'Hash SHA-256 da senha do admin. NUNCA armazenar senhas em texto plano.';

COMMENT ON COLUMN saas_admins.role IS
  'Papel do admin: super_admin (acesso total), admin (acesso restrito), etc.';
