/*
  # Tabelas de Configuração

  1. Novas Tabelas
    - `whatsapp_config` - Configuração WhatsApp
    - `whatsapp_transactions` - Transações WhatsApp
    - `openai_config` - Configuração OpenAI
    - `openai_transactions` - Transações OpenAI
    - `google_maps_config` - Configuração Google Maps
    - `google_maps_transactions` - Transações Google Maps
    - `nps_config` - Configuração NPS
    - `nps_surveys` - Pesquisas NPS
    - `nps_responses` - Respostas NPS
    - `email_outgoing_config` - Configuração de email
    
  2. Segurança
    - Enable RLS em todas as tabelas
    - Políticas de isolamento multi-tenant
*/

-- Configuração WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES saas_organizations(id) ON DELETE CASCADE,
  environment_id uuid REFERENCES saas_environments(id) ON DELETE CASCADE,
  establishment_id uuid REFERENCES establishments(id),
  
  api_url text NOT NULL,
  api_key text NOT NULL,
  phone_number text NOT NULL,
  
  ativo boolean DEFAULT true,
  saldo_disponivel decimal(15,2) DEFAULT 0,
  limite_mensal decimal(15,2) DEFAULT 1000,
  consumo_mensal decimal(15,2) DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, environment_id, establishment_id)
);

-- Transações WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES saas_organizations(id) ON DELETE CASCADE,
  environment_id uuid REFERENCES saas_environments(id) ON DELETE CASCADE,
  whatsapp_config_id uuid REFERENCES whatsapp_config(id) ON DELETE CASCADE,
  
  tipo text CHECK (tipo IN ('mensagem', 'midia', 'template')),
  destinatario text NOT NULL,
  conteudo text,
  
  status text DEFAULT 'enviando' CHECK (status IN ('enviando', 'enviado', 'entregue', 'lido', 'erro')),
  erro_mensagem text,
  
  custo decimal(10,4) DEFAULT 0,
  
  created_at timestamptz DEFAULT now()
);

-- Configuração OpenAI
CREATE TABLE IF NOT EXISTS openai_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES saas_organizations(id) ON DELETE CASCADE,
  environment_id uuid REFERENCES saas_environments(id) ON DELETE CASCADE,
  establishment_id uuid REFERENCES establishments(id),
  
  api_key text NOT NULL,
  modelo text DEFAULT 'gpt-4',
  temperatura decimal(3,2) DEFAULT 0.7,
  max_tokens integer DEFAULT 1000,
  
  ativo boolean DEFAULT true,
  saldo_disponivel decimal(15,2) DEFAULT 0,
  limite_mensal decimal(15,2) DEFAULT 100,
  consumo_mensal decimal(15,2) DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, environment_id, establishment_id)
);

-- Transações OpenAI
CREATE TABLE IF NOT EXISTS openai_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES saas_organizations(id) ON DELETE CASCADE,
  environment_id uuid REFERENCES saas_environments(id) ON DELETE CASCADE,
  openai_config_id uuid REFERENCES openai_config(id) ON DELETE CASCADE,
  
  tipo text CHECK (tipo IN ('completion', 'chat', 'embedding', 'analise')),
  prompt text NOT NULL,
  resposta text,
  
  tokens_prompt integer DEFAULT 0,
  tokens_resposta integer DEFAULT 0,
  tokens_total integer DEFAULT 0,
  
  custo decimal(10,6) DEFAULT 0,
  
  status text DEFAULT 'processando' CHECK (status IN ('processando', 'concluido', 'erro')),
  erro_mensagem text,
  
  created_at timestamptz DEFAULT now()
);

-- Configuração Google Maps
CREATE TABLE IF NOT EXISTS google_maps_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES saas_organizations(id) ON DELETE CASCADE,
  environment_id uuid REFERENCES saas_environments(id) ON DELETE CASCADE,
  establishment_id uuid REFERENCES establishments(id),
  
  api_key text NOT NULL,
  
  ativo boolean DEFAULT true,
  saldo_disponivel decimal(15,2) DEFAULT 0,
  limite_mensal decimal(15,2) DEFAULT 200,
  consumo_mensal decimal(15,2) DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, environment_id, establishment_id)
);

-- Transações Google Maps
CREATE TABLE IF NOT EXISTS google_maps_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES saas_organizations(id) ON DELETE CASCADE,
  environment_id uuid REFERENCES saas_environments(id) ON DELETE CASCADE,
  google_maps_config_id uuid REFERENCES google_maps_config(id) ON DELETE CASCADE,
  
  tipo text CHECK (tipo IN ('geocoding', 'distance', 'directions', 'places')),
  origem text,
  destino text,
  
  resultado jsonb,
  
  custo decimal(10,6) DEFAULT 0,
  
  status text DEFAULT 'processando' CHECK (status IN ('processando', 'concluido', 'erro')),
  erro_mensagem text,
  
  created_at timestamptz DEFAULT now()
);

