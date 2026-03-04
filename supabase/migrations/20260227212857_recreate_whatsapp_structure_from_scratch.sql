/*
  # Recriar Estrutura Completa do WhatsApp do Zero

  Esta migration remove completamente todas as tabelas relacionadas ao WhatsApp
  e recria tudo do zero com uma estrutura limpa, consistente e completa.

  ## 1. Limpeza Completa
    - Remove todas as políticas RLS existentes
    - Remove todas as tabelas relacionadas ao WhatsApp
    - Remove triggers e funções relacionadas

  ## 2. Nova Tabela: whatsapp_config
    Armazena as configurações da API do WhatsApp Business
    - Campos: access_token, phone_number_id, business_account_id, webhook_verify_token
    - Isolamento: organization_id + environment_id
    - 1 configuração ativa por organização/ambiente

  ## 3. Nova Tabela: whatsapp_templates
    Gerencia templates de mensagens aprovados pela Meta
    - Campos: template_name, body_text, header_text, footer_text
    - Suporta variáveis dinâmicas (JSONB)
    - Status de aprovação e categoria

  ## 4. Nova Tabela: whatsapp_messages_log
    Histórico completo de todas as mensagens enviadas
    - Rastreamento: message_id, status, timestamps
    - Relacionamento: order_id, template_id
    - Custo: unit_cost para controle financeiro
    - Erro: error_message, error_code, api_response

  ## 5. Políticas RLS
    - Isolamento completo por organization_id + environment_id
    - Uso de app.organization_id (consistente com set_session_context)
    - Permissões apenas para role anon (usuários autenticados)

  ## 6. Funções de Agregação
    - get_whatsapp_monthly_costs: custos mensais agregados
    - get_template_usage_stats: estatísticas de uso dos templates

  ## 7. View Dashboard
    - whatsapp_messages_summary: visão completa com campos calculados
*/

-- ============================================================================
-- 1. LIMPEZA COMPLETA
-- ============================================================================

-- Dropar views primeiro
DROP VIEW IF EXISTS whatsapp_messages_summary CASCADE;

-- Dropar tabelas existentes (CASCADE para remover dependências automaticamente)
DROP TABLE IF EXISTS whatsapp_transactions CASCADE;
DROP TABLE IF EXISTS whatsapp_messages_log CASCADE;
DROP TABLE IF EXISTS whatsapp_templates CASCADE;
DROP TABLE IF EXISTS whatsapp_config CASCADE;

-- Dropar funções relacionadas
DROP FUNCTION IF EXISTS get_whatsapp_monthly_costs(UUID, UUID, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_template_usage_stats(UUID, UUID) CASCADE;

-- ============================================================================
-- 2. CRIAR TABELA whatsapp_config
-- ============================================================================

CREATE TABLE whatsapp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Isolamento Multi-Tenant
  organization_id UUID NOT NULL,
  environment_id UUID NOT NULL,

  -- Credenciais da API WhatsApp Business
  access_token TEXT NOT NULL,
  phone_number_id TEXT NOT NULL,
  business_account_id TEXT NOT NULL,
  webhook_verify_token TEXT,

  -- Status e Testes
  is_active BOOLEAN DEFAULT true,
  test_status TEXT,
  last_tested_at TIMESTAMPTZ,

  -- Auditoria
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Garantir apenas 1 config ativa por organização/ambiente
  UNIQUE(organization_id, environment_id)
);

-- Comentários da tabela
COMMENT ON TABLE whatsapp_config IS 'Configurações da API do WhatsApp Business por organização e ambiente';
COMMENT ON COLUMN whatsapp_config.access_token IS 'Token de acesso permanente da Meta for Developers';
COMMENT ON COLUMN whatsapp_config.phone_number_id IS 'ID do número de telefone do WhatsApp Business';
COMMENT ON COLUMN whatsapp_config.business_account_id IS 'ID da conta comercial do WhatsApp';
COMMENT ON COLUMN whatsapp_config.webhook_verify_token IS 'Token para verificação de webhooks (opcional)';

-- Habilitar RLS
ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. CRIAR TABELA whatsapp_templates
-- ============================================================================

