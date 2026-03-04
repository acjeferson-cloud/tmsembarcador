/*
  # Criar tabelas para Notas Fiscais Eletrônicas (NF-e)

  1. Novas Tabelas
    - `invoices_nfe` - Tabela principal de NF-e
      - id (uuid, primary key)
      - organization_id (uuid, foreign key)
      - environment_id (uuid, foreign key)
      - numero (text) - Número da NF-e
      - serie (text) - Série da NF-e
      - chave_acesso (text) - Chave de acesso de 44 dígitos
      - data_emissao (timestamptz) - Data de emissão
      - natureza_operacao (text) - Natureza da operação
      - modelo (text) - Modelo do documento (55, 65, etc)
      - emitente_cnpj (text)
      - emitente_nome (text)
      - destinatario_cnpj (text)
      - destinatario_nome (text)
      - valor_total (numeric)
      - valor_produtos (numeric)
      - valor_icms (numeric)
      - valor_ipi (numeric)
      - valor_frete (numeric)
      - situacao (text) - Situação da NF-e
      - xml_content (text) - Conteúdo XML completo
      - created_at (timestamptz)
      - updated_at (timestamptz)

    - `invoices_nfe_customers` - Dados detalhados do destinatário
      - id (uuid, primary key)
      - invoice_nfe_id (uuid, foreign key)
      - organization_id (uuid)
      - environment_id (uuid)
      - cnpj_cpf (text)
      - razao_social (text)
      - nome_fantasia (text)
      - inscricao_estadual (text)
      - logradouro (text)
      - numero (text)
      - complemento (text)
      - bairro (text)
      - cidade (text)
      - estado (text)
      - cep (text)
      - telefone (text)
      - email (text)
      - created_at (timestamptz)

    - `invoices_nfe_products` - Produtos/itens da NF-e
      - id (uuid, primary key)
      - invoice_nfe_id (uuid, foreign key)
      - organization_id (uuid)
      - environment_id (uuid)
      - numero_item (integer)
      - codigo_produto (text)
      - descricao (text)
      - ncm (text)
      - cfop (text)
      - unidade (text)
      - quantidade (numeric)
      - valor_unitario (numeric)
      - valor_total (numeric)
      - valor_desconto (numeric)
      - created_at (timestamptz)

  2. Segurança
    - Enable RLS em todas as tabelas
    - Policies para acesso autenticado com contexto
*/

-- Criar tabela invoices_nfe
CREATE TABLE IF NOT EXISTS invoices_nfe (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES saas_organizations(id),
  environment_id uuid REFERENCES saas_environments(id),
  numero text NOT NULL,
  serie text,
  chave_acesso text UNIQUE,
  data_emissao timestamptz,
  natureza_operacao text,
  modelo text DEFAULT '55',
  emitente_cnpj text,
  emitente_nome text,
  destinatario_cnpj text,
  destinatario_nome text,
  valor_total numeric(15,2) DEFAULT 0,
  valor_produtos numeric(15,2) DEFAULT 0,
  valor_icms numeric(15,2) DEFAULT 0,
  valor_ipi numeric(15,2) DEFAULT 0,
  valor_frete numeric(15,2) DEFAULT 0,
  situacao text DEFAULT 'pendente',
  xml_content text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela invoices_nfe_customers
CREATE TABLE IF NOT EXISTS invoices_nfe_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_nfe_id uuid REFERENCES invoices_nfe(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES saas_organizations(id),
  environment_id uuid REFERENCES saas_environments(id),
  cnpj_cpf text,
  razao_social text,
  nome_fantasia text,
  inscricao_estadual text,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  estado text,
  cep text,
  telefone text,
  email text,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela invoices_nfe_products
CREATE TABLE IF NOT EXISTS invoices_nfe_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_nfe_id uuid REFERENCES invoices_nfe(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES saas_organizations(id),
  environment_id uuid REFERENCES saas_environments(id),
  numero_item integer NOT NULL,
  codigo_produto text,
  descricao text NOT NULL,
  ncm text,
  cfop text,
  unidade text,
  quantidade numeric(15,4) DEFAULT 1,
  valor_unitario numeric(15,2) DEFAULT 0,
  valor_total numeric(15,2) DEFAULT 0,
  valor_desconto numeric(15,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_invoices_nfe_org_env ON invoices_nfe(organization_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_invoices_nfe_chave ON invoices_nfe(chave_acesso);
CREATE INDEX IF NOT EXISTS idx_invoices_nfe_data ON invoices_nfe(data_emissao);
CREATE INDEX IF NOT EXISTS idx_invoices_nfe_customers_org_env ON invoices_nfe_customers(organization_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_invoices_nfe_products_org_env ON invoices_nfe_products(organization_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_invoices_nfe_products_invoice ON invoices_nfe_products(invoice_nfe_id);

-- Habilitar RLS
ALTER TABLE invoices_nfe ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices_nfe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices_nfe_products ENABLE ROW LEVEL SECURITY;

-- Policies para invoices_nfe
CREATE POLICY "Users can view NF-e from their org/env"
  ON invoices_nfe FOR SELECT
  TO authenticated
  USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Anon can view NF-e with context"
  ON invoices_nfe FOR SELECT
  TO anon
  USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Users can insert NF-e in their org/env"
  ON invoices_nfe FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Anon can insert NF-e with context"
  ON invoices_nfe FOR INSERT
  TO anon
  WITH CHECK (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Users can update NF-e in their org/env"
  ON invoices_nfe FOR UPDATE
  TO authenticated
  USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  )
  WITH CHECK (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Anon can update NF-e with context"
  ON invoices_nfe FOR UPDATE
  TO anon
  USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  )
  WITH CHECK (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Users can delete NF-e in their org/env"
  ON invoices_nfe FOR DELETE
  TO authenticated
  USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Anon can delete NF-e with context"
  ON invoices_nfe FOR DELETE
  TO anon
  USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

-- Policies para invoices_nfe_customers
CREATE POLICY "Users can view NF-e customers from their org/env"
  ON invoices_nfe_customers FOR SELECT
  TO authenticated
  USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Anon can view NF-e customers with context"
  ON invoices_nfe_customers FOR SELECT
  TO anon
  USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Users can insert NF-e customers in their org/env"
  ON invoices_nfe_customers FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Anon can insert NF-e customers with context"
  ON invoices_nfe_customers FOR INSERT
  TO anon
  WITH CHECK (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Users can delete NF-e customers in their org/env"
  ON invoices_nfe_customers FOR DELETE
  TO authenticated
  USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Anon can delete NF-e customers with context"
  ON invoices_nfe_customers FOR DELETE
  TO anon
  USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

-- Policies para invoices_nfe_products
CREATE POLICY "Users can view NF-e products from their org/env"
  ON invoices_nfe_products FOR SELECT
  TO authenticated
  USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Anon can view NF-e products with context"
  ON invoices_nfe_products FOR SELECT
  TO anon
  USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Users can insert NF-e products in their org/env"
  ON invoices_nfe_products FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Anon can insert NF-e products with context"
  ON invoices_nfe_products FOR INSERT
  TO anon
  WITH CHECK (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Users can delete NF-e products in their org/env"
  ON invoices_nfe_products FOR DELETE
  TO authenticated
  USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Anon can delete NF-e products with context"
  ON invoices_nfe_products FOR DELETE
  TO anon
  USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );
