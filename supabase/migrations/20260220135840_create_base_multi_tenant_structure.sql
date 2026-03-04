/*
  # Estrutura Base Multi-Tenant

  1. Novas Tabelas
    - `saas_organizations` - Organizações (empresas clientes)
      - `id` (uuid, primary key)
      - `codigo` (text, unique) - Código alfanumérico único
      - `nome` (text) - Nome da organização
      - `cnpj` (text, unique)
      - `status` (text) - ativo, inativo, suspenso
      - `plan_id` (uuid) - Plano contratado
      - `created_at` (timestamptz)
      
    - `saas_environments` - Ambientes (produção, homologação, etc)
      - `id` (uuid, primary key)
      - `organization_id` (uuid, foreign key)
      - `codigo` (text) - Código único dentro da org
      - `nome` (text) - Nome do ambiente
      - `tipo` (text) - producao, homologacao, teste
      - `status` (text) - ativo, inativo
      - `created_at` (timestamptz)
      
    - `saas_plans` - Planos de assinatura
      - `id` (uuid, primary key)
      - `nome` (text)
      - `descricao` (text)
      - `valor_mensal` (decimal)
      - `max_users` (integer)
      - `features` (jsonb)
      
    - `saas_admins` - Administradores do sistema SaaS
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `senha_hash` (text)
      - `nome` (text)
      - `ativo` (boolean)
      
  2. Segurança
    - Enable RLS em todas as tabelas
    - Políticas para isolamento multi-tenant
*/

-- Tabela de Planos
CREATE TABLE IF NOT EXISTS saas_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  valor_mensal decimal(10,2) DEFAULT 0,
  max_users integer DEFAULT 10,
  max_establishments integer DEFAULT 5,
  features jsonb DEFAULT '{}'::jsonb,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de Organizações
CREATE TABLE IF NOT EXISTS saas_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE NOT NULL,
  nome text NOT NULL,
  cnpj text UNIQUE,
  email text,
  telefone text,
  status text DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'suspenso', 'cancelado')),
  plan_id uuid REFERENCES saas_plans(id),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de Ambientes
CREATE TABLE IF NOT EXISTS saas_environments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES saas_organizations(id) ON DELETE CASCADE,
  codigo text NOT NULL,
  nome text NOT NULL,
  tipo text DEFAULT 'producao' CHECK (tipo IN ('producao', 'homologacao', 'teste', 'desenvolvimento')),
  status text DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, codigo)
);

-- Tabela de Admins SaaS
CREATE TABLE IF NOT EXISTS saas_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  senha_hash text NOT NULL,
  nome text NOT NULL,
  ativo boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_saas_organizations_codigo ON saas_organizations(codigo);
CREATE INDEX IF NOT EXISTS idx_saas_organizations_cnpj ON saas_organizations(cnpj);
CREATE INDEX IF NOT EXISTS idx_saas_organizations_status ON saas_organizations(status);
CREATE INDEX IF NOT EXISTS idx_saas_environments_organization ON saas_environments(organization_id);
CREATE INDEX IF NOT EXISTS idx_saas_environments_codigo ON saas_environments(organization_id, codigo);

-- RLS
ALTER TABLE saas_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_environments ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_admins ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (acesso público controlado para login)
CREATE POLICY "Public read saas_organizations for login"
  ON saas_organizations FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read saas_environments for login"
  ON saas_environments FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read saas_plans"
  ON saas_plans FOR SELECT
  TO anon, authenticated
  USING (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_saas_organizations_updated_at
  BEFORE UPDATE ON saas_organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saas_environments_updated_at
  BEFORE UPDATE ON saas_environments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saas_plans_updated_at
  BEFORE UPDATE ON saas_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();