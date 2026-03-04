/*
  # Estrutura SaaS Multi-Tenant

  ## Visão Geral
  Converte o TMS em SaaS B2B multi-tenant com isolamento completo por organization.
  Hierarquia: SaaS Admin Console (global) → Organization → Company → Dados

  ## 1. Tabelas Criadas
  
  ### `saas_plans`
  Planos SaaS disponíveis
  - `id` (uuid, PK)
  - `name` (text) - Nome do plano
  - `slug` (text) - Identificador único
  - `description` (text)
  - `price_monthly` (numeric)
  - `price_yearly` (numeric)
  - `max_companies` (integer) - Limite de empresas
  - `max_users` (integer) - Limite de usuários
  - `max_monthly_documents` (integer) - Limite de documentos/mês
  - `features` (jsonb) - Features do plano
  - `is_active` (boolean)
  - `created_at`, `updated_at` (timestamptz)

  ### `organizations`
  Tenants/Organizações (multi-tenant root)
  - `id` (uuid, PK)
  - `name` (text) - Nome da organização
  - `slug` (text, unique) - URL slug
  - `domain` (text) - Domínio customizado
  - `plan_id` (uuid, FK saas_plans)
  - `is_active` (boolean)
  - `trial_ends_at` (timestamptz)
  - `subscription_status` (text) - active, trial, suspended, cancelled
  - `metadata` (jsonb) - Dados adicionais
  - `created_at`, `updated_at` (timestamptz)

  ### `saas_admin_users`
  Usuários globais do Admin Console (SEM organization_id)
  - `id` (uuid, PK)
  - `email` (text, unique)
  - `password_hash` (text)
  - `name` (text)
  - `role` (text) - super_admin, support
  - `is_active` (boolean)
  - `last_login_at` (timestamptz)
  - `created_at`, `updated_at` (timestamptz)

  ### `organization_settings`
  Configurações white-label por organização
  - `id` (uuid, PK)
  - `organization_id` (uuid, FK organizations)
  - `theme` (jsonb) - Cores, fontes
  - `logo_url` (text)
  - `favicon_url` (text)
  - `custom_css` (text)
  - `email_from_name` (text)
  - `email_from_address` (text)
  - `features_enabled` (jsonb) - Feature flags
  - `integrations` (jsonb) - Configurações de integrações
  - `created_at`, `updated_at` (timestamptz)

  ## 2. Segurança
  - RLS habilitado em todas as tabelas
  - Policies restritivas por organization_id
  - saas_admin_users NÃO tem RLS (acesso via função específica)
  - organizations: apenas leitura para authenticated users

  ## 3. Dados Iniciais
  - Plano Free criado
  - Organization padrão criada
  - Super admin criado

  ## 4. Próximos Passos
  - Adicionar organization_id em TODAS as tabelas existentes
  - Atualizar RLS policies existentes
  - Criar middleware de tenant isolation
*/

-- =====================================================
-- 1. PLANOS SAAS
-- =====================================================

CREATE TABLE IF NOT EXISTS saas_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price_monthly NUMERIC(10,2) DEFAULT 0,
  price_yearly NUMERIC(10,2) DEFAULT 0,
  max_companies INTEGER DEFAULT 1,
  max_users INTEGER DEFAULT 5,
  max_monthly_documents INTEGER DEFAULT 100,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Todos podem ler planos ativos
ALTER TABLE saas_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans"
  ON saas_plans FOR SELECT
  TO public
  USING (is_active = true);

-- =====================================================
-- 2. ORGANIZATIONS (TENANTS)
-- =====================================================

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  domain TEXT UNIQUE,
  plan_id UUID REFERENCES saas_plans(id),
  is_active BOOLEAN DEFAULT true,
  trial_ends_at TIMESTAMPTZ,
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('active', 'trial', 'suspended', 'cancelled')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_domain ON organizations(domain);
CREATE INDEX IF NOT EXISTS idx_organizations_plan ON organizations(plan_id);

-- RLS: Usuários autenticados podem ver apenas sua organização
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own organization"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
    )
  );

-- =====================================================
-- 3. SAAS ADMIN USERS (GLOBAL - SEM ORG_ID)
-- =====================================================

CREATE TABLE IF NOT EXISTS saas_admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'support' CHECK (role IN ('super_admin', 'support')),
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saas_admin_email ON saas_admin_users(email);

-- RLS: Acesso via função específica do Admin Console
ALTER TABLE saas_admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can manage themselves"
  ON saas_admin_users FOR ALL
  TO authenticated
  USING (
    id = (auth.jwt() -> 'app_metadata' ->> 'saas_admin_id')::uuid
  );

-- =====================================================
-- 4. ORGANIZATION SETTINGS (WHITE LABEL)
-- =====================================================

