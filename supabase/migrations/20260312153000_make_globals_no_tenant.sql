/*
  # Transformando Cadastros Base em Dados Globais
  
  Descrição:
  Países, Estados, Cidades, Ocorrências e Motivos de Rejeição agora são listas puramente GLOBAIS.
  1. Remove as colunas organization_id e environment_id de `occurrences` e `rejection_reasons`.
  2. Altera a Constraint Unique delas para abranger apenas o código.
  3. Modifica as políticas RLS (Row Level Security) destas 5 tabelas para:
     - LEITURA (SELECT): Para todos do sistema (Autenticados ou Anon).
     - ESCRITA (INSERT, UPDATE, DELETE): APENAS para o administrador global "jeferson.costa@logaxis.com.br".
*/

-- ==========================================
-- 1. OCORRÊNCIAS
-- ==========================================

-- A) Remover constraints únicas antigas que dependiam do organization_id (se existirem)
DO $$
DECLARE
    row record;
BEGIN
    FOR row IN
        SELECT DISTINCT tc.constraint_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.table_schema = 'public'
          AND tc.table_name = 'occurrences'
          AND tc.constraint_type = 'UNIQUE'
    LOOP
        EXECUTE 'ALTER TABLE occurrences DROP CONSTRAINT ' || quote_ident(row.constraint_name);
    END LOOP;
END;
$$;

-- B) Remover as colunas de inquilinato
ALTER TABLE occurrences DROP COLUMN IF EXISTS organization_id;
ALTER TABLE occurrences DROP COLUMN IF EXISTS environment_id;

-- C) Criar restrição única apenas global no código
ALTER TABLE occurrences ADD CONSTRAINT occurrences_codigo_key UNIQUE(codigo);

-- D) Limpar políticas antigas
DROP POLICY IF EXISTS "Users can read occurrences in their org/env" ON occurrences;
DROP POLICY IF EXISTS "Users can insert occurrences in their org" ON occurrences;
DROP POLICY IF EXISTS "Users can update occurrences in their org" ON occurrences;
DROP POLICY IF EXISTS "Users can delete occurrences in their org" ON occurrences;
DROP POLICY IF EXISTS "Enable read access for all users on occurrences" ON occurrences;
DROP POLICY IF EXISTS "Enable insert access for all users on occurrences" ON occurrences;
DROP POLICY IF EXISTS "Enable update access for all users on occurrences" ON occurrences;
DROP POLICY IF EXISTS "Enable delete access for all users on occurrences" ON occurrences;

-- E) Aplicar novas Políticas Globais
CREATE POLICY "Enable Global Read for Occurrences"
  ON occurrences FOR SELECT
  USING (true);

CREATE POLICY "Enable Admin Insert for Occurrences"
  ON occurrences FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = 'jeferson.costa@logaxis.com.br');

CREATE POLICY "Enable Admin Update for Occurrences"
  ON occurrences FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'jeferson.costa@logaxis.com.br');

CREATE POLICY "Enable Admin Delete for Occurrences"
  ON occurrences FOR DELETE
  USING (auth.jwt() ->> 'email' = 'jeferson.costa@logaxis.com.br');


-- ==========================================
-- 2. MOTIVOS DE REJEIÇÕES
-- ==========================================

-- A) Remover constraints únicas antigas
DO $$
DECLARE
    row record;
BEGIN
    FOR row IN
        SELECT DISTINCT tc.constraint_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.table_schema = 'public'
          AND tc.table_name = 'rejection_reasons'
          AND tc.constraint_type = 'UNIQUE'
    LOOP
        EXECUTE 'ALTER TABLE rejection_reasons DROP CONSTRAINT ' || quote_ident(row.constraint_name);
    END LOOP;
END;
$$;

-- B) Remover as colunas de inquilinato
ALTER TABLE rejection_reasons DROP COLUMN IF EXISTS organization_id;
ALTER TABLE rejection_reasons DROP COLUMN IF EXISTS environment_id;

-- C) Criar restrição única apenas global no código
ALTER TABLE rejection_reasons ADD CONSTRAINT rejection_reasons_codigo_key UNIQUE(codigo);

