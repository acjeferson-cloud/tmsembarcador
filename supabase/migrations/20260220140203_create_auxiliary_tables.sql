/*
  # Tabelas Auxiliares

  1. Novas Tabelas
    - `countries` - Países
    - `states` - Estados
    - `cities` - Cidades
    - `holidays` - Feriados
    - `change_logs` - Registro de alterações
    - `api_keys` - Chaves de API
    - `licenses` - Licenças
    - `white_label_config` - Configuração White Label
    
  2. Segurança
    - Enable RLS em todas as tabelas
    - Políticas apropriadas para cada tabela
*/

-- Tabela de Países
CREATE TABLE IF NOT EXISTS countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE NOT NULL,
  nome text NOT NULL,
  nome_oficial text,
  sigla_iso2 text UNIQUE,
  sigla_iso3 text UNIQUE,
  codigo_telefone text,
  continente text,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de Estados
CREATE TABLE IF NOT EXISTS states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id uuid REFERENCES countries(id),
  codigo text NOT NULL,
  nome text NOT NULL,
  sigla text NOT NULL,
  regiao text,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(country_id, codigo)
);

-- Tabela de Cidades
CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id uuid REFERENCES states(id),
  codigo_ibge text UNIQUE,
  nome text NOT NULL,
  latitude decimal(10,8),
  longitude decimal(11,8),
  populacao integer,
  area_km2 decimal(15,2),
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de Feriados
CREATE TABLE IF NOT EXISTS holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES saas_organizations(id) ON DELETE CASCADE,
  environment_id uuid REFERENCES saas_environments(id) ON DELETE CASCADE,
  
  nome text NOT NULL,
  data date NOT NULL,
  tipo text DEFAULT 'nacional' CHECK (tipo IN ('nacional', 'estadual', 'municipal', 'opcional')),
  
  country_id uuid REFERENCES countries(id),
  state_id uuid REFERENCES states(id),
  city_id uuid REFERENCES cities(id),
  
  recorrente boolean DEFAULT true,
  ativo boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de Change Logs
CREATE TABLE IF NOT EXISTS change_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  versao text NOT NULL,
  data_lancamento date NOT NULL,
  tipo text DEFAULT 'feature' CHECK (tipo IN ('feature', 'bugfix', 'improvement', 'breaking')),
  titulo text NOT NULL,
  descricao text NOT NULL,
  impacto text CHECK (impacto IN ('baixo', 'medio', 'alto', 'critico')),
  publicado boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de API Keys
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES saas_organizations(id) ON DELETE CASCADE,
  environment_id uuid REFERENCES saas_environments(id) ON DELETE CASCADE,
  
  nome text NOT NULL,
  chave text UNIQUE NOT NULL,
  prefixo text NOT NULL,
  
  tipo text DEFAULT 'api' CHECK (tipo IN ('api', 'webhook', 'integracao')),
  
  permissoes jsonb DEFAULT '[]'::jsonb,
  
  ativa boolean DEFAULT true,
  expira_em timestamptz,
  ultimo_uso timestamptz,
  
  ip_whitelist jsonb DEFAULT '[]'::jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, environment_id, nome)
);

-- Tabela de Licenças
CREATE TABLE IF NOT EXISTS licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES saas_organizations(id) ON DELETE CASCADE,
  
  tipo text DEFAULT 'trial' CHECK (tipo IN ('trial', 'basic', 'professional', 'enterprise', 'custom')),
  
  data_inicio date NOT NULL,
  data_fim date,
  
  max_users integer DEFAULT 5,
  max_establishments integer DEFAULT 1,
  max_orders_month integer DEFAULT 1000,
  
  features jsonb DEFAULT '{}'::jsonb,
  
  ativa boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de Configuração White Label
CREATE TABLE IF NOT EXISTS white_label_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES saas_organizations(id) ON DELETE CASCADE,
  
  nome_aplicacao text DEFAULT 'TMS Embarcador',
  logo_url text,
  favicon_url text,
  
  cor_primaria text DEFAULT '#2563eb',
  cor_secundaria text DEFAULT '#1e40af',
  cor_destaque text DEFAULT '#3b82f6',
  
  dominio_customizado text,
  
  email_contato text,
  telefone_contato text,
  endereco_contato text,
  
  termos_uso_url text,
  politica_privacidade_url text,
  
  metadata jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_countries_codigo ON countries(codigo);
CREATE INDEX IF NOT EXISTS idx_countries_sigla_iso2 ON countries(sigla_iso2);

CREATE INDEX IF NOT EXISTS idx_states_country ON states(country_id);
CREATE INDEX IF NOT EXISTS idx_states_codigo ON states(country_id, codigo);
CREATE INDEX IF NOT EXISTS idx_states_sigla ON states(sigla);

CREATE INDEX IF NOT EXISTS idx_cities_state ON cities(state_id);
CREATE INDEX IF NOT EXISTS idx_cities_codigo_ibge ON cities(codigo_ibge);
CREATE INDEX IF NOT EXISTS idx_cities_nome ON cities(nome);

CREATE INDEX IF NOT EXISTS idx_holidays_organization ON holidays(organization_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_holidays_data ON holidays(data);
CREATE INDEX IF NOT EXISTS idx_holidays_tipo ON holidays(tipo);

CREATE INDEX IF NOT EXISTS idx_change_logs_versao ON change_logs(versao);
CREATE INDEX IF NOT EXISTS idx_change_logs_data ON change_logs(data_lancamento);

CREATE INDEX IF NOT EXISTS idx_api_keys_organization ON api_keys(organization_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_chave ON api_keys(chave);
CREATE INDEX IF NOT EXISTS idx_api_keys_ativa ON api_keys(ativa) WHERE ativa = true;

CREATE INDEX IF NOT EXISTS idx_licenses_organization ON licenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_licenses_ativa ON licenses(ativa) WHERE ativa = true;

-- RLS
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE states ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE white_label_config ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (dados públicos de leitura)
CREATE POLICY "Public read countries"
  ON countries FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read states"
  ON states FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read cities"
  ON cities FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can read holidays in their org/env"
  ON holidays FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public read change_logs"
  ON change_logs FOR SELECT
  TO anon, authenticated
  USING (publicado = true);

CREATE POLICY "Users can read api_keys in their org/env"
  ON api_keys FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read licenses for their org"
  ON licenses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read white_label_config for their org"
  ON white_label_config FOR SELECT
  TO authenticated
  USING (true);

-- Triggers
CREATE TRIGGER update_countries_updated_at
  BEFORE UPDATE ON countries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_states_updated_at
  BEFORE UPDATE ON states
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cities_updated_at
  BEFORE UPDATE ON cities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_holidays_updated_at
  BEFORE UPDATE ON holidays
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_change_logs_updated_at
  BEFORE UPDATE ON change_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_licenses_updated_at
  BEFORE UPDATE ON licenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_white_label_config_updated_at
  BEFORE UPDATE ON white_label_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();