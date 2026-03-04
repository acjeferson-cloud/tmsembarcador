/*
  # Tabelas de Cálculo de Frete

  1. Novas Tabelas
    - `freight_rates` - Tabelas de Frete
    - `freight_rate_values` - Valores das tabelas de frete
    - `freight_rate_cities` - Cidades atendidas por tabela de frete
    - `additional_fees` - Taxas Adicionais
    - `restricted_items` - Itens Restritos
    - `freight_quotes` - Cotações de Frete
    
  2. Segurança
    - Enable RLS em todas as tabelas
    - Políticas de isolamento multi-tenant
*/

-- Tabela de Tabelas de Frete
CREATE TABLE IF NOT EXISTS freight_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES saas_organizations(id) ON DELETE CASCADE,
  environment_id uuid REFERENCES saas_environments(id) ON DELETE CASCADE,
  establishment_id uuid REFERENCES establishments(id),
  carrier_id uuid REFERENCES carriers(id),
  
  nome text NOT NULL,
  codigo text NOT NULL,
  tipo text DEFAULT 'peso' CHECK (tipo IN ('peso', 'valor', 'volume', 'misto')),
  
  data_inicio date NOT NULL,
  data_fim date,
  
  -- Configurações
  peso_minimo decimal(15,3) DEFAULT 0,
  peso_maximo decimal(15,3),
  valor_minimo decimal(15,2) DEFAULT 0,
  cubagem_fator decimal(10,2) DEFAULT 300,
  
  -- Alíquotas
  aliquota_icms decimal(5,2) DEFAULT 0,
  aliquota_pedagio decimal(5,2) DEFAULT 0,
  aliquota_gris decimal(5,2) DEFAULT 0,
  aliquota_tde decimal(5,2) DEFAULT 0,
  
  ativa boolean DEFAULT true,
  observacoes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, environment_id, codigo)
);

-- Tabela de Valores de Frete
CREATE TABLE IF NOT EXISTS freight_rate_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  freight_rate_id uuid NOT NULL REFERENCES freight_rates(id) ON DELETE CASCADE,
  
  -- Faixas
  peso_inicial decimal(15,3),
  peso_final decimal(15,3),
  valor_inicial decimal(15,2),
  valor_final decimal(15,2),
  
  -- Valores
  valor_fixo decimal(15,2) DEFAULT 0,
  valor_kg decimal(15,2) DEFAULT 0,
  valor_percentual decimal(5,2) DEFAULT 0,
  
  -- Prazo
  prazo_dias integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de Cidades Atendidas
CREATE TABLE IF NOT EXISTS freight_rate_cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  freight_rate_id uuid NOT NULL REFERENCES freight_rates(id) ON DELETE CASCADE,
  
  origem_cidade text,
  origem_estado text,
  origem_cep text,
  
  destino_cidade text,
  destino_estado text,
  destino_cep text,
  
  valor_adicional decimal(15,2) DEFAULT 0,
  percentual_adicional decimal(5,2) DEFAULT 0,
  prazo_adicional integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  UNIQUE(freight_rate_id, origem_cidade, origem_estado, destino_cidade, destino_estado)
);

-- Tabela de Taxas Adicionais
CREATE TABLE IF NOT EXISTS additional_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES saas_organizations(id) ON DELETE CASCADE,
  environment_id uuid REFERENCES saas_environments(id) ON DELETE CASCADE,
  freight_rate_id uuid REFERENCES freight_rates(id) ON DELETE CASCADE,
  
  nome text NOT NULL,
  codigo text NOT NULL,
  tipo text DEFAULT 'fixo' CHECK (tipo IN ('fixo', 'percentual', 'por_kg', 'por_volume')),
  
  valor decimal(15,2) DEFAULT 0,
  percentual decimal(5,2) DEFAULT 0,
  
  aplica_automaticamente boolean DEFAULT false,
  obrigatorio boolean DEFAULT false,
  ativo boolean DEFAULT true,
  
  observacoes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, environment_id, codigo)
);

