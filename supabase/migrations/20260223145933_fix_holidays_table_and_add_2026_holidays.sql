/*
  # Corrigir estrutura da tabela holidays e adicionar feriados de 2026

  1. Problema Identificado
    - O service usa campos diferentes dos que existem no banco
    - Service usa: name, is_recurring
    - Banco tem: nome, recorrente
    - Erro: "column_name" não existe

  2. Solução
    - Adicionar colunas com nomes em inglês (compatibilidade)
    - Manter colunas em português (retrocompatibilidade)
    - Inserir todos os feriados nacionais do Brasil para 2026

  3. Feriados Nacionais 2026
    - 10 feriados oficiais do Brasil
    - Datas fixas conforme calendário
*/

-- =====================================================
-- PARTE 1: Adicionar colunas em inglês
-- =====================================================

-- Adicionar coluna 'name' como alternativa a 'nome'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'holidays' 
    AND column_name = 'name'
  ) THEN
    ALTER TABLE holidays ADD COLUMN name text;
    
    -- Copiar dados de 'nome' para 'name' se houver registros
    UPDATE holidays SET name = nome WHERE nome IS NOT NULL;
  END IF;
END $$;

-- Adicionar coluna 'date_field' para evitar conflito com palavra reservada 'data'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'holidays' 
    AND column_name = 'date_field'
  ) THEN
    ALTER TABLE holidays ADD COLUMN date_field date;
    
    -- Copiar dados de 'data' para 'date_field' se houver registros
    UPDATE holidays SET date_field = data WHERE data IS NOT NULL;
  END IF;
END $$;

-- Adicionar coluna 'type' como alternativa a 'tipo'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'holidays' 
    AND column_name = 'type'
  ) THEN
    ALTER TABLE holidays ADD COLUMN type text DEFAULT 'nacional';
    
    -- Copiar dados de 'tipo' para 'type' se houver registros
    UPDATE holidays SET type = tipo WHERE tipo IS NOT NULL;
  END IF;
END $$;

-- Adicionar coluna 'is_recurring' como alternativa a 'recorrente'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'holidays' 
    AND column_name = 'is_recurring'
  ) THEN
    ALTER TABLE holidays ADD COLUMN is_recurring boolean DEFAULT true;
    
    -- Copiar dados de 'recorrente' para 'is_recurring' se houver registros
    UPDATE holidays SET is_recurring = recorrente WHERE recorrente IS NOT NULL;
  END IF;
END $$;

-- Adicionar coluna 'active' como alternativa a 'ativo'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'holidays' 
    AND column_name = 'active'
  ) THEN
    ALTER TABLE holidays ADD COLUMN active boolean DEFAULT true;
    
    -- Copiar dados de 'ativo' para 'active' se houver registros
    UPDATE holidays SET active = ativo WHERE ativo IS NOT NULL;
  END IF;
END $$;

-- =====================================================
-- PARTE 2: Criar triggers para sincronizar dados
-- =====================================================

-- Função para sincronizar nome/name
CREATE OR REPLACE FUNCTION sync_holidays_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.name IS NOT NULL THEN
    NEW.nome := NEW.name;
  ELSIF NEW.nome IS NOT NULL THEN
    NEW.name := NEW.nome;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para sincronizar data/date_field
CREATE OR REPLACE FUNCTION sync_holidays_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.date_field IS NOT NULL THEN
    NEW.data := NEW.date_field;
  ELSIF NEW.data IS NOT NULL THEN
    NEW.date_field := NEW.data;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para sincronizar tipo/type
CREATE OR REPLACE FUNCTION sync_holidays_type()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type IS NOT NULL THEN
    NEW.tipo := NEW.type;
  ELSIF NEW.tipo IS NOT NULL THEN
    NEW.type := NEW.tipo;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para sincronizar recorrente/is_recurring
CREATE OR REPLACE FUNCTION sync_holidays_recurring()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_recurring IS NOT NULL THEN
    NEW.recorrente := NEW.is_recurring;
  ELSIF NEW.recorrente IS NOT NULL THEN
    NEW.is_recurring := NEW.recorrente;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para sincronizar ativo/active
CREATE OR REPLACE FUNCTION sync_holidays_active()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.active IS NOT NULL THEN
    NEW.ativo := NEW.active;
  ELSIF NEW.ativo IS NOT NULL THEN
    NEW.active := NEW.ativo;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers (DROP IF EXISTS para evitar duplicação)
DROP TRIGGER IF EXISTS trigger_sync_holidays_name ON holidays;
CREATE TRIGGER trigger_sync_holidays_name
  BEFORE INSERT OR UPDATE ON holidays
  FOR EACH ROW
  EXECUTE FUNCTION sync_holidays_name();

DROP TRIGGER IF EXISTS trigger_sync_holidays_date ON holidays;
CREATE TRIGGER trigger_sync_holidays_date
  BEFORE INSERT OR UPDATE ON holidays
  FOR EACH ROW
  EXECUTE FUNCTION sync_holidays_date();

DROP TRIGGER IF EXISTS trigger_sync_holidays_type ON holidays;
CREATE TRIGGER trigger_sync_holidays_type
  BEFORE INSERT OR UPDATE ON holidays
  FOR EACH ROW
  EXECUTE FUNCTION sync_holidays_type();

DROP TRIGGER IF EXISTS trigger_sync_holidays_recurring ON holidays;
CREATE TRIGGER trigger_sync_holidays_recurring
  BEFORE INSERT OR UPDATE ON holidays
  FOR EACH ROW
  EXECUTE FUNCTION sync_holidays_recurring();

DROP TRIGGER IF EXISTS trigger_sync_holidays_active ON holidays;
CREATE TRIGGER trigger_sync_holidays_active
  BEFORE INSERT OR UPDATE ON holidays
  FOR EACH ROW
  EXECUTE FUNCTION sync_holidays_active();

-- =====================================================
-- PARTE 3: Inserir feriados nacionais do Brasil 2026
-- =====================================================

-- Buscar ou criar país Brasil
DO $$
DECLARE
  v_country_id uuid;
BEGIN
  -- Buscar ID do Brasil
  SELECT id INTO v_country_id
  FROM countries
  WHERE codigo = 'BRA' OR codigo = 'BR' OR nome ILIKE '%brasil%'
  LIMIT 1;

  -- Se não encontrar, criar (fallback)
  IF v_country_id IS NULL THEN
    INSERT INTO countries (codigo, nome, nome_ingles, active)
    VALUES ('BRA', 'Brasil', 'Brazil', true)
    ON CONFLICT (codigo) DO NOTHING
    RETURNING id INTO v_country_id;
    
    -- Se ainda não tiver ID, buscar novamente
    IF v_country_id IS NULL THEN
      SELECT id INTO v_country_id FROM countries WHERE codigo = 'BRA';
    END IF;
  END IF;

  -- Inserir feriados nacionais de 2026 (apenas se não existirem)
  
  -- 1. Confraternização Universal (Ano Novo)
  INSERT INTO holidays (
    name, nome, 
    date_field, data,
    type, tipo,
    is_recurring, recorrente,
    country_id,
    active, ativo,
    organization_id,
    environment_id
  )
  SELECT 
    'Confraternização Universal', 'Confraternização Universal',
    '2026-01-01'::date, '2026-01-01'::date,
    'nacional', 'nacional',
    true, true,
    v_country_id,
    true, true,
    NULL, NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM holidays 
    WHERE data = '2026-01-01' AND tipo = 'nacional'
  );

  -- 2. Paixão de Cristo (Sexta-feira Santa)
  INSERT INTO holidays (
    name, nome,
    date_field, data,
    type, tipo,
    is_recurring, recorrente,
    country_id,
    active, ativo,
    organization_id,
    environment_id
  )
  SELECT 
    'Paixão de Cristo', 'Paixão de Cristo',
    '2026-04-03'::date, '2026-04-03'::date,
    'nacional', 'nacional',
    true, true,
    v_country_id,
    true, true,
    NULL, NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM holidays 
    WHERE data = '2026-04-03' AND tipo = 'nacional'
  );

  -- 3. Tiradentes
  INSERT INTO holidays (
    name, nome,
    date_field, data,
    type, tipo,
    is_recurring, recorrente,
    country_id,
    active, ativo,
    organization_id,
    environment_id
  )
  SELECT 
    'Tiradentes', 'Tiradentes',
    '2026-04-21'::date, '2026-04-21'::date,
    'nacional', 'nacional',
    true, true,
    v_country_id,
    true, true,
    NULL, NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM holidays 
    WHERE data = '2026-04-21' AND tipo = 'nacional'
  );

  -- 4. Dia do Trabalho
  INSERT INTO holidays (
    name, nome,
    date_field, data,
    type, tipo,
    is_recurring, recorrente,
    country_id,
    active, ativo,
    organization_id,
    environment_id
  )
  SELECT 
    'Dia do Trabalho', 'Dia do Trabalho',
    '2026-05-01'::date, '2026-05-01'::date,
    'nacional', 'nacional',
    true, true,
    v_country_id,
    true, true,
    NULL, NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM holidays 
    WHERE data = '2026-05-01' AND tipo = 'nacional'
  );

  -- 5. Independência do Brasil
  INSERT INTO holidays (
    name, nome,
    date_field, data,
    type, tipo,
    is_recurring, recorrente,
    country_id,
    active, ativo,
    organization_id,
    environment_id
  )
  SELECT 
    'Independência do Brasil', 'Independência do Brasil',
    '2026-09-07'::date, '2026-09-07'::date,
    'nacional', 'nacional',
    true, true,
    v_country_id,
    true, true,
    NULL, NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM holidays 
    WHERE data = '2026-09-07' AND tipo = 'nacional'
  );

  -- 6. Nossa Senhora Aparecida
  INSERT INTO holidays (
    name, nome,
    date_field, data,
    type, tipo,
    is_recurring, recorrente,
    country_id,
    active, ativo,
    organization_id,
    environment_id
  )
  SELECT 
    'Nossa Senhora Aparecida', 'Nossa Senhora Aparecida',
    '2026-10-12'::date, '2026-10-12'::date,
    'nacional', 'nacional',
    true, true,
    v_country_id,
    true, true,
    NULL, NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM holidays 
    WHERE data = '2026-10-12' AND tipo = 'nacional'
  );

  -- 7. Finados
  INSERT INTO holidays (
    name, nome,
    date_field, data,
    type, tipo,
    is_recurring, recorrente,
    country_id,
    active, ativo,
    organization_id,
    environment_id
  )
  SELECT 
    'Finados', 'Finados',
    '2026-11-02'::date, '2026-11-02'::date,
    'nacional', 'nacional',
    true, true,
    v_country_id,
    true, true,
    NULL, NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM holidays 
    WHERE data = '2026-11-02' AND tipo = 'nacional'
  );

  -- 8. Proclamação da República
  INSERT INTO holidays (
    name, nome,
    date_field, data,
    type, tipo,
    is_recurring, recorrente,
    country_id,
    active, ativo,
    organization_id,
    environment_id
  )
  SELECT 
    'Proclamação da República', 'Proclamação da República',
    '2026-11-15'::date, '2026-11-15'::date,
    'nacional', 'nacional',
    true, true,
    v_country_id,
    true, true,
    NULL, NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM holidays 
    WHERE data = '2026-11-15' AND tipo = 'nacional'
  );

  -- 9. Dia Nacional de Zumbi e da Consciência Negra
  INSERT INTO holidays (
    name, nome,
    date_field, data,
    type, tipo,
    is_recurring, recorrente,
    country_id,
    active, ativo,
    organization_id,
    environment_id
  )
  SELECT 
    'Dia Nacional de Zumbi e da Consciência Negra', 'Dia Nacional de Zumbi e da Consciência Negra',
    '2026-11-20'::date, '2026-11-20'::date,
    'nacional', 'nacional',
    true, true,
    v_country_id,
    true, true,
    NULL, NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM holidays 
    WHERE data = '2026-11-20' AND tipo = 'nacional'
  );

  -- 10. Natal
  INSERT INTO holidays (
    name, nome,
    date_field, data,
    type, tipo,
    is_recurring, recorrente,
    country_id,
    active, ativo,
    organization_id,
    environment_id
  )
  SELECT 
    'Natal', 'Natal',
    '2026-12-25'::date, '2026-12-25'::date,
    'nacional', 'nacional',
    true, true,
    v_country_id,
    true, true,
    NULL, NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM holidays 
    WHERE data = '2026-12-25' AND tipo = 'nacional'
  );

END $$;

-- =====================================================
-- PARTE 4: Criar índices
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_holidays_name ON holidays(name);
CREATE INDEX IF NOT EXISTS idx_holidays_date_field ON holidays(date_field);
CREATE INDEX IF NOT EXISTS idx_holidays_type ON holidays(type);
CREATE INDEX IF NOT EXISTS idx_holidays_country_id ON holidays(country_id);
CREATE INDEX IF NOT EXISTS idx_holidays_is_recurring ON holidays(is_recurring);
CREATE INDEX IF NOT EXISTS idx_holidays_active ON holidays(active);

-- Índices compostos para queries comuns
CREATE INDEX IF NOT EXISTS idx_holidays_type_date ON holidays(type, date_field);
CREATE INDEX IF NOT EXISTS idx_holidays_country_type ON holidays(country_id, type);

-- =====================================================
-- PARTE 5: Comentários de documentação
-- =====================================================

COMMENT ON COLUMN holidays.name IS 'Nome do feriado (inglês) - sincronizado com "nome"';
COMMENT ON COLUMN holidays.date_field IS 'Data do feriado - sincronizado com "data"';
COMMENT ON COLUMN holidays.type IS 'Tipo: nacional, estadual, municipal - sincronizado com "tipo"';
COMMENT ON COLUMN holidays.is_recurring IS 'Se é recorrente anualmente - sincronizado com "recorrente"';
COMMENT ON COLUMN holidays.active IS 'Se está ativo - sincronizado com "ativo"';

COMMENT ON TRIGGER trigger_sync_holidays_name ON holidays IS 
  'Sincroniza automaticamente name <-> nome ao inserir/atualizar';
COMMENT ON TRIGGER trigger_sync_holidays_date ON holidays IS 
  'Sincroniza automaticamente date_field <-> data ao inserir/atualizar';
COMMENT ON TRIGGER trigger_sync_holidays_type ON holidays IS 
  'Sincroniza automaticamente type <-> tipo ao inserir/atualizar';
COMMENT ON TRIGGER trigger_sync_holidays_recurring ON holidays IS 
  'Sincroniza automaticamente is_recurring <-> recorrente ao inserir/atualizar';
COMMENT ON TRIGGER trigger_sync_holidays_active ON holidays IS 
  'Sincroniza automaticamente active <-> ativo ao inserir/atualizar';
