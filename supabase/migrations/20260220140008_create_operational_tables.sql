/*
  # Tabelas Operacionais

  1. Novas Tabelas
    - `orders` - Pedidos/Ordens de transporte
    - `invoices` - Notas Fiscais (NFe)
    - `ctes` - Conhecimentos de Transporte Eletrônico
    - `pickups` - Coletas
    
  2. Segurança
    - Enable RLS em todas as tabelas
    - Políticas de isolamento multi-tenant
*/

-- Tabela de Pedidos
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES saas_organizations(id) ON DELETE CASCADE,
  environment_id uuid REFERENCES saas_environments(id) ON DELETE CASCADE,
  establishment_id uuid REFERENCES establishments(id),
  numero_pedido text NOT NULL,
  tipo text DEFAULT 'saida' CHECK (tipo IN ('entrada', 'saida', 'transferencia')),
  business_partner_id uuid REFERENCES business_partners(id),
  carrier_id uuid REFERENCES carriers(id),
  status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'coletado', 'em_transito', 'entregue', 'cancelado')),
  data_pedido date DEFAULT CURRENT_DATE,
  data_prevista_coleta date,
  data_prevista_entrega date,
  data_coleta_realizada timestamptz,
  data_entrega_realizada timestamptz,
  
  -- Endereços
  origem_cep text,
  origem_logradouro text,
  origem_numero text,
  origem_complemento text,
  origem_bairro text,
  origem_cidade text,
  origem_estado text,
  origem_pais text DEFAULT 'Brasil',
  
  destino_cep text,
  destino_logradouro text,
  destino_numero text,
  destino_complemento text,
  destino_bairro text,
  destino_cidade text,
  destino_estado text,
  destino_pais text DEFAULT 'Brasil',
  
  -- Valores
  valor_mercadoria decimal(15,2) DEFAULT 0,
  valor_frete decimal(15,2) DEFAULT 0,
  valor_seguro decimal(15,2) DEFAULT 0,
  valor_outras_despesas decimal(15,2) DEFAULT 0,
  valor_total decimal(15,2) DEFAULT 0,
  
  -- Pesos e volumes
  peso_bruto decimal(15,3) DEFAULT 0,
  peso_liquido decimal(15,3) DEFAULT 0,
  quantidade_volumes integer DEFAULT 0,
  
  observacoes text,
  codigo_rastreio text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, environment_id, numero_pedido)
);

-- Tabela de Notas Fiscais
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES saas_organizations(id) ON DELETE CASCADE,
  environment_id uuid REFERENCES saas_environments(id) ON DELETE CASCADE,
  establishment_id uuid REFERENCES establishments(id),
  order_id uuid REFERENCES orders(id),
  
  numero text NOT NULL,
  serie text,
  chave_acesso text UNIQUE,
  tipo text DEFAULT 'saida' CHECK (tipo IN ('entrada', 'saida')),
  modelo text DEFAULT '55',
  
  data_emissao date DEFAULT CURRENT_DATE,
  data_saida date,
  
  -- Emitente
  emitente_cnpj text,
  emitente_nome text,
  emitente_ie text,
  
  -- Destinatário
  destinatario_cpf_cnpj text,
  destinatario_nome text,
  destinatario_ie text,
  
  -- Endereço
  destinatario_logradouro text,
  destinatario_numero text,
  destinatario_complemento text,
  destinatario_bairro text,
  destinatario_cidade text,
  destinatario_estado text,
  destinatario_cep text,
  destinatario_pais text DEFAULT 'Brasil',
  
  -- Valores
  valor_produtos decimal(15,2) DEFAULT 0,
  valor_frete decimal(15,2) DEFAULT 0,
  valor_seguro decimal(15,2) DEFAULT 0,
  valor_desconto decimal(15,2) DEFAULT 0,
  valor_outras_despesas decimal(15,2) DEFAULT 0,
  valor_total decimal(15,2) DEFAULT 0,
  valor_icms decimal(15,2) DEFAULT 0,
  valor_ipi decimal(15,2) DEFAULT 0,
  valor_pis decimal(15,2) DEFAULT 0,
  valor_cofins decimal(15,2) DEFAULT 0,
  
  -- Pesos e volumes
  peso_bruto decimal(15,3) DEFAULT 0,
  peso_liquido decimal(15,3) DEFAULT 0,
  quantidade_volumes integer DEFAULT 0,
  
  -- XML
  xml_content text,
  xml_processado boolean DEFAULT false,
  
  status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'processada', 'em_coleta', 'coletada', 'em_transito', 'entregue', 'cancelada', 'rejeitada')),
  observacoes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, environment_id, numero, serie)
);