-- Tabela de Itens Restritos
CREATE TABLE IF NOT EXISTS restricted_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES saas_organizations(id) ON DELETE CASCADE,
  environment_id uuid REFERENCES saas_environments(id) ON DELETE CASCADE,
  freight_rate_id uuid REFERENCES freight_rates(id) ON DELETE CASCADE,
  
  descricao text NOT NULL,
  codigo_ncm text,
  tipo_restricao text DEFAULT 'proibido' CHECK (tipo_restricao IN ('proibido', 'condicional', 'taxa_adicional')),
  
  valor_taxa_adicional decimal(15,2) DEFAULT 0,
  observacoes text,
  ativo boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de Cotações de Frete
CREATE TABLE IF NOT EXISTS freight_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES saas_organizations(id) ON DELETE CASCADE,
  environment_id uuid REFERENCES saas_environments(id) ON DELETE CASCADE,
  establishment_id uuid REFERENCES establishments(id),
  
  numero_cotacao text NOT NULL,
  
  -- Origem
  origem_cep text,
  origem_cidade text,
  origem_estado text,
  
  -- Destino
  destino_cep text,
  destino_cidade text,
  destino_estado text,
  
  -- Dados da carga
  peso decimal(15,3) DEFAULT 0,
  valor_mercadoria decimal(15,2) DEFAULT 0,
  quantidade_volumes integer DEFAULT 0,
  
  -- Resultados
  resultados jsonb DEFAULT '[]'::jsonb,
  melhor_opcao_id uuid,
  
  status text DEFAULT 'processando' CHECK (status IN ('processando', 'concluida', 'erro')),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, environment_id, numero_cotacao)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_freight_rates_organization ON freight_rates(organization_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_freight_rates_establishment ON freight_rates(establishment_id);
CREATE INDEX IF NOT EXISTS idx_freight_rates_carrier ON freight_rates(carrier_id);
CREATE INDEX IF NOT EXISTS idx_freight_rates_codigo ON freight_rates(organization_id, environment_id, codigo);
CREATE INDEX IF NOT EXISTS idx_freight_rates_ativa ON freight_rates(ativa) WHERE ativa = true;
CREATE INDEX IF NOT EXISTS idx_freight_rates_datas ON freight_rates(data_inicio, data_fim);

CREATE INDEX IF NOT EXISTS idx_freight_rate_values_freight_rate ON freight_rate_values(freight_rate_id);
CREATE INDEX IF NOT EXISTS idx_freight_rate_values_peso ON freight_rate_values(peso_inicial, peso_final);

CREATE INDEX IF NOT EXISTS idx_freight_rate_cities_freight_rate ON freight_rate_cities(freight_rate_id);
CREATE INDEX IF NOT EXISTS idx_freight_rate_cities_origem ON freight_rate_cities(origem_cidade, origem_estado);
CREATE INDEX IF NOT EXISTS idx_freight_rate_cities_destino ON freight_rate_cities(destino_cidade, destino_estado);

CREATE INDEX IF NOT EXISTS idx_additional_fees_organization ON additional_fees(organization_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_additional_fees_freight_rate ON additional_fees(freight_rate_id);

CREATE INDEX IF NOT EXISTS idx_restricted_items_organization ON restricted_items(organization_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_restricted_items_freight_rate ON restricted_items(freight_rate_id);

CREATE INDEX IF NOT EXISTS idx_freight_quotes_organization ON freight_quotes(organization_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_freight_quotes_establishment ON freight_quotes(establishment_id);
CREATE INDEX IF NOT EXISTS idx_freight_quotes_created ON freight_quotes(created_at);

-- RLS
ALTER TABLE freight_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE freight_rate_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE freight_rate_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE additional_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE restricted_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE freight_quotes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can read freight_rates in their org/env"
  ON freight_rates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read freight_rate_values"
  ON freight_rate_values FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read freight_rate_cities"
  ON freight_rate_cities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read additional_fees in their org/env"
  ON additional_fees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read restricted_items in their org/env"
  ON restricted_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read freight_quotes in their org/env"
  ON freight_quotes FOR SELECT
  TO authenticated
  USING (true);

-- Triggers
CREATE TRIGGER update_freight_rates_updated_at
  BEFORE UPDATE ON freight_rates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_freight_rate_values_updated_at
  BEFORE UPDATE ON freight_rate_values
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_additional_fees_updated_at
  BEFORE UPDATE ON additional_fees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restricted_items_updated_at
  BEFORE UPDATE ON restricted_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_freight_quotes_updated_at
  BEFORE UPDATE ON freight_quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();