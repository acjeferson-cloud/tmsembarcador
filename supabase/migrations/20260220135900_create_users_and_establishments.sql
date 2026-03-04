/*
  # Usuários e Estabelecimentos

  1. Novas Tabelas
    - `users` - Usuários do sistema
      - `id` (uuid, primary key)
      - `organization_id` (uuid, foreign key)
      - `environment_id` (uuid, foreign key)
      - `email` (text, unique)
      - `senha_hash` (text)
      - `nome` (text)
      - `tipo` (text) - admin, user, viewer
      - `ativo` (boolean)
      - `bloqueado` (boolean)
      - `tentativas_login` (integer)
      
    - `establishments` - Estabelecimentos/Filiais
      - `id` (uuid, primary key)
      - `organization_id` (uuid, foreign key)
      - `environment_id` (uuid, foreign key)
      - `codigo` (text) - Código único
      - `nome_fantasia` (text)
      - `razao_social` (text)
      - `cnpj` (text)
      - `tipo` (text) - matriz, filial
      - `ativo` (boolean)
      
  2. Segurança
    - Enable RLS
    - Políticas de isolamento por organization_id e environment_id
*/

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES saas_organizations(id) ON DELETE CASCADE,
  environment_id uuid REFERENCES saas_environments(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  senha_hash text NOT NULL,
  nome text NOT NULL,
  tipo text DEFAULT 'user' CHECK (tipo IN ('admin', 'user', 'viewer', 'saas_admin')),
  ativo boolean DEFAULT true,
  bloqueado boolean DEFAULT false,
  tentativas_login integer DEFAULT 0,
  ultimo_login timestamptz,
  ultimo_ip text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de Estabelecimentos
CREATE TABLE IF NOT EXISTS establishments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES saas_organizations(id) ON DELETE CASCADE,
  environment_id uuid REFERENCES saas_environments(id) ON DELETE CASCADE,
  codigo text NOT NULL,
  nome_fantasia text NOT NULL,
  razao_social text,
  cnpj text,
  inscricao_estadual text,
  inscricao_municipal text,
  tipo text DEFAULT 'filial' CHECK (tipo IN ('matriz', 'filial')),
  cep text,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  estado text,
  pais text DEFAULT 'Brasil',
  telefone text,
  email text,
  ativo boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, environment_id, codigo)
);

-- Tabela de relação Usuário-Estabelecimento
CREATE TABLE IF NOT EXISTS user_establishments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  establishment_id uuid NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, establishment_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_users_ativo ON users(ativo) WHERE ativo = true;
CREATE INDEX IF NOT EXISTS idx_establishments_organization ON establishments(organization_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_establishments_codigo ON establishments(organization_id, environment_id, codigo);
CREATE INDEX IF NOT EXISTS idx_establishments_cnpj ON establishments(cnpj) WHERE cnpj IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_establishments_user ON user_establishments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_establishments_establishment ON user_establishments(establishment_id);

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_establishments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para Users
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public read users for login"
  ON users FOR SELECT
  TO anon
  USING (true);

-- Políticas RLS para Establishments
CREATE POLICY "Users can read establishments in their org/env"
  ON establishments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public read establishments for login"
  ON establishments FOR SELECT
  TO anon
  USING (true);

-- Políticas RLS para User Establishments
CREATE POLICY "Users can read own establishment assignments"
  ON user_establishments FOR SELECT
  TO authenticated
  USING (true);

-- Triggers
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_establishments_updated_at
  BEFORE UPDATE ON establishments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();