-- D) Limpar políticas antigas
DROP POLICY IF EXISTS "Users can read rejection_reasons in their org/env" ON rejection_reasons;
DROP POLICY IF EXISTS "Enable read access for all users on rejection_reasons" ON rejection_reasons;
DROP POLICY IF EXISTS "Enable insert access for all users on rejection_reasons" ON rejection_reasons;
DROP POLICY IF EXISTS "Enable update access for all users on rejection_reasons" ON rejection_reasons;
DROP POLICY IF EXISTS "Enable delete access for all users on rejection_reasons" ON rejection_reasons;

-- E) Aplicar novas Políticas Globais
CREATE POLICY "Enable Global Read for Rejection Reasons"
  ON rejection_reasons FOR SELECT
  USING (true);

CREATE POLICY "Enable Admin Insert for Rejection Reasons"
  ON rejection_reasons FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = 'jeferson.costa@logaxis.com.br');

CREATE POLICY "Enable Admin Update for Rejection Reasons"
  ON rejection_reasons FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'jeferson.costa@logaxis.com.br');

CREATE POLICY "Enable Admin Delete for Rejection Reasons"
  ON rejection_reasons FOR DELETE
  USING (auth.jwt() ->> 'email' = 'jeferson.costa@logaxis.com.br');


-- ==========================================
-- 3. PAÍSES (Já não tinha tenant, aplicar segurança Admin)
-- ==========================================
DROP POLICY IF EXISTS "Public read countries" ON countries;
DROP POLICY IF EXISTS "Enable insert access for all users on countries" ON countries;
DROP POLICY IF EXISTS "Enable update access for all users on countries" ON countries;
DROP POLICY IF EXISTS "Enable delete access for all users on countries" ON countries;

CREATE POLICY "Enable Global Read for Countries"
  ON countries FOR SELECT
  USING (true);

CREATE POLICY "Enable Admin Insert for Countries"
  ON countries FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = 'jeferson.costa@logaxis.com.br');

CREATE POLICY "Enable Admin Update for Countries"
  ON countries FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'jeferson.costa@logaxis.com.br');

CREATE POLICY "Enable Admin Delete for Countries"
  ON countries FOR DELETE
  USING (auth.jwt() ->> 'email' = 'jeferson.costa@logaxis.com.br');


-- ==========================================
-- 4. ESTADOS (Já não tinha tenant, aplicar segurança Admin)
-- ==========================================
DROP POLICY IF EXISTS "Public read states" ON states;
DROP POLICY IF EXISTS "Enable insert access for all users on states" ON states;
DROP POLICY IF EXISTS "Enable update access for all users on states" ON states;
DROP POLICY IF EXISTS "Enable delete access for all users on states" ON states;

CREATE POLICY "Enable Global Read for States"
  ON states FOR SELECT
  USING (true);

CREATE POLICY "Enable Admin Insert for States"
  ON states FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = 'jeferson.costa@logaxis.com.br');

CREATE POLICY "Enable Admin Update for States"
  ON states FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'jeferson.costa@logaxis.com.br');

CREATE POLICY "Enable Admin Delete for States"
  ON states FOR DELETE
  USING (auth.jwt() ->> 'email' = 'jeferson.costa@logaxis.com.br');


-- ==========================================
-- 5. CIDADES (Já não tinha tenant, aplicar segurança Admin)
-- ==========================================
DROP POLICY IF EXISTS "Public read cities" ON cities;
DROP POLICY IF EXISTS "Enable insert access for all users on cities" ON cities;
DROP POLICY IF EXISTS "Enable update access for all users on cities" ON cities;
DROP POLICY IF EXISTS "Enable delete access for all users on cities" ON cities;

CREATE POLICY "Enable Global Read for Cities"
  ON cities FOR SELECT
  USING (true);

CREATE POLICY "Enable Admin Insert for Cities"
  ON cities FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = 'jeferson.costa@logaxis.com.br');

CREATE POLICY "Enable Admin Update for Cities"
  ON cities FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'jeferson.costa@logaxis.com.br');

CREATE POLICY "Enable Admin Delete for Cities"
  ON cities FOR DELETE
  USING (auth.jwt() ->> 'email' = 'jeferson.costa@logaxis.com.br');
