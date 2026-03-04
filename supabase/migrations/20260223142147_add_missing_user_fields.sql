/*
  # Adicionar campos faltantes na tabela users

  1. Novos Campos
    - celular (text) - Número de celular
    - data_admissao (date) - Data de admissão do funcionário
    - data_nascimento (date) - Data de nascimento
    - endereco (text) - Endereço completo
    - bairro (text) - Bairro
    - cep (text) - CEP
    - cidade (text) - Cidade
    - estado (text) - Estado (UF)
    - observacoes (text) - Observações gerais
    - foto_perfil_url (text) - URL da foto de perfil
    - preferred_language (text) - Idioma preferido do usuário
    - estabelecimentos_permitidos (jsonb) - Lista de estabelecimentos que o usuário tem acesso
    - created_by (uuid) - ID do usuário que criou este registro

  2. Verificação
    - Adiciona colunas apenas se não existirem (IF NOT EXISTS)
    - Mantém dados existentes intactos
*/

-- Adicionar coluna celular se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'celular'
  ) THEN
    ALTER TABLE users ADD COLUMN celular text;
  END IF;
END $$;

-- Adicionar coluna data_admissao se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'data_admissao'
  ) THEN
    ALTER TABLE users ADD COLUMN data_admissao date;
  END IF;
END $$;

-- Adicionar coluna data_nascimento se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'data_nascimento'
  ) THEN
    ALTER TABLE users ADD COLUMN data_nascimento date;
  END IF;
END $$;

-- Adicionar coluna endereco se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'endereco'
  ) THEN
    ALTER TABLE users ADD COLUMN endereco text;
  END IF;
END $$;

-- Adicionar coluna bairro se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'bairro'
  ) THEN
    ALTER TABLE users ADD COLUMN bairro text;
  END IF;
END $$;

-- Adicionar coluna cep se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'cep'
  ) THEN
    ALTER TABLE users ADD COLUMN cep text;
  END IF;
END $$;

-- Adicionar coluna cidade se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'cidade'
  ) THEN
    ALTER TABLE users ADD COLUMN cidade text;
  END IF;
END $$;

-- Adicionar coluna estado se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'estado'
  ) THEN
    ALTER TABLE users ADD COLUMN estado text;
  END IF;
END $$;

-- Adicionar coluna observacoes se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'observacoes'
  ) THEN
    ALTER TABLE users ADD COLUMN observacoes text;
  END IF;
END $$;

-- Adicionar coluna foto_perfil_url se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'foto_perfil_url'
  ) THEN
    ALTER TABLE users ADD COLUMN foto_perfil_url text;
  END IF;
END $$;

-- Adicionar coluna preferred_language se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'preferred_language'
  ) THEN
    ALTER TABLE users ADD COLUMN preferred_language text DEFAULT 'pt' CHECK (preferred_language IN ('pt', 'en', 'es'));
  END IF;
END $$;

-- Adicionar coluna estabelecimentos_permitidos se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'estabelecimentos_permitidos'
  ) THEN
    ALTER TABLE users ADD COLUMN estabelecimentos_permitidos jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Adicionar coluna created_by se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE users ADD COLUMN created_by uuid REFERENCES users(id);
  END IF;
END $$;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_celular ON users(celular);
CREATE INDEX IF NOT EXISTS idx_users_cep ON users(cep);
CREATE INDEX IF NOT EXISTS idx_users_cidade ON users(cidade);
CREATE INDEX IF NOT EXISTS idx_users_estado ON users(estado);
CREATE INDEX IF NOT EXISTS idx_users_data_admissao ON users(data_admissao);
CREATE INDEX IF NOT EXISTS idx_users_preferred_language ON users(preferred_language);
CREATE INDEX IF NOT EXISTS idx_users_created_by ON users(created_by);

-- Comentários nas colunas para documentação
COMMENT ON COLUMN users.celular IS 'Número de celular do usuário';
COMMENT ON COLUMN users.data_admissao IS 'Data de admissão do funcionário';
COMMENT ON COLUMN users.data_nascimento IS 'Data de nascimento';
COMMENT ON COLUMN users.endereco IS 'Endereço completo (logradouro + número + complemento)';
COMMENT ON COLUMN users.bairro IS 'Bairro';
COMMENT ON COLUMN users.cep IS 'CEP no formato XXXXX-XXX';
COMMENT ON COLUMN users.cidade IS 'Nome da cidade';
COMMENT ON COLUMN users.estado IS 'Sigla do estado (UF)';
COMMENT ON COLUMN users.observacoes IS 'Observações gerais sobre o usuário';
COMMENT ON COLUMN users.foto_perfil_url IS 'URL pública da foto de perfil no storage';
COMMENT ON COLUMN users.preferred_language IS 'Idioma preferido do usuário (pt, en, es)';
COMMENT ON COLUMN users.estabelecimentos_permitidos IS 'Array JSON com IDs dos estabelecimentos que o usuário tem acesso';
COMMENT ON COLUMN users.created_by IS 'ID do usuário que criou este registro';
