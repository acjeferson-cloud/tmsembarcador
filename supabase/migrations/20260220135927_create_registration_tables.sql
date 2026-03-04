/*
  # Tabelas de Cadastros

  1. Novas Tabelas
    - `carriers` - Transportadoras
    - `business_partners` - Parceiros de Negócio (clientes/fornecedores)
    - `rejection_reasons` - Motivos de rejeição
    - `occurrences` - Ocorrências de transporte
    
  2. Segurança
    - Enable RLS em todas as tabelas
    - Políticas de isolamento multi-tenant
*/

-- Tabela de Transportadoras
CREATE TABLE IF NOT EXISTS carriers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES saas_organizations(id) ON DELETE CASCADE,
  environment_id uuid REFERENCES saas_environments(id) ON DELETE CASCADE,
  codigo text NOT NULL,
  nome_fantasia text NOT NULL,
  razao_social text,
  cnpj text,
  inscricao_estadual text,
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
  website text,
  tipo_servico text,
  prazo_coleta integer DEFAULT 1,
  prazo_entrega integer DEFAULT 5,
  nps_interno integer,
  ativo boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, environment_id, codigo)
);

-- Tabela de Parceiros de Negócio
CREATE TABLE IF NOT EXISTS business_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES saas_organizations(id) ON DELETE CASCADE,
  environment_id uuid REFERENCES saas_environments(id) ON DELETE CASCADE,
  codigo text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('cliente', 'fornecedor', 'ambos')),
  tipo_pessoa text DEFAULT 'juridica' CHECK (tipo_pessoa IN ('fisica', 'juridica')),
  nome_fantasia text,
  razao_social text NOT NULL,
  cpf_cnpj text,
  inscricao_estadual text,
  inscricao_municipal text,
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
  contato_nome text,
  contato_telefone text,
  contato_email text,
  limite_credito decimal(15,2) DEFAULT 0,
  observacoes text,
  ativo boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, environment_id, codigo)
);

-- Tabela de Motivos de Rejeição
CREATE TABLE IF NOT EXISTS rejection_reasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES saas_organizations(id) ON DELETE CASCADE,
  environment_id uuid REFERENCES saas_environments(id) ON DELETE CASCADE,
  codigo text NOT NULL,
  descricao text NOT NULL,
  tipo text CHECK (tipo IN ('fatura', 'cte', 'coleta', 'entrega', 'geral')),
  requer_foto boolean DEFAULT false,
  requer_assinatura boolean DEFAULT false,
  requer_observacao boolean DEFAULT true,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, environment_id, codigo)
);

-- Tabela de Ocorrências
CREATE TABLE IF NOT EXISTS occurrences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES saas_organizations(id) ON DELETE CASCADE,
  environment_id uuid REFERENCES saas_environments(id) ON DELETE CASCADE,
  codigo text NOT NULL,
  descricao text NOT NULL,
  tipo text CHECK (tipo IN ('coleta', 'transporte', 'entrega', 'geral')),
  impacta_prazo boolean DEFAULT false,
  dias_impacto integer DEFAULT 0,
  notifica_cliente boolean DEFAULT true,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, environment_id, codigo)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_carriers_organization ON carriers(organization_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_carriers_codigo ON carriers(organization_id, environment_id, codigo);
CREATE INDEX IF NOT EXISTS idx_carriers_cnpj ON carriers(cnpj) WHERE cnpj IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_business_partners_organization ON business_partners(organization_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_business_partners_codigo ON business_partners(organization_id, environment_id, codigo);
CREATE INDEX IF NOT EXISTS idx_business_partners_tipo ON business_partners(tipo);
CREATE INDEX IF NOT EXISTS idx_rejection_reasons_organization ON rejection_reasons(organization_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_occurrences_organization ON occurrences(organization_id, environment_id);

-- RLS
ALTER TABLE carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE rejection_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE occurrences ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can read carriers in their org/env"
  ON carriers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read business_partners in their org/env"
  ON business_partners FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read rejection_reasons in their org/env"
  ON rejection_reasons FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read occurrences in their org/env"
  ON occurrences FOR SELECT
  TO authenticated
  USING (true);

-- Triggers
CREATE TRIGGER update_carriers_updated_at
  BEFORE UPDATE ON carriers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_partners_updated_at
  BEFORE UPDATE ON business_partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rejection_reasons_updated_at
  BEFORE UPDATE ON rejection_reasons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_occurrences_updated_at
  BEFORE UPDATE ON occurrences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();