-- Configuração NPS
CREATE TABLE IF NOT EXISTS nps_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES saas_organizations(id) ON DELETE CASCADE,
  environment_id uuid REFERENCES saas_environments(id) ON DELETE CASCADE,
  establishment_id uuid REFERENCES establishments(id),
  
  ativo boolean DEFAULT true,
  enviar_automaticamente boolean DEFAULT true,
  dias_apos_entrega integer DEFAULT 2,
  
  pergunta_principal text DEFAULT 'Em uma escala de 0 a 10, o quanto você recomendaria nosso serviço?',
  pergunta_complementar text DEFAULT 'O que podemos melhorar?',
  
  email_assunto text DEFAULT 'Avalie nosso serviço',
  email_template text,
  whatsapp_template text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, environment_id, establishment_id)
);

-- Pesquisas NPS
CREATE TABLE IF NOT EXISTS nps_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES saas_organizations(id) ON DELETE CASCADE,
  environment_id uuid REFERENCES saas_environments(id) ON DELETE CASCADE,
  nps_config_id uuid REFERENCES nps_config(id) ON DELETE CASCADE,
  
  order_id uuid REFERENCES orders(id),
  carrier_id uuid REFERENCES carriers(id),
  
  data_envio timestamptz DEFAULT now(),
  data_resposta timestamptz,
  
  nota integer CHECK (nota >= 0 AND nota <= 10),
  comentario text,
  
  tipo_cliente text CHECK (tipo_cliente IN ('detrator', 'neutro', 'promotor')),
  
  status text DEFAULT 'enviada' CHECK (status IN ('enviada', 'respondida', 'expirada')),
  
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Respostas NPS
CREATE TABLE IF NOT EXISTS nps_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES saas_organizations(id) ON DELETE CASCADE,
  environment_id uuid REFERENCES saas_environments(id) ON DELETE CASCADE,
  nps_survey_id uuid REFERENCES nps_surveys(id) ON DELETE CASCADE,
  
  pergunta text NOT NULL,
  resposta text,
  
  created_at timestamptz DEFAULT now()
);

-- Configuração Email Outgoing
CREATE TABLE IF NOT EXISTS email_outgoing_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES saas_organizations(id) ON DELETE CASCADE,
  environment_id uuid REFERENCES saas_environments(id) ON DELETE CASCADE,
  establishment_id uuid REFERENCES establishments(id),
  
  smtp_host text NOT NULL,
  smtp_port integer DEFAULT 587,
  smtp_user text NOT NULL,
  smtp_password text NOT NULL,
  smtp_secure boolean DEFAULT true,
  
  from_email text NOT NULL,
  from_name text NOT NULL,
  
  ativo boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, environment_id, establishment_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_whatsapp_config_organization ON whatsapp_config(organization_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_transactions_config ON whatsapp_transactions(whatsapp_config_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_transactions_created ON whatsapp_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_openai_config_organization ON openai_config(organization_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_openai_transactions_config ON openai_transactions(openai_config_id);
CREATE INDEX IF NOT EXISTS idx_openai_transactions_created ON openai_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_google_maps_config_organization ON google_maps_config(organization_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_google_maps_transactions_config ON google_maps_transactions(google_maps_config_id);
CREATE INDEX IF NOT EXISTS idx_google_maps_transactions_created ON google_maps_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_nps_config_organization ON nps_config(organization_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_nps_surveys_config ON nps_surveys(nps_config_id);
CREATE INDEX IF NOT EXISTS idx_nps_surveys_order ON nps_surveys(order_id);
CREATE INDEX IF NOT EXISTS idx_nps_surveys_status ON nps_surveys(status);
CREATE INDEX IF NOT EXISTS idx_nps_responses_survey ON nps_responses(nps_survey_id);

CREATE INDEX IF NOT EXISTS idx_email_outgoing_config_organization ON email_outgoing_config(organization_id, environment_id);

-- RLS
ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE openai_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE openai_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_maps_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_maps_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nps_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE nps_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE nps_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_outgoing_config ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can read whatsapp_config in their org/env"
  ON whatsapp_config FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read whatsapp_transactions in their org/env"
  ON whatsapp_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read openai_config in their org/env"
  ON openai_config FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read openai_transactions in their org/env"
  ON openai_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read google_maps_config in their org/env"
  ON google_maps_config FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read google_maps_transactions in their org/env"
  ON google_maps_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read nps_config in their org/env"
  ON nps_config FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read nps_surveys in their org/env"
  ON nps_surveys FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read nps_responses in their org/env"
  ON nps_responses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read email_outgoing_config in their org/env"
  ON email_outgoing_config FOR SELECT
  TO authenticated
  USING (true);

-- Triggers
CREATE TRIGGER update_whatsapp_config_updated_at
  BEFORE UPDATE ON whatsapp_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_openai_config_updated_at
  BEFORE UPDATE ON openai_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_google_maps_config_updated_at
  BEFORE UPDATE ON google_maps_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nps_config_updated_at
  BEFORE UPDATE ON nps_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_outgoing_config_updated_at
  BEFORE UPDATE ON email_outgoing_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();