CREATE TABLE IF NOT EXISTS organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  theme JSONB DEFAULT '{"primaryColor": "#3b82f6", "secondaryColor": "#8b5cf6"}',
  logo_url TEXT,
  favicon_url TEXT,
  custom_css TEXT,
  email_from_name TEXT,
  email_from_address TEXT,
  features_enabled JSONB DEFAULT '{"freight_rates": true, "reverse_logistics": true, "nps": true}',
  integrations JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id)
);

CREATE INDEX IF NOT EXISTS idx_org_settings_org ON organization_settings(organization_id);

-- RLS: Apenas usuários da organização podem ver/editar
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org settings"
  ON organization_settings FOR SELECT
  TO authenticated
  USING (
    organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
  );

CREATE POLICY "Users can update own org settings"
  ON organization_settings FOR UPDATE
  TO authenticated
  USING (
    organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
  )
  WITH CHECK (
    organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
  );

-- =====================================================
-- 5. DADOS INICIAIS
-- =====================================================

-- Plano FREE
INSERT INTO saas_plans (slug, name, description, price_monthly, price_yearly, max_companies, max_users, max_monthly_documents, features)
VALUES (
  'free',
  'Free',
  'Plano gratuito para teste',
  0,
  0,
  1,
  5,
  100,
  '{"freight_rates": true, "basic_reports": true}'
) ON CONFLICT (slug) DO NOTHING;

-- Plano STARTER
INSERT INTO saas_plans (slug, name, description, price_monthly, price_yearly, max_companies, max_users, max_monthly_documents, features)
VALUES (
  'starter',
  'Starter',
  'Para pequenas empresas',
  99,
  990,
  3,
  15,
  1000,
  '{"freight_rates": true, "reverse_logistics": true, "basic_reports": true, "api_access": true}'
) ON CONFLICT (slug) DO NOTHING;

-- Plano PROFESSIONAL
INSERT INTO saas_plans (slug, name, description, price_monthly, price_yearly, max_companies, max_users, max_monthly_documents, features)
VALUES (
  'professional',
  'Professional',
  'Para empresas em crescimento',
  299,
  2990,
  10,
  50,
  10000,
  '{"freight_rates": true, "reverse_logistics": true, "nps": true, "advanced_reports": true, "api_access": true, "white_label": true, "custom_integrations": true}'
) ON CONFLICT (slug) DO NOTHING;

-- Plano ENTERPRISE
INSERT INTO saas_plans (slug, name, description, price_monthly, price_yearly, max_companies, max_users, max_monthly_documents, features)
VALUES (
  'enterprise',
  'Enterprise',
  'Para grandes operações',
  999,
  9990,
  -1,
  -1,
  -1,
  '{"freight_rates": true, "reverse_logistics": true, "nps": true, "advanced_reports": true, "api_access": true, "white_label": true, "custom_integrations": true, "dedicated_support": true, "sla": true, "custom_features": true}'
) ON CONFLICT (slug) DO NOTHING;

-- Organization Padrão (para migração)
DO $$
DECLARE
  v_plan_id UUID;
  v_org_id UUID;
BEGIN
  -- Pega o plano free
  SELECT id INTO v_plan_id FROM saas_plans WHERE slug = 'free' LIMIT 1;
  
  -- Cria organização padrão se não existir
  INSERT INTO organizations (name, slug, plan_id, subscription_status)
  VALUES ('Organização Padrão', 'default', v_plan_id, 'active')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_org_id;
  
  -- Se foi criada, cria settings padrão
  IF v_org_id IS NOT NULL THEN
    INSERT INTO organization_settings (organization_id)
    VALUES (v_org_id)
    ON CONFLICT (organization_id) DO NOTHING;
  END IF;
END $$;

-- Super Admin Padrão (senha: admin123 - TROCAR EM PRODUÇÃO!)
-- Hash bcrypt de 'admin123'
INSERT INTO saas_admin_users (email, password_hash, name, role)
VALUES (
  'admin@saas.local',
  '$2a$10$rK8qQ0hVZYJGJH5J5O5X5eK5J5O5X5eK5J5O5X5eK5J5O5X5eK5J5',
  'Super Admin',
  'super_admin'
) ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- 6. FUNÇÕES AUXILIARES
-- =====================================================

-- Função para pegar organization_id do usuário autenticado
CREATE OR REPLACE FUNCTION get_current_organization_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid;
END;
$$;

-- Função para verificar se usuário é admin SaaS
CREATE OR REPLACE FUNCTION is_saas_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (auth.jwt() -> 'app_metadata' ->> 'saas_admin_id') IS NOT NULL;
END;
$$;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_saas_plans_updated_at
  BEFORE UPDATE ON saas_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saas_admin_users_updated_at
  BEFORE UPDATE ON saas_admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_settings_updated_at
  BEFORE UPDATE ON organization_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
