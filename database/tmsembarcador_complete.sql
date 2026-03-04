-- ============================================================================
-- TMS EMBARCADOR - SMART LOG
-- Sistema de Gestão de Transporte Multi-Tenant
-- ============================================================================
-- Versão: 1.0.0
-- Data: 2026-02-20
-- Descrição: Schema completo do banco de dados
-- ============================================================================

-- ============================================================================
-- 1. ESTRUTURA BASE MULTI-TENANT
-- ============================================================================

-- Tabela de Planos de Assinatura
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

-- Tabela de Organizações (Empresas Clientes)
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

-- Tabela de Ambientes (Produção, Homologação, etc)
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

-- Tabela de Administradores SaaS
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

-- ============================================================================
-- 2. USUÁRIOS E ESTABELECIMENTOS
-- ============================================================================

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

-- Tabela de Estabelecimentos/Filiais
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

-- Tabela de Relação Usuário-Estabelecimento
CREATE TABLE IF NOT EXISTS user_establishments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  establishment_id uuid NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, establishment_id)
);

-- ============================================================================
-- 3. CADASTROS BÁSICOS
-- ============================================================================

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

-- Tabela de Parceiros de Negócio (Clientes/Fornecedores)
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

-- ============================================================================
-- 4. OPERAÇÕES
-- ============================================================================

-- Tabela de Pedidos/Ordens
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
  valor_mercadoria decimal(15,2) DEFAULT 0,
  valor_frete decimal(15,2) DEFAULT 0,
  valor_seguro decimal(15,2) DEFAULT 0,
  valor_outras_despesas decimal(15,2) DEFAULT 0,
  valor_total decimal(15,2) DEFAULT 0,
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

-- Tabela de Notas Fiscais (NFe)
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
  emitente_cnpj text,
  emitente_nome text,
  emitente_ie text,
  destinatario_cpf_cnpj text,
  destinatario_nome text,
  destinatario_ie text,
  destinatario_logradouro text,
  destinatario_numero text,
  destinatario_complemento text,
  destinatario_bairro text,
  destinatario_cidade text,
  destinatario_estado text,
  destinatario_cep text,
  destinatario_pais text DEFAULT 'Brasil',
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
  peso_bruto decimal(15,3) DEFAULT 0,
  peso_liquido decimal(15,3) DEFAULT 0,
  quantidade_volumes integer DEFAULT 0,
  xml_content text,
  xml_processado boolean DEFAULT false,
  status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'processada', 'em_coleta', 'coletada', 'em_transito', 'entregue', 'cancelada', 'rejeitada')),
  observacoes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, environment_id, numero, serie)
);

-- Tabela de Conhecimentos de Transporte Eletrônico (CTe)
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
  emitente_cnpj text,
  emitente_nome text,
  emitente_ie text,
  remetente_cpf_cnpj text,
  remetente_nome text,
  destinatario_cpf_cnpj text,
  destinatario_nome text,
  valor_servico decimal(15,2) DEFAULT 0,
  valor_receber decimal(15,2) DEFAULT 0,
  valor_mercadoria decimal(15,2) DEFAULT 0,
  peso_bruto decimal(15,3) DEFAULT 0,
  peso_cubado decimal(15,3) DEFAULT 0,
  quantidade_volumes integer DEFAULT 0,
  status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'autorizado', 'cancelado', 'denegado', 'rejeitado')),
  protocolo_autorizacao text,
  data_autorizacao timestamptz,
  xml_content text,
  xml_processado boolean DEFAULT false,
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
  cep text,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  estado text,
  pais text DEFAULT 'Brasil',
  contato_nome text,
  contato_telefone text,
  contato_email text,
  quantidade_volumes integer DEFAULT 0,
  peso_total decimal(15,3) DEFAULT 0,
  valor_total decimal(15,2) DEFAULT 0,
  status text DEFAULT 'solicitada' CHECK (status IN ('solicitada', 'agendada', 'em_coleta', 'coletada', 'cancelada', 'rejeitada')),
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

-- Tabela de Relação Coleta-Nota Fiscal
CREATE TABLE IF NOT EXISTS pickup_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup_id uuid NOT NULL REFERENCES pickups(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(pickup_id, invoice_id)
);