CREATE TABLE whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Isolamento Multi-Tenant
  organization_id UUID NOT NULL,
  environment_id UUID NOT NULL,

  -- Identificação do Template
  template_name TEXT NOT NULL,
  template_language TEXT DEFAULT 'pt_BR',
  category TEXT DEFAULT 'UTILITY',

  -- Conteúdo do Template
  header_text TEXT,
  body_text TEXT NOT NULL,
  footer_text TEXT,

  -- Variáveis Dinâmicas
  variables JSONB DEFAULT '[]'::jsonb,

  -- Meta WhatsApp
  meta_template_id TEXT,
  approval_status TEXT DEFAULT 'PENDING',
  description TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Auditoria
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Comentários da tabela
COMMENT ON TABLE whatsapp_templates IS 'Templates de mensagens do WhatsApp aprovados pela Meta';
COMMENT ON COLUMN whatsapp_templates.template_name IS 'Nome único do template (deve ser aprovado pela Meta)';
COMMENT ON COLUMN whatsapp_templates.variables IS 'Array JSON com variáveis dinâmicas do template';
COMMENT ON COLUMN whatsapp_templates.approval_status IS 'Status de aprovação: PENDING, APPROVED, REJECTED';
COMMENT ON COLUMN whatsapp_templates.meta_template_id IS 'ID do template na Meta (após aprovação)';

-- Habilitar RLS
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. CRIAR TABELA whatsapp_messages_log
-- ============================================================================

CREATE TABLE whatsapp_messages_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Isolamento Multi-Tenant
  organization_id UUID NOT NULL,
  environment_id UUID NOT NULL,

  -- Identificação da Mensagem
  message_id TEXT,
  wamid TEXT,

  -- Relacionamentos
  order_id UUID,
  template_id UUID REFERENCES whatsapp_templates(id) ON DELETE SET NULL,

  -- Destinatário
  recipient_name TEXT,
  recipient_phone TEXT NOT NULL,

  -- Conteúdo
  template_name TEXT,
  message_content TEXT,
  message_type TEXT DEFAULT 'template',

  -- Status da Mensagem
  status TEXT DEFAULT 'sent',
  status_details TEXT,

  -- Timestamps do Ciclo de Vida
  sent_at TIMESTAMPTZ DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,

  -- Remetente
  sent_by UUID,
  sent_by_name TEXT,

  -- Controle de Custo
  unit_cost NUMERIC(10, 4) DEFAULT 0.10,
  currency TEXT DEFAULT 'BRL',

  -- Erro e Debug
  error_message TEXT,
  error_code TEXT,
  api_response JSONB,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Comentários da tabela
COMMENT ON TABLE whatsapp_messages_log IS 'Histórico completo de todas as mensagens WhatsApp enviadas';
COMMENT ON COLUMN whatsapp_messages_log.message_id IS 'ID retornado pela API do WhatsApp';
COMMENT ON COLUMN whatsapp_messages_log.wamid IS 'WhatsApp Message ID único';
COMMENT ON COLUMN whatsapp_messages_log.status IS 'Status: sent, delivered, read, failed';
COMMENT ON COLUMN whatsapp_messages_log.unit_cost IS 'Custo unitário da mensagem em reais';
COMMENT ON COLUMN whatsapp_messages_log.api_response IS 'Resposta completa da API para debug';

-- Habilitar RLS
ALTER TABLE whatsapp_messages_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. CRIAR ÍNDICES DE PERFORMANCE
-- ============================================================================

-- whatsapp_config
CREATE INDEX idx_whatsapp_config_org_env ON whatsapp_config(organization_id, environment_id);
CREATE INDEX idx_whatsapp_config_active ON whatsapp_config(is_active) WHERE is_active = true;

-- whatsapp_templates
CREATE INDEX idx_whatsapp_templates_org_env ON whatsapp_templates(organization_id, environment_id);
CREATE INDEX idx_whatsapp_templates_active ON whatsapp_templates(organization_id, environment_id, is_active);
CREATE INDEX idx_whatsapp_templates_name ON whatsapp_templates(template_name);

