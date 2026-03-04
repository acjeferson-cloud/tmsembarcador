/*
  # Criar tabelas completas para sistema NPS

  1. Novas Tabelas
    - `nps_pesquisas_cliente` - Pesquisas NPS enviadas aos clientes
      - id (uuid, primary key)
      - organization_id (uuid, foreign key)
      - environment_id (uuid, foreign key)
      - pedido_id (uuid) - ID do pedido relacionado
      - cliente_email (text)
      - cliente_nome (text)
      - nota (integer) - Nota de 0 a 10
      - comentario (text)
      - data_envio (timestamptz)
      - data_resposta (timestamptz)
      - token (text) - Token único para resposta
      - status (text) - pendente, respondido, expirado
      - created_at (timestamptz)

    - `nps_avaliacoes_internas` - Avaliações internas de transportadores
      - id (uuid, primary key)
      - organization_id (uuid, foreign key)
      - environment_id (uuid, foreign key)
      - transportador_id (uuid)
      - pedido_id (uuid)
      - nota (integer) - Nota de 0 a 10
      - criterios (jsonb) - Critérios avaliados
      - avaliador_id (uuid)
      - comentario (text)
      - created_at (timestamptz)

    - `nps_historico_envios` - Histórico de envios de pesquisas
      - id (uuid, primary key)
      - organization_id (uuid, foreign key)
      - environment_id (uuid, foreign key)
      - pesquisa_id (uuid)
      - tipo_envio (text) - email, whatsapp, sms
      - destinatario (text)
      - status (text) - enviado, erro, entregue
      - mensagem_erro (text)
      - data_envio (timestamptz)
      - created_at (timestamptz)

  2. Segurança
    - Enable RLS em todas as tabelas
    - Policies para acesso autenticado com contexto
*/

-- Criar tabela nps_pesquisas_cliente
CREATE TABLE IF NOT EXISTS nps_pesquisas_cliente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES saas_organizations(id),
  environment_id uuid REFERENCES saas_environments(id),
  pedido_id uuid,
  cliente_email text,
  cliente_nome text,
  nota integer CHECK (nota >= 0 AND nota <= 10),
  comentario text,
  data_envio timestamptz DEFAULT now(),
  data_resposta timestamptz,
  token text UNIQUE NOT NULL,
  status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'respondido', 'expirado')),
  created_at timestamptz DEFAULT now()
);

-- Criar tabela nps_avaliacoes_internas
CREATE TABLE IF NOT EXISTS nps_avaliacoes_internas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES saas_organizations(id),
  environment_id uuid REFERENCES saas_environments(id),
  transportador_id uuid REFERENCES carriers(id),
  pedido_id uuid REFERENCES orders(id),
  nota integer CHECK (nota >= 0 AND nota <= 10),
  criterios jsonb DEFAULT '{}',
  avaliador_id uuid REFERENCES users(id),
  comentario text,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela nps_historico_envios
CREATE TABLE IF NOT EXISTS nps_historico_envios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES saas_organizations(id),
  environment_id uuid REFERENCES saas_environments(id),
  pesquisa_id uuid REFERENCES nps_pesquisas_cliente(id) ON DELETE CASCADE,
  tipo_envio text CHECK (tipo_envio IN ('email', 'whatsapp', 'sms')),
  destinatario text NOT NULL,
  status text DEFAULT 'enviado' CHECK (status IN ('enviado', 'erro', 'entregue', 'lido')),
  mensagem_erro text,
  data_envio timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_nps_pesquisas_org_env ON nps_pesquisas_cliente(organization_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_nps_pesquisas_token ON nps_pesquisas_cliente(token);
CREATE INDEX IF NOT EXISTS idx_nps_pesquisas_status ON nps_pesquisas_cliente(status);
CREATE INDEX IF NOT EXISTS idx_nps_pesquisas_pedido ON nps_pesquisas_cliente(pedido_id);
CREATE INDEX IF NOT EXISTS idx_nps_avaliacoes_org_env ON nps_avaliacoes_internas(organization_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_nps_avaliacoes_transportador ON nps_avaliacoes_internas(transportador_id);
CREATE INDEX IF NOT EXISTS idx_nps_historico_org_env ON nps_historico_envios(organization_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_nps_historico_pesquisa ON nps_historico_envios(pesquisa_id);

-- Habilitar RLS
ALTER TABLE nps_pesquisas_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE nps_avaliacoes_internas ENABLE ROW LEVEL SECURITY;
ALTER TABLE nps_historico_envios ENABLE ROW LEVEL SECURITY;

-- Policies para nps_pesquisas_cliente
CREATE POLICY "Users can view NPS surveys from their org/env"
  ON nps_pesquisas_cliente FOR SELECT
  TO authenticated
  USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Anon can view NPS surveys with context"
  ON nps_pesquisas_cliente FOR SELECT
  TO anon
  USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Public can view NPS survey by token"
  ON nps_pesquisas_cliente FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Users can insert NPS surveys in their org/env"
  ON nps_pesquisas_cliente FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Anon can insert NPS surveys with context"
  ON nps_pesquisas_cliente FOR INSERT
  TO anon
  WITH CHECK (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Users can update NPS surveys in their org/env"
  ON nps_pesquisas_cliente FOR UPDATE
  TO authenticated
  USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  )
  WITH CHECK (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Anon can update NPS surveys with context"
  ON nps_pesquisas_cliente FOR UPDATE
  TO anon
  USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  )
  WITH CHECK (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Public can update NPS survey response by token"
  ON nps_pesquisas_cliente FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Policies para nps_avaliacoes_internas
CREATE POLICY "Users can view internal evaluations from their org/env"
  ON nps_avaliacoes_internas FOR SELECT
  TO authenticated
  USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Anon can view internal evaluations with context"
  ON nps_avaliacoes_internas FOR SELECT
  TO anon
  USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Users can insert internal evaluations in their org/env"
  ON nps_avaliacoes_internas FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Anon can insert internal evaluations with context"
  ON nps_avaliacoes_internas FOR INSERT
  TO anon
  WITH CHECK (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Users can update internal evaluations in their org/env"
  ON nps_avaliacoes_internas FOR UPDATE
  TO authenticated
  USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  )
  WITH CHECK (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Anon can update internal evaluations with context"
  ON nps_avaliacoes_internas FOR UPDATE
  TO anon
  USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  )
  WITH CHECK (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

-- Policies para nps_historico_envios
CREATE POLICY "Users can view send history from their org/env"
  ON nps_historico_envios FOR SELECT
  TO authenticated
  USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Anon can view send history with context"
  ON nps_historico_envios FOR SELECT
  TO anon
  USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Users can insert send history in their org/env"
  ON nps_historico_envios FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Anon can insert send history with context"
  ON nps_historico_envios FOR INSERT
  TO anon
  WITH CHECK (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );
