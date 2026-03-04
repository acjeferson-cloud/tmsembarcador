/*
  # Reestruturação Completa da Tabela Holidays

  ## Problema
  A tabela holidays estava com campos duplicados (português + inglês) criando confusão:
  - nome/name
  - data/date_field  
  - tipo/type
  - recorrente/is_recurring
  - ativo/active
  
  Além disso, havia 5 triggers de sincronização desnecessários.

  ## Solução
  1. Dropar completamente a tabela holidays e todas as dependências
  2. Recriar com estrutura limpa usando apenas campos em inglês
  3. Restaurar os 10 feriados nacionais brasileiros de 2026
  4. Criar índices otimizados
  5. Configurar políticas RLS adequadas

  ## Estrutura Final
  - `id` - Identificador único (UUID)
  - `name` - Nome do feriado (texto)
  - `date` - Data do feriado (date)
  - `type` - Tipo: nacional, estadual, municipal, custom (texto com CHECK)
  - `is_recurring` - Se repete anualmente (boolean)
  - `active` - Se está ativo (boolean)
  - `country_id` - FK para países
  - `state_id` - FK para estados
  - `city_id` - FK para cidades
  - `organization_id` - FK para organizações (multi-tenant)
  - `environment_id` - FK para ambientes (multi-tenant)
  - `created_at` - Data de criação
  - `updated_at` - Data de atualização

  ## Benefícios
  - Eliminação de campos duplicados (18 campos → 13 campos)
  - Remoção de 5 triggers e funções desnecessárias
  - Service TypeScript simplificado (sem mapeamento de campos)
  - Queries mais rápidas e manutenção facilitada
  - Zero inconsistências entre campos duplicados
*/

-- =========================================
-- PASSO 1: BACKUP DOS DADOS EXISTENTES
-- =========================================

-- Criar tabela temporária com backup dos dados
CREATE TEMP TABLE holidays_backup AS
SELECT 
  id,
  nome as name,
  data as date,
  tipo as type,
  recorrente as is_recurring,
  ativo as active,
  country_id,
  state_id,
  city_id,
  organization_id,
  environment_id,
  created_at,
  updated_at
FROM holidays;

-- =========================================
-- PASSO 2: DROPAR TABELA E DEPENDÊNCIAS
-- =========================================

-- Dropar triggers se existirem
DROP TRIGGER IF EXISTS sync_holidays_nome_to_name ON holidays;
DROP TRIGGER IF EXISTS sync_holidays_name_to_nome ON holidays;
DROP TRIGGER IF EXISTS sync_holidays_data_to_date_field ON holidays;
DROP TRIGGER IF EXISTS sync_holidays_date_field_to_data ON holidays;
DROP TRIGGER IF EXISTS sync_holidays_tipo_to_type ON holidays;
DROP TRIGGER IF EXISTS sync_holidays_type_to_tipo ON holidays;
DROP TRIGGER IF EXISTS sync_holidays_recorrente_to_is_recurring ON holidays;
DROP TRIGGER IF EXISTS sync_holidays_is_recurring_to_recorrente ON holidays;
DROP TRIGGER IF EXISTS sync_holidays_ativo_to_active ON holidays;
DROP TRIGGER IF EXISTS sync_holidays_active_to_ativo ON holidays;
DROP TRIGGER IF EXISTS update_holidays_updated_at ON holidays;

-- Dropar funções de sincronização se existirem
DROP FUNCTION IF EXISTS sync_holidays_nome_to_name() CASCADE;
DROP FUNCTION IF EXISTS sync_holidays_name_to_nome() CASCADE;
DROP FUNCTION IF EXISTS sync_holidays_data_to_date_field() CASCADE;
DROP FUNCTION IF EXISTS sync_holidays_date_field_to_data() CASCADE;
DROP FUNCTION IF EXISTS sync_holidays_tipo_to_type() CASCADE;
DROP FUNCTION IF EXISTS sync_holidays_type_to_tipo() CASCADE;
DROP FUNCTION IF EXISTS sync_holidays_recorrente_to_is_recurring() CASCADE;
DROP FUNCTION IF EXISTS sync_holidays_is_recurring_to_recorrente() CASCADE;
DROP FUNCTION IF EXISTS sync_holidays_ativo_to_active() CASCADE;
DROP FUNCTION IF EXISTS sync_holidays_active_to_ativo() CASCADE;

-- Dropar a tabela completamente
DROP TABLE IF EXISTS holidays CASCADE;

-- =========================================
-- PASSO 3: CRIAR NOVA TABELA LIMPA
-- =========================================

CREATE TABLE holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  date date NOT NULL,
  type text NOT NULL DEFAULT 'nacional' CHECK (type IN ('nacional', 'estadual', 'municipal', 'custom')),
  is_recurring boolean NOT NULL DEFAULT true,
  active boolean NOT NULL DEFAULT true,
  country_id uuid REFERENCES countries(id) ON DELETE SET NULL,
  state_id uuid REFERENCES states(id) ON DELETE SET NULL,
  city_id uuid REFERENCES cities(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES saas_organizations(id) ON DELETE CASCADE,
  environment_id uuid REFERENCES saas_environments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =========================================
-- PASSO 4: CRIAR ÍNDICES OTIMIZADOS
-- =========================================

-- Índice para buscas por data
CREATE INDEX idx_holidays_date ON holidays(date);

-- Índice para buscas por tipo
CREATE INDEX idx_holidays_type ON holidays(type);

-- Índice composto para queries comuns (data + tipo)
CREATE INDEX idx_holidays_date_type ON holidays(date, type);

-- Índice para buscas geográficas
CREATE INDEX idx_holidays_geography ON holidays(country_id, state_id, city_id);

-- Índice para multi-tenancy
CREATE INDEX idx_holidays_tenant ON holidays(organization_id, environment_id);

-- Índice para feriados ativos
CREATE INDEX idx_holidays_active ON holidays(active) WHERE active = true;

-- =========================================
-- PASSO 5: HABILITAR RLS
-- =========================================

ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

-- =========================================
-- PASSO 6: CRIAR POLÍTICAS RLS
-- =========================================

-- Política SELECT: Acesso público com contexto de tenant
CREATE POLICY "holidays_select_policy"
  ON holidays
  FOR SELECT
  TO anon, authenticated
  USING (
    -- Feriados globais (sem tenant específico)
    (organization_id IS NULL AND environment_id IS NULL)
    OR
    -- Feriados do tenant atual (via session context)
    (
      organization_id = COALESCE(
        current_setting('app.current_organization_id', true)::uuid,
        organization_id
      )
      AND environment_id = COALESCE(
        current_setting('app.current_environment_id', true)::uuid,
        environment_id
      )
    )
  );

-- Política INSERT: Apenas usuários autenticados
CREATE POLICY "holidays_insert_policy"
  ON holidays
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = current_setting('app.current_organization_id', true)::uuid
    AND environment_id = current_setting('app.current_environment_id', true)::uuid
  );

-- Política UPDATE: Apenas usuários autenticados do mesmo tenant
CREATE POLICY "holidays_update_policy"
  ON holidays
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = current_setting('app.current_organization_id', true)::uuid
    AND environment_id = current_setting('app.current_environment_id', true)::uuid
  )
  WITH CHECK (
    organization_id = current_setting('app.current_organization_id', true)::uuid
    AND environment_id = current_setting('app.current_environment_id', true)::uuid
  );

-- Política DELETE: Apenas usuários autenticados do mesmo tenant
CREATE POLICY "holidays_delete_policy"
  ON holidays
  FOR DELETE
  TO authenticated
  USING (
    organization_id = current_setting('app.current_organization_id', true)::uuid
    AND environment_id = current_setting('app.current_environment_id', true)::uuid
  );

-- =========================================
-- PASSO 7: CRIAR TRIGGER PARA updated_at
-- =========================================

CREATE OR REPLACE FUNCTION update_holidays_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_holidays_updated_at
  BEFORE UPDATE ON holidays
  FOR EACH ROW
  EXECUTE FUNCTION update_holidays_updated_at();

-- =========================================
-- PASSO 8: RESTAURAR DADOS
-- =========================================

-- Inserir os 10 feriados nacionais de 2026 do backup
INSERT INTO holidays (
  id,
  name,
  date,
  type,
  is_recurring,
  active,
  country_id,
  state_id,
  city_id,
  organization_id,
  environment_id,
  created_at,
  updated_at
)
SELECT 
  id,
  name,
  date,
  type,
  is_recurring,
  active,
  country_id,
  state_id,
  city_id,
  organization_id,
  environment_id,
  created_at,
  updated_at
FROM holidays_backup;

-- =========================================
-- PASSO 9: VALIDAÇÃO
-- =========================================

-- Verificar que todos os registros foram restaurados
DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count FROM holidays;
  
  IF v_count <> 10 THEN
    RAISE EXCEPTION 'Erro: Esperado 10 feriados, encontrado %', v_count;
  END IF;
  
  RAISE NOTICE 'Sucesso: % feriados restaurados corretamente', v_count;
END $$;

-- =========================================
-- PASSO 10: ADICIONAR COMENTÁRIOS
-- =========================================

COMMENT ON TABLE holidays IS 'Tabela de feriados nacionais, estaduais, municipais e personalizados';
COMMENT ON COLUMN holidays.id IS 'Identificador único do feriado';
COMMENT ON COLUMN holidays.name IS 'Nome do feriado';
COMMENT ON COLUMN holidays.date IS 'Data do feriado';
COMMENT ON COLUMN holidays.type IS 'Tipo do feriado: nacional, estadual, municipal ou custom';
COMMENT ON COLUMN holidays.is_recurring IS 'Indica se o feriado se repete anualmente';
COMMENT ON COLUMN holidays.active IS 'Indica se o feriado está ativo no sistema';
COMMENT ON COLUMN holidays.country_id IS 'Referência ao país (para feriados nacionais)';
COMMENT ON COLUMN holidays.state_id IS 'Referência ao estado (para feriados estaduais)';
COMMENT ON COLUMN holidays.city_id IS 'Referência à cidade (para feriados municipais)';
COMMENT ON COLUMN holidays.organization_id IS 'Organização dona do feriado (multi-tenant)';
COMMENT ON COLUMN holidays.environment_id IS 'Ambiente do feriado (multi-tenant)';

-- Limpar tabela temporária
DROP TABLE holidays_backup;