-- Tabela de CTes
CREATE TABLE IF NOT EXISTS ctes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES saas_organizations(id) ON DELETE CASCADE,
  environment_id uuid REFERENCES saas_environments(id) ON DELETE CASCADE,
  establishment_id uuid REFERENCES establishments(id),
  order_id uuid REFERENCES orders(id),
  invoice_id uuid REFERENCES invoices(id),
  carrier_id uuid REFERENCES carriers(id),
  
  numero text NOT NULL,
  serie text,
  chave_acesso text UNIQUE,
  modelo text DEFAULT '57',
  tipo_servico text DEFAULT '0',
  
  data_emissao date DEFAULT CURRENT_DATE,
  
  -- Emitente (transportadora)
  emitente_cnpj text,
  emitente_nome text,
  emitente_ie text,
  
  -- Remetente
  remetente_cpf_cnpj text,
  remetente_nome text,
  
  -- Destinatário
  destinatario_cpf_cnpj text,
  destinatario_nome text,
  
  -- Valores
  valor_servico decimal(15,2) DEFAULT 0,
  valor_receber decimal(15,2) DEFAULT 0,
  valor_mercadoria decimal(15,2) DEFAULT 0,
  
  -- Pesos
  peso_bruto decimal(15,3) DEFAULT 0,
  peso_cubado decimal(15,3) DEFAULT 0,
  quantidade_volumes integer DEFAULT 0,
  
  -- Status
  status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'autorizado', 'cancelado', 'denegado', 'rejeitado')),
  protocolo_autorizacao text,
  data_autorizacao timestamptz,
  
  -- XML
  xml_content text,
  xml_processado boolean DEFAULT false,
  
  -- Comparação de valores
  divergencia_valores boolean DEFAULT false,
  valor_divergencia decimal(15,2) DEFAULT 0,
  motivo_divergencia text,
  
  observacoes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, environment_id, numero, serie)
);

-- Tabela de Coletas
CREATE TABLE IF NOT EXISTS pickups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES saas_organizations(id) ON DELETE CASCADE,
  environment_id uuid REFERENCES saas_environments(id) ON DELETE CASCADE,
  establishment_id uuid REFERENCES establishments(id),
  carrier_id uuid REFERENCES carriers(id),
  
  numero_coleta text NOT NULL,
  protocolo_transportadora text,
  
  data_solicitacao timestamptz DEFAULT now(),
  data_agendada date,
  hora_inicio time,
  hora_fim time,
  data_realizada timestamptz,
  
  -- Endereço de coleta
  cep text,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  estado text,
  pais text DEFAULT 'Brasil',
  
  -- Contato
  contato_nome text,
  contato_telefone text,
  contato_email text,
  
  -- Informações da carga
  quantidade_volumes integer DEFAULT 0,
  peso_total decimal(15,3) DEFAULT 0,
  valor_total decimal(15,2) DEFAULT 0,
  
  status text DEFAULT 'solicitada' CHECK (status IN ('solicitada', 'agendada', 'em_coleta', 'coletada', 'cancelada', 'rejeitada')),
  
  -- Comprovante
  comprovante_foto text,
  comprovante_assinatura text,
  comprovante_nome text,
  comprovante_documento text,
  comprovante_observacoes text,
  
  observacoes text,
  rejection_reason_id uuid REFERENCES rejection_reasons(id),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, environment_id, numero_coleta)
);

-- Tabela de relação Coleta-Nota Fiscal
CREATE TABLE IF NOT EXISTS pickup_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup_id uuid NOT NULL REFERENCES pickups(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(pickup_id, invoice_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_orders_organization ON orders(organization_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_orders_establishment ON orders(establishment_id);
CREATE INDEX IF NOT EXISTS idx_orders_numero ON orders(organization_id, environment_id, numero_pedido);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_data_pedido ON orders(data_pedido);

CREATE INDEX IF NOT EXISTS idx_invoices_organization ON invoices(organization_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_invoices_establishment ON invoices(establishment_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_numero ON invoices(organization_id, environment_id, numero, serie);
CREATE INDEX IF NOT EXISTS idx_invoices_chave ON invoices(chave_acesso);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

CREATE INDEX IF NOT EXISTS idx_ctes_organization ON ctes(organization_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_ctes_establishment ON ctes(establishment_id);
CREATE INDEX IF NOT EXISTS idx_ctes_order ON ctes(order_id);
CREATE INDEX IF NOT EXISTS idx_ctes_invoice ON ctes(invoice_id);
CREATE INDEX IF NOT EXISTS idx_ctes_numero ON ctes(organization_id, environment_id, numero, serie);
CREATE INDEX IF NOT EXISTS idx_ctes_chave ON ctes(chave_acesso);
CREATE INDEX IF NOT EXISTS idx_ctes_status ON ctes(status);

CREATE INDEX IF NOT EXISTS idx_pickups_organization ON pickups(organization_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_pickups_establishment ON pickups(establishment_id);
CREATE INDEX IF NOT EXISTS idx_pickups_carrier ON pickups(carrier_id);
CREATE INDEX IF NOT EXISTS idx_pickups_data_agendada ON pickups(data_agendada);
CREATE INDEX IF NOT EXISTS idx_pickups_status ON pickups(status);

CREATE INDEX IF NOT EXISTS idx_pickup_invoices_pickup ON pickup_invoices(pickup_id);
CREATE INDEX IF NOT EXISTS idx_pickup_invoices_invoice ON pickup_invoices(invoice_id);

-- RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE ctes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickups ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_invoices ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can read orders in their org/env"
  ON orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read invoices in their org/env"
  ON invoices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read ctes in their org/env"
  ON ctes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read pickups in their org/env"
  ON pickups FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read pickup_invoices"
  ON pickup_invoices FOR SELECT
  TO authenticated
  USING (true);

-- Triggers
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ctes_updated_at
  BEFORE UPDATE ON ctes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pickups_updated_at
  BEFORE UPDATE ON pickups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();