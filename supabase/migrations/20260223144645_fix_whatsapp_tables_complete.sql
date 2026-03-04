/*
  # Corrigir estrutura das tabelas do WhatsApp

  1. Tabela whatsapp_templates
    - Adicionar coluna approval_status (status de aprovação do template)
    - Adicionar coluna template_language (idioma do template)
    - Adicionar coluna template_name (nome do template)
    - Adicionar coluna header_text (texto do cabeçalho)
    - Adicionar coluna body_text (texto do corpo)
    - Adicionar coluna footer_text (texto do rodapé)
    - Adicionar coluna meta_template_id (ID do template na Meta)
    - Adicionar coluna description (descrição do template)
    - Adicionar coluna created_by (usuário que criou)
    - Remover coluna name (renomear para template_name)
    - Remover coluna content (dividir em header, body, footer)

  2. Tabela user_innovations
    - Criar tabela para rastrear inovações visualizadas por usuários

  3. RLS
    - Manter políticas existentes
    - Adicionar políticas para user_innovations
*/

-- =====================================================
-- PARTE 1: Atualizar whatsapp_templates
-- =====================================================

-- Adicionar coluna template_name se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'whatsapp_templates' 
    AND column_name = 'template_name'
  ) THEN
    -- Copiar valores de 'name' para 'template_name' se name existir
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'whatsapp_templates' 
      AND column_name = 'name'
    ) THEN
      ALTER TABLE whatsapp_templates ADD COLUMN template_name text;
      UPDATE whatsapp_templates SET template_name = name WHERE name IS NOT NULL;
      ALTER TABLE whatsapp_templates ALTER COLUMN template_name SET NOT NULL;
    ELSE
      ALTER TABLE whatsapp_templates ADD COLUMN template_name text NOT NULL DEFAULT 'template';
    END IF;
  END IF;
END $$;

-- Adicionar coluna template_language se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'whatsapp_templates' 
    AND column_name = 'template_language'
  ) THEN
    ALTER TABLE whatsapp_templates ADD COLUMN template_language text DEFAULT 'pt_BR';
  END IF;
END $$;

-- Adicionar coluna approval_status se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'whatsapp_templates' 
    AND column_name = 'approval_status'
  ) THEN
    ALTER TABLE whatsapp_templates ADD COLUMN approval_status text DEFAULT 'PENDING' CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED'));
  END IF;
END $$;

-- Adicionar coluna header_text se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'whatsapp_templates' 
    AND column_name = 'header_text'
  ) THEN
    ALTER TABLE whatsapp_templates ADD COLUMN header_text text;
  END IF;
END $$;

-- Adicionar coluna body_text se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'whatsapp_templates' 
    AND column_name = 'body_text'
  ) THEN
    -- Copiar valores de 'content' para 'body_text' se content existir
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'whatsapp_templates' 
      AND column_name = 'content'
    ) THEN
      ALTER TABLE whatsapp_templates ADD COLUMN body_text text;
      UPDATE whatsapp_templates SET body_text = content WHERE content IS NOT NULL;
      ALTER TABLE whatsapp_templates ALTER COLUMN body_text SET NOT NULL;
    ELSE
      ALTER TABLE whatsapp_templates ADD COLUMN body_text text NOT NULL DEFAULT '';
    END IF;
  END IF;
END $$;

-- Adicionar coluna footer_text se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'whatsapp_templates' 
    AND column_name = 'footer_text'
  ) THEN
    ALTER TABLE whatsapp_templates ADD COLUMN footer_text text;
  END IF;
END $$;

-- Adicionar coluna meta_template_id se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'whatsapp_templates' 
    AND column_name = 'meta_template_id'
  ) THEN
    ALTER TABLE whatsapp_templates ADD COLUMN meta_template_id text;
  END IF;
END $$;

-- Adicionar coluna description se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'whatsapp_templates' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE whatsapp_templates ADD COLUMN description text;
  END IF;
END $$;

-- Adicionar coluna created_by se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'whatsapp_templates' 
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE whatsapp_templates ADD COLUMN created_by text;
  END IF;
END $$;

-- Remover colunas antigas se existirem (após migrar dados)
DO $$
BEGIN
  -- Remover coluna 'name' se existir e 'template_name' foi criado
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'whatsapp_templates' 
    AND column_name = 'name'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'whatsapp_templates' 
    AND column_name = 'template_name'
  ) THEN
    ALTER TABLE whatsapp_templates DROP COLUMN name;
  END IF;

  -- Remover coluna 'content' se existir e 'body_text' foi criado
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'whatsapp_templates' 
    AND column_name = 'content'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'whatsapp_templates' 
    AND column_name = 'body_text'
  ) THEN
    ALTER TABLE whatsapp_templates DROP COLUMN content;
  END IF;
END $$;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_approval_status ON whatsapp_templates(approval_status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_template_name ON whatsapp_templates(template_name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_template_language ON whatsapp_templates(template_language);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_meta_template_id ON whatsapp_templates(meta_template_id);

-- =====================================================
-- PARTE 2: Criar tabela user_innovations
-- =====================================================

CREATE TABLE IF NOT EXISTS user_innovations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  innovation_id uuid REFERENCES innovations(id) ON DELETE CASCADE,
  viewed_at timestamptz DEFAULT now(),
  organization_id uuid,
  environment_id uuid,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, innovation_id)
);

-- RLS para user_innovations
ALTER TABLE user_innovations ENABLE ROW LEVEL SECURITY;

-- Política para SELECT (usuários autenticados via anon com contexto)
CREATE POLICY "user_innovations_anon_select"
  ON user_innovations FOR SELECT
  TO anon
  USING (
    organization_id::text = current_setting('app.current_organization_id', true)
    AND environment_id::text = current_setting('app.current_environment_id', true)
  );

-- Política para INSERT
CREATE POLICY "user_innovations_anon_insert"
  ON user_innovations FOR INSERT
  TO anon
  WITH CHECK (
    organization_id::text = current_setting('app.current_organization_id', true)
    AND environment_id::text = current_setting('app.current_environment_id', true)
  );

-- Política para DELETE
CREATE POLICY "user_innovations_anon_delete"
  ON user_innovations FOR DELETE
  TO anon
  USING (
    organization_id::text = current_setting('app.current_organization_id', true)
    AND environment_id::text = current_setting('app.current_environment_id', true)
  );

-- Índices para user_innovations
CREATE INDEX IF NOT EXISTS idx_user_innovations_user_id ON user_innovations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_innovations_innovation_id ON user_innovations(innovation_id);
CREATE INDEX IF NOT EXISTS idx_user_innovations_organization_id ON user_innovations(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_innovations_environment_id ON user_innovations(environment_id);

-- =====================================================
-- PARTE 3: Comentários de documentação
-- =====================================================

-- Comentários whatsapp_templates
COMMENT ON COLUMN whatsapp_templates.template_name IS 'Nome do template do WhatsApp';
COMMENT ON COLUMN whatsapp_templates.template_language IS 'Código do idioma (pt_BR, en_US, es_ES)';
COMMENT ON COLUMN whatsapp_templates.approval_status IS 'Status de aprovação: PENDING, APPROVED, REJECTED';
COMMENT ON COLUMN whatsapp_templates.header_text IS 'Texto do cabeçalho do template';
COMMENT ON COLUMN whatsapp_templates.body_text IS 'Texto principal do corpo do template';
COMMENT ON COLUMN whatsapp_templates.footer_text IS 'Texto do rodapé do template';
COMMENT ON COLUMN whatsapp_templates.meta_template_id IS 'ID do template na plataforma Meta/WhatsApp Business';
COMMENT ON COLUMN whatsapp_templates.description IS 'Descrição do propósito do template';
COMMENT ON COLUMN whatsapp_templates.created_by IS 'Código/ID do usuário que criou o template';
COMMENT ON COLUMN whatsapp_templates.variables IS 'Array de variáveis utilizadas no template';
COMMENT ON COLUMN whatsapp_templates.category IS 'Categoria do template (UTILITY, MARKETING, etc)';

-- Comentários user_innovations
COMMENT ON TABLE user_innovations IS 'Rastreamento de inovações visualizadas por usuários';
COMMENT ON COLUMN user_innovations.user_id IS 'ID do usuário que visualizou';
COMMENT ON COLUMN user_innovations.innovation_id IS 'ID da inovação visualizada';
COMMENT ON COLUMN user_innovations.viewed_at IS 'Data/hora da visualização';