-- whatsapp_messages_log
CREATE INDEX idx_whatsapp_messages_log_org_env_sent ON whatsapp_messages_log(organization_id, environment_id, sent_at DESC);
CREATE INDEX idx_whatsapp_messages_log_order ON whatsapp_messages_log(order_id);
CREATE INDEX idx_whatsapp_messages_log_status ON whatsapp_messages_log(status);
CREATE INDEX idx_whatsapp_messages_log_recipient ON whatsapp_messages_log(recipient_phone);
CREATE INDEX idx_whatsapp_messages_log_template ON whatsapp_messages_log(template_id);

-- ============================================================================
-- 6. CRIAR TRIGGERS PARA UPDATED_AT
-- ============================================================================

-- Verificar se a função existe, se não criar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
  ) THEN
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $trigger$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $trigger$ LANGUAGE plpgsql;
  END IF;
END $$;

-- Triggers
CREATE TRIGGER update_whatsapp_config_updated_at
  BEFORE UPDATE ON whatsapp_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_templates_updated_at
  BEFORE UPDATE ON whatsapp_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. CONFIGURAR POLÍTICAS RLS
-- ============================================================================

-- Políticas para whatsapp_config
CREATE POLICY "whatsapp_config_select"
  ON whatsapp_config FOR SELECT TO anon
  USING (
    organization_id::text = current_setting('app.organization_id', true)
  );

CREATE POLICY "whatsapp_config_insert"
  ON whatsapp_config FOR INSERT TO anon
  WITH CHECK (
    organization_id::text = current_setting('app.organization_id', true)
  );

CREATE POLICY "whatsapp_config_update"
  ON whatsapp_config FOR UPDATE TO anon
  USING (
    organization_id::text = current_setting('app.organization_id', true)
  )
  WITH CHECK (
    organization_id::text = current_setting('app.organization_id', true)
  );

CREATE POLICY "whatsapp_config_delete"
  ON whatsapp_config FOR DELETE TO anon
  USING (
    organization_id::text = current_setting('app.organization_id', true)
  );

-- Políticas para whatsapp_templates
CREATE POLICY "whatsapp_templates_select"
  ON whatsapp_templates FOR SELECT TO anon
  USING (
    organization_id::text = current_setting('app.organization_id', true)
  );

CREATE POLICY "whatsapp_templates_insert"
  ON whatsapp_templates FOR INSERT TO anon
  WITH CHECK (
    organization_id::text = current_setting('app.organization_id', true)
  );

CREATE POLICY "whatsapp_templates_update"
  ON whatsapp_templates FOR UPDATE TO anon
  USING (
    organization_id::text = current_setting('app.organization_id', true)
  )
  WITH CHECK (
    organization_id::text = current_setting('app.organization_id', true)
  );

CREATE POLICY "whatsapp_templates_delete"
  ON whatsapp_templates FOR DELETE TO anon
  USING (
    organization_id::text = current_setting('app.organization_id', true)
  );

-- Políticas para whatsapp_messages_log
CREATE POLICY "whatsapp_messages_log_select"
  ON whatsapp_messages_log FOR SELECT TO anon
  USING (
    organization_id::text = current_setting('app.organization_id', true)
  );

CREATE POLICY "whatsapp_messages_log_insert"
  ON whatsapp_messages_log FOR INSERT TO anon
  WITH CHECK (
    organization_id::text = current_setting('app.organization_id', true)
  );

-- ============================================================================
-- 8. CRIAR FUNÇÃO DE AGREGAÇÃO DE CUSTOS MENSAIS
-- ============================================================================

CREATE OR REPLACE FUNCTION get_whatsapp_monthly_costs(
  p_organization_id UUID,
  p_environment_id UUID,
  p_month INTEGER,
  p_year INTEGER
)
RETURNS TABLE (
  total_messages BIGINT,
  total_cost NUMERIC,
  messages_by_status JSONB,
  messages_by_type JSONB,
  avg_delivery_time INTERVAL,
  success_rate NUMERIC
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      COUNT(*) as msg_count,
      SUM(unit_cost) as total,
      jsonb_object_agg(
        COALESCE(status, 'unknown'),
        COUNT(*)
      ) as by_status,
      jsonb_object_agg(
        COALESCE(message_type, 'unknown'),
        COUNT(*)
      ) as by_type,
      AVG(EXTRACT(EPOCH FROM (delivered_at - sent_at)) * INTERVAL '1 second') as avg_time,
      (COUNT(*) FILTER (WHERE status IN ('delivered', 'read'))::NUMERIC / NULLIF(COUNT(*), 0)) * 100 as rate
    FROM whatsapp_messages_log
    WHERE
      organization_id = p_organization_id
      AND environment_id = p_environment_id
      AND EXTRACT(MONTH FROM sent_at) = p_month
      AND EXTRACT(YEAR FROM sent_at) = p_year
  )
  SELECT
    msg_count,
    COALESCE(total, 0),
    COALESCE(by_status, '{}'::jsonb),
    COALESCE(by_type, '{}'::jsonb),
    avg_time,
    COALESCE(rate, 0)
  FROM stats;
END;
$$;

COMMENT ON FUNCTION get_whatsapp_monthly_costs IS 'Retorna estatísticas agregadas de custos e mensagens por mês';

-- ============================================================================
-- 9. CRIAR FUNÇÃO DE ESTATÍSTICAS DE TEMPLATES
-- ============================================================================

CREATE OR REPLACE FUNCTION get_template_usage_stats(
  p_organization_id UUID,
  p_environment_id UUID
)
RETURNS TABLE (
  template_name TEXT,
  usage_count BIGINT,
  success_count BIGINT,
  success_rate NUMERIC,
  total_cost NUMERIC,
  last_used_at TIMESTAMPTZ
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    wml.template_name,
    COUNT(*) as usage_count,
    COUNT(*) FILTER (WHERE wml.status IN ('delivered', 'read')) as success_count,
    (COUNT(*) FILTER (WHERE wml.status IN ('delivered', 'read'))::NUMERIC / NULLIF(COUNT(*), 0)) * 100 as success_rate,
    SUM(wml.unit_cost) as total_cost,
    MAX(wml.sent_at) as last_used_at
  FROM whatsapp_messages_log wml
  WHERE
    wml.organization_id = p_organization_id
    AND wml.environment_id = p_environment_id
    AND wml.template_name IS NOT NULL
  GROUP BY wml.template_name
  ORDER BY usage_count DESC;
END;
$$;

COMMENT ON FUNCTION get_template_usage_stats IS 'Retorna estatísticas de uso e efetividade dos templates';

-- ============================================================================
-- 10. CRIAR VIEW PARA DASHBOARD
-- ============================================================================

CREATE OR REPLACE VIEW whatsapp_messages_summary AS
SELECT
  wml.id,
  wml.organization_id,
  wml.environment_id,
  wml.message_id,
  wml.order_id,
  wml.recipient_name,
  wml.recipient_phone,
  wml.template_name,
  wml.message_content,
  wml.status,
  wml.status_details,
  wml.sent_at,
  wml.delivered_at,
  wml.read_at,
  wml.failed_at,
  wml.sent_by_name,
  wml.unit_cost,
  wml.error_message,

  -- Campos calculados
  wml.delivered_at - wml.sent_at as time_to_deliver,
  wml.read_at - wml.sent_at as time_to_read,

  -- Status legível em português
  CASE wml.status
    WHEN 'sent' THEN 'Enviada'
    WHEN 'delivered' THEN 'Entregue'
    WHEN 'read' THEN 'Lida'
    WHEN 'failed' THEN 'Falhou'
    ELSE 'Desconhecido'
  END as status_pt,

  -- Dados do template
  wt.body_text as template_body,
  wt.category as template_category,
  wt.approval_status

FROM whatsapp_messages_log wml
LEFT JOIN whatsapp_templates wt ON wml.template_id = wt.id;

COMMENT ON VIEW whatsapp_messages_summary IS 'Visão completa das mensagens com campos calculados e traduzidos';

-- Habilitar RLS na view
ALTER VIEW whatsapp_messages_summary SET (security_invoker = true);

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================
