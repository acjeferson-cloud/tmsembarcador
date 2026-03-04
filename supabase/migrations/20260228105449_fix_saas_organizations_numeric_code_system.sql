/*
  # Sistema de Código Numérico Sequencial para Organizações SaaS
  
  1. Mudanças
    - Cria sequence para geração automática de códigos
    - Implementa função para gerar próximo código com 8 dígitos
    - Adiciona constraint de validação (apenas números, 8 dígitos)
    - Cria trigger para auto-geração de código
    
  2. Comportamento
    - Código é gerado automaticamente no INSERT
    - Formato: 00000001, 00000002, 00000003...
    - Começa em 00000005 (pois já existem 4 organizações)
    - Validação garante apenas códigos numéricos de 8 dígitos
    
  3. Notas
    - Organizações existentes mantêm seus códigos atuais (00000001-00000004)
    - Novas organizações recebem código automático sequencial
    - Sistema é à prova de duplicação
*/

-- Criar sequence iniciando em 5 (já temos 4 organizações: 00000001-00000004)
CREATE SEQUENCE IF NOT EXISTS saas_organizations_codigo_seq 
  START WITH 5
  INCREMENT BY 1
  NO CYCLE;

-- Função para gerar o próximo código numérico de 8 dígitos
CREATE OR REPLACE FUNCTION generate_next_organization_code()
RETURNS TEXT AS $$
DECLARE
  next_code INTEGER;
  formatted_code TEXT;
BEGIN
  -- Obter o próximo valor da sequence
  next_code := nextval('saas_organizations_codigo_seq');
  
  -- Formatar com zeros à esquerda (8 dígitos)
  formatted_code := LPAD(next_code::TEXT, 8, '0');
  
  RETURN formatted_code;
END;
$$ LANGUAGE plpgsql;

-- Adicionar constraint de validação para garantir formato correto
-- Remove constraint antiga se existir
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'saas_organizations_codigo_format'
  ) THEN
    ALTER TABLE saas_organizations DROP CONSTRAINT saas_organizations_codigo_format;
  END IF;
END $$;

-- Adiciona nova constraint: exatamente 8 dígitos numéricos
ALTER TABLE saas_organizations
  ADD CONSTRAINT saas_organizations_codigo_format 
  CHECK (codigo ~ '^[0-9]{8}$');

-- Criar ou substituir trigger para auto-geração de código
CREATE OR REPLACE FUNCTION trg_generate_organization_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Se código não foi fornecido ou está vazio, gerar automaticamente
  IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
    NEW.codigo := generate_next_organization_code();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger BEFORE INSERT
DROP TRIGGER IF EXISTS trigger_generate_organization_code ON saas_organizations;
CREATE TRIGGER trigger_generate_organization_code
  BEFORE INSERT ON saas_organizations
  FOR EACH ROW
  EXECUTE FUNCTION trg_generate_organization_code();

-- Comentários para documentação
COMMENT ON SEQUENCE saas_organizations_codigo_seq IS 'Sequence para geração automática de códigos numéricos das organizações SaaS';
COMMENT ON FUNCTION generate_next_organization_code() IS 'Gera o próximo código numérico sequencial com 8 dígitos (formato: 00000001)';
COMMENT ON FUNCTION trg_generate_organization_code() IS 'Trigger function que gera código automaticamente antes de inserir nova organização';
