/*
  # Criar tabelas para itens de pedidos e status de entrega

  1. Novas Tabelas
    - `order_items` - Itens/produtos de cada pedido
      - id (uuid, primary key)
      - order_id (uuid, foreign key)
      - organization_id (uuid, foreign key)
      - environment_id (uuid, foreign key)
      - produto_codigo (text)
      - produto_descricao (text)
      - quantidade (numeric)
      - unidade (text)
      - valor_unitario (numeric)
      - valor_total (numeric)
      - peso (numeric)
      - volume (numeric)
      - ncm (text)
      - created_at (timestamptz)
      - updated_at (timestamptz)

    - `order_delivery_status` - Histórico de status de entrega dos pedidos
      - id (uuid, primary key)
      - order_id (uuid, foreign key)
      - organization_id (uuid, foreign key)
      - environment_id (uuid, foreign key)
      - status (text) - Status da entrega
      - descricao (text) - Descrição do status
      - localizacao (text) - Localização atual
      - data_hora (timestamptz) - Data e hora do evento
      - latitude (numeric)
      - longitude (numeric)
      - observacao (text)
      - usuario_id (uuid) - Quem registrou
      - created_at (timestamptz)

  2. Segurança
    - Enable RLS em todas as tabelas
    - Policies para acesso autenticado com contexto
*/

-- Criar tabela order_items
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES saas_organizations(id),
  environment_id uuid REFERENCES saas_environments(id),
  produto_codigo text,
  produto_descricao text NOT NULL,
  quantidade numeric(15,4) DEFAULT 1,
  unidade text DEFAULT 'UN',
  valor_unitario numeric(15,2) DEFAULT 0,
  valor_total numeric(15,2) DEFAULT 0,
  peso numeric(15,3),
  volume numeric(15,3),
  ncm text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela order_delivery_status
CREATE TABLE IF NOT EXISTS order_delivery_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES saas_organizations(id),
  environment_id uuid REFERENCES saas_environments(id),
  status text NOT NULL CHECK (status IN (
    'criado',
    'aguardando_coleta',
    'em_transito',
    'em_rota_entrega',
    'entregue',
    'cancelado',
    'com_ocorrencia',
    'devolvido',
    'extraviado'
  )),
  descricao text,
  localizacao text,
  data_hora timestamptz DEFAULT now(),
  latitude numeric(10,8),
  longitude numeric(11,8),
  observacao text,
  usuario_id uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_org_env ON order_items(organization_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_order_delivery_status_order ON order_delivery_status(order_id);
CREATE INDEX IF NOT EXISTS idx_order_delivery_status_org_env ON order_delivery_status(organization_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_order_delivery_status_data ON order_delivery_status(data_hora DESC);
CREATE INDEX IF NOT EXISTS idx_order_delivery_status_status ON order_delivery_status(status);

-- Habilitar RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_delivery_status ENABLE ROW LEVEL SECURITY;

-- Policies para order_items
CREATE POLICY "Users can view order items from their org/env"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Anon can view order items with context"
  ON order_items FOR SELECT
  TO anon
  USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Users can insert order items in their org/env"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Anon can insert order items with context"
  ON order_items FOR INSERT
  TO anon
  WITH CHECK (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Users can update order items in their org/env"
  ON order_items FOR UPDATE
  TO authenticated
  USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  )
  WITH CHECK (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Anon can update order items with context"
  ON order_items FOR UPDATE
  TO anon
  USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  )
  WITH CHECK (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Users can delete order items in their org/env"
  ON order_items FOR DELETE
  TO authenticated
  USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Anon can delete order items with context"
  ON order_items FOR DELETE
  TO anon
  USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

-- Policies para order_delivery_status
CREATE POLICY "Users can view delivery status from their org/env"
  ON order_delivery_status FOR SELECT
  TO authenticated
  USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Anon can view delivery status with context"
  ON order_delivery_status FOR SELECT
  TO anon
  USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Users can insert delivery status in their org/env"
  ON order_delivery_status FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Anon can insert delivery status with context"
  ON order_delivery_status FOR INSERT
  TO anon
  WITH CHECK (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Users can update delivery status in their org/env"
  ON order_delivery_status FOR UPDATE
  TO authenticated
  USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  )
  WITH CHECK (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

CREATE POLICY "Anon can update delivery status with context"
  ON order_delivery_status FOR UPDATE
  TO anon
  USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  )
  WITH CHECK (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND environment_id = current_setting('app.environment_id', true)::uuid
  );

-- Trigger para atualizar updated_at em order_items
CREATE OR REPLACE FUNCTION update_order_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_items_updated_at
  BEFORE UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_order_items_updated_at();