-- ============================================================================
-- 5. TABELAS DE FRETE E CÁLCULO
-- ============================================================================

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
  peso_minimo decimal(15,3) DEFAULT 0,
  peso_maximo decimal(15,3),
  valor_minimo decimal(15,2) DEFAULT 0,
  cubagem_fator decimal(10,2) DEFAULT 300,
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
  peso_inicial decimal(15,3),
  peso_final decimal(15,3),
  valor_inicial decimal(15,2),
  valor_final decimal(15,2),
  valor_fixo decimal(15,2) DEFAULT 0,
  valor_kg decimal(15,2) DEFAULT 0,
  valor_percentual decimal(5,2) DEFAULT 0,
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
  origem_cep text,
  origem_cidade text,
  origem_estado text,
  destino_cep text,
  destino_cidade text,
  destino_estado text,
  peso decimal(15,3) DEFAULT 0,
  valor_mercadoria decimal(15,2) DEFAULT 0,
  quantidade_volumes integer DEFAULT 0,
  resultados jsonb DEFAULT '[]'::jsonb,
  melhor_opcao_id uuid,
  status text DEFAULT 'processando' CHECK (status IN ('processando', 'concluida', 'erro')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, environment_id, numero_cotacao)
);

-- ============================================================================
-- 6. CONFIGURAÇÕES E INTEGRAÇÕES
-- ============================================================================

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

-- ============================================================================
-- 7. DADOS AUXILIARES
-- ============================================================================

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

-- ============================================================================
-- 8. ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índices de Organizations e Environments
CREATE INDEX IF NOT EXISTS idx_saas_organizations_codigo ON saas_organizations(codigo);
CREATE INDEX IF NOT EXISTS idx_saas_organizations_cnpj ON saas_organizations(cnpj);
CREATE INDEX IF NOT EXISTS idx_saas_organizations_status ON saas_organizations(status);
CREATE INDEX IF NOT EXISTS idx_saas_environments_organization ON saas_environments(organization_id);
CREATE INDEX IF NOT EXISTS idx_saas_environments_codigo ON saas_environments(organization_id, codigo);

-- Índices de Users e Establishments
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_users_ativo ON users(ativo) WHERE ativo = true;
CREATE INDEX IF NOT EXISTS idx_establishments_organization ON establishments(organization_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_establishments_codigo ON establishments(organization_id, environment_id, codigo);
CREATE INDEX IF NOT EXISTS idx_establishments_cnpj ON establishments(cnpj) WHERE cnpj IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_establishments_user ON user_establishments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_establishments_establishment ON user_establishments(establishment_id);

-- Índices de Cadastros
CREATE INDEX IF NOT EXISTS idx_carriers_organization ON carriers(organization_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_carriers_codigo ON carriers(organization_id, environment_id, codigo);
CREATE INDEX IF NOT EXISTS idx_carriers_cnpj ON carriers(cnpj) WHERE cnpj IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_business_partners_organization ON business_partners(organization_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_business_partners_codigo ON business_partners(organization_id, environment_id, codigo);
CREATE INDEX IF NOT EXISTS idx_business_partners_tipo ON business_partners(tipo);
CREATE INDEX IF NOT EXISTS idx_rejection_reasons_organization ON rejection_reasons(organization_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_occurrences_organization ON occurrences(organization_id, environment_id);

-- Índices de Operações
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

-- Índices de Frete
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

-- Índices de Configurações
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

-- Índices de Dados Auxiliares
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

-- ============================================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE saas_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_environments ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE rejection_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE ctes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickups ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE freight_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE freight_rate_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE freight_rate_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE additional_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE restricted_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE freight_quotes ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE states ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE white_label_config ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para leitura pública (necessárias para login)
CREATE POLICY "Public read saas_organizations for login" ON saas_organizations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read saas_environments for login" ON saas_environments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read saas_plans" ON saas_plans FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read users for login" ON users FOR SELECT TO anon USING (true);
CREATE POLICY "Users can read own data" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read establishments for login" ON establishments FOR SELECT TO anon USING (true);
CREATE POLICY "Users can read establishments in their org/env" ON establishments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can read own establishment assignments" ON user_establishments FOR SELECT TO authenticated USING (true);

-- Políticas RLS para dados públicos
CREATE POLICY "Public read countries" ON countries FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read states" ON states FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read cities" ON cities FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read change_logs" ON change_logs FOR SELECT TO anon, authenticated USING (publicado = true);

-- Políticas RLS genéricas para tabelas multi-tenant
CREATE POLICY "Users can read carriers in their org/env" ON carriers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can read business_partners in their org/env" ON business_partners FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can read rejection_reasons in their org/env" ON rejection_reasons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can read occurrences in their org/env" ON occurrences FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can read orders in their org/env" ON orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can read invoices in their org/env" ON invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can read ctes in their org/env" ON ctes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can read pickups in their org/env" ON pickups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can read pickup_invoices" ON pickup_invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can read freight_rates in their org/env" ON freight_rates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can read freight_rate_values" ON freight_rate_values FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can read freight_rate_cities" ON freight_rate_cities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can read additional_fees in their org/env" ON additional_fees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can read restricted_items in their org/env" ON restricted_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can read freight_quotes in their org/env" ON freight_quotes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can read whatsapp_config in their org/env" ON whatsapp_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can read whatsapp_transactions in their org/env" ON whatsapp_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can read openai_config in their org/env" ON openai_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can read openai_transactions in their org/env" ON openai_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can read google_maps_config in their org/env" ON google_maps_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can read google_maps_transactions in their org/env" ON google_maps_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can read nps_config in their org/env" ON nps_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can read nps_surveys in their org/env" ON nps_surveys FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can read nps_responses in their org/env" ON nps_responses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can read email_outgoing_config in their org/env" ON email_outgoing_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can read holidays in their org/env" ON holidays FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can read api_keys in their org/env" ON api_keys FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can read licenses for their org" ON licenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can read white_label_config for their org" ON white_label_config FOR SELECT TO authenticated USING (true);

-- ============================================================================
-- 10. TRIGGERS E FUNÇÕES
-- ============================================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_saas_organizations_updated_at BEFORE UPDATE ON saas_organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saas_environments_updated_at BEFORE UPDATE ON saas_environments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saas_plans_updated_at BEFORE UPDATE ON saas_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_establishments_updated_at BEFORE UPDATE ON establishments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_carriers_updated_at BEFORE UPDATE ON carriers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_business_partners_updated_at BEFORE UPDATE ON business_partners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rejection_reasons_updated_at BEFORE UPDATE ON rejection_reasons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_occurrences_updated_at BEFORE UPDATE ON occurrences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ctes_updated_at BEFORE UPDATE ON ctes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pickups_updated_at BEFORE UPDATE ON pickups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_freight_rates_updated_at BEFORE UPDATE ON freight_rates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_freight_rate_values_updated_at BEFORE UPDATE ON freight_rate_values FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_additional_fees_updated_at BEFORE UPDATE ON additional_fees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_restricted_items_updated_at BEFORE UPDATE ON restricted_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_freight_quotes_updated_at BEFORE UPDATE ON freight_quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whatsapp_config_updated_at BEFORE UPDATE ON whatsapp_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_openai_config_updated_at BEFORE UPDATE ON openai_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_google_maps_config_updated_at BEFORE UPDATE ON google_maps_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nps_config_updated_at BEFORE UPDATE ON nps_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_outgoing_config_updated_at BEFORE UPDATE ON email_outgoing_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_countries_updated_at BEFORE UPDATE ON countries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_states_updated_at BEFORE UPDATE ON states FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cities_updated_at BEFORE UPDATE ON cities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_holidays_updated_at BEFORE UPDATE ON holidays FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_change_logs_updated_at BEFORE UPDATE ON change_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_licenses_updated_at BEFORE UPDATE ON licenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_white_label_config_updated_at BEFORE UPDATE ON white_label_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para validar credenciais do usuário
CREATE OR REPLACE FUNCTION validate_user_credentials(
  p_email text,
  p_senha text
)
RETURNS TABLE (
  user_id uuid,
  organization_id uuid,
  environment_id uuid,
  nome text,
  tipo text,
  bloqueado boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.organization_id,
    u.environment_id,
    u.nome,
    u.tipo,
    u.bloqueado
  FROM users u
  WHERE u.email = p_email
    AND u.senha_hash = encode(digest(p_senha, 'sha256'), 'hex')
    AND u.ativo = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário está bloqueado
CREATE OR REPLACE FUNCTION check_user_blocked(
  p_email text
)
RETURNS boolean AS $$
DECLARE
  v_bloqueado boolean;
  v_tentativas integer;
BEGIN
  SELECT bloqueado, tentativas_login
  INTO v_bloqueado, v_tentativas
  FROM users
  WHERE email = p_email;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_tentativas >= 5 AND NOT v_bloqueado THEN
    UPDATE users
    SET bloqueado = true
    WHERE email = p_email;
    RETURN true;
  END IF;

  RETURN v_bloqueado;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para incrementar tentativas de login
CREATE OR REPLACE FUNCTION increment_login_attempts(
  p_email text
)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET tentativas_login = tentativas_login + 1,
      updated_at = now()
  WHERE email = p_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para resetar tentativas de login
CREATE OR REPLACE FUNCTION reset_login_attempts(
  p_email text,
  p_ip text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET tentativas_login = 0,
      ultimo_login = now(),
      ultimo_ip = COALESCE(p_ip, ultimo_ip),
      updated_at = now()
  WHERE email = p_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para retornar organizações e ambientes do usuário
CREATE OR REPLACE FUNCTION get_user_organizations_environments(
  p_email text
)
RETURNS TABLE (
  organization_id uuid,
  organization_codigo text,
  organization_nome text,
  environment_id uuid,
  environment_codigo text,
  environment_nome text,
  environment_tipo text
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    o.id,
    o.codigo,
    o.nome,
    e.id,
    e.codigo,
    e.nome,
    e.tipo
  FROM users u
  JOIN saas_organizations o ON o.id = u.organization_id
  JOIN saas_environments e ON e.id = u.environment_id
  WHERE u.email = p_email
    AND u.ativo = true
    AND o.status = 'ativo'
    AND e.status = 'ativo'
  ORDER BY o.nome, e.tipo, e.nome;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para retornar estabelecimentos do usuário
CREATE OR REPLACE FUNCTION get_user_establishments(
  p_user_id uuid,
  p_organization_id uuid,
  p_environment_id uuid
)
RETURNS TABLE (
  establishment_id uuid,
  codigo text,
  nome_fantasia text,
  is_default boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.codigo,
    e.nome_fantasia,
    COALESCE(ue.is_default, false) as is_default
  FROM establishments e
  LEFT JOIN user_establishments ue ON ue.establishment_id = e.id AND ue.user_id = p_user_id
  WHERE e.organization_id = p_organization_id
    AND e.environment_id = p_environment_id
    AND e.ativo = true
  ORDER BY is_default DESC, e.codigo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 11. DADOS INICIAIS
-- ============================================================================

-- Inserir Plano Demonstração
INSERT INTO saas_plans (nome, descricao, valor_mensal, max_users, max_establishments, features, ativo)
VALUES
  ('Demonstração', 'Plano gratuito para demonstração do sistema', 0.00, 5, 3, '{"modulos": ["pedidos", "notas", "ctes", "coletas", "frete"], "integrações": ["whatsapp", "email"], "suporte": "email"}'::jsonb, true)
ON CONFLICT DO NOTHING;

-- Inserir Organização Demonstração
INSERT INTO saas_organizations (id, codigo, nome, cnpj, email, status, plan_id)
SELECT
  gen_random_uuid(),
  'DEMO001',
  'Empresa Demonstração',
  '00.000.000/0001-00',
  'contato@demo.com',
  'ativo',
  (SELECT id FROM saas_plans WHERE nome = 'Demonstração' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM saas_organizations WHERE codigo = 'DEMO001');

-- Inserir Ambiente Produção
INSERT INTO saas_environments (id, organization_id, codigo, nome, tipo, status)
SELECT
  gen_random_uuid(),
  (SELECT id FROM saas_organizations WHERE codigo = 'DEMO001' LIMIT 1),
  'PROD',
  'Produção',
  'producao',
  'ativo'
WHERE NOT EXISTS (
  SELECT 1 FROM saas_environments
  WHERE organization_id = (SELECT id FROM saas_organizations WHERE codigo = 'DEMO001' LIMIT 1)
  AND codigo = 'PROD'
);

-- Inserir Admin (senha: Demo@123)
INSERT INTO users (
  organization_id,
  environment_id,
  email,
  senha_hash,
  nome,
  tipo,
  ativo
)
SELECT
  (SELECT id FROM saas_organizations WHERE codigo = 'DEMO001' LIMIT 1),
  (SELECT id FROM saas_environments WHERE organization_id = (SELECT id FROM saas_organizations WHERE codigo = 'DEMO001' LIMIT 1) AND codigo = 'PROD' LIMIT 1),
  'admin@demo.com',
  encode(digest('Demo@123', 'sha256'), 'hex'),
  'Administrador Demo',
  'admin',
  true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@demo.com');

-- Inserir Estabelecimento 0001
INSERT INTO establishments (
  organization_id,
  environment_id,
  codigo,
  nome_fantasia,
  razao_social,
  cnpj,
  tipo,
  ativo
)
SELECT
  (SELECT id FROM saas_organizations WHERE codigo = 'DEMO001' LIMIT 1),
  (SELECT id FROM saas_environments WHERE organization_id = (SELECT id FROM saas_organizations WHERE codigo = 'DEMO001' LIMIT 1) AND codigo = 'PROD' LIMIT 1),
  '0001',
  'Matriz Demonstração',
  'Empresa Demonstração LTDA',
  '00.000.000/0001-00',
  'matriz',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM establishments
  WHERE organization_id = (SELECT id FROM saas_organizations WHERE codigo = 'DEMO001' LIMIT 1)
  AND environment_id = (SELECT id FROM saas_environments WHERE organization_id = (SELECT id FROM saas_organizations WHERE codigo = 'DEMO001' LIMIT 1) AND codigo = 'PROD' LIMIT 1)
  AND codigo = '0001'
);

-- Associar usuário ao estabelecimento
INSERT INTO user_establishments (user_id, establishment_id, is_default)
SELECT
  (SELECT id FROM users WHERE email = 'admin@demo.com' LIMIT 1),
  (SELECT id FROM establishments WHERE codigo = '0001'
   AND organization_id = (SELECT id FROM saas_organizations WHERE codigo = 'DEMO001' LIMIT 1) LIMIT 1),
  true
WHERE NOT EXISTS (
  SELECT 1 FROM user_establishments
  WHERE user_id = (SELECT id FROM users WHERE email = 'admin@demo.com' LIMIT 1)
);

-- Inserir País Brasil
INSERT INTO countries (codigo, nome, nome_oficial, sigla_iso2, sigla_iso3, codigo_telefone, continente)
VALUES ('BR', 'Brasil', 'República Federativa do Brasil', 'BR', 'BRA', '+55', 'América do Sul')
ON CONFLICT (codigo) DO NOTHING;

-- Inserir Estados Brasileiros
INSERT INTO states (country_id, codigo, nome, sigla, regiao)
SELECT
  (SELECT id FROM countries WHERE codigo = 'BR' LIMIT 1),
  codigo,
  nome,
  sigla,
  regiao
FROM (VALUES
  ('SP', 'São Paulo', 'SP', 'Sudeste'),
  ('RJ', 'Rio de Janeiro', 'RJ', 'Sudeste'),
  ('MG', 'Minas Gerais', 'MG', 'Sudeste'),
  ('RS', 'Rio Grande do Sul', 'RS', 'Sul'),
  ('PR', 'Paraná', 'PR', 'Sul'),
  ('SC', 'Santa Catarina', 'SC', 'Sul'),
  ('BA', 'Bahia', 'BA', 'Nordeste'),
  ('PE', 'Pernambuco', 'PE', 'Nordeste'),
  ('CE', 'Ceará', 'CE', 'Nordeste')
) AS t(codigo, nome, sigla, regiao)
ON CONFLICT (country_id, codigo) DO NOTHING;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================