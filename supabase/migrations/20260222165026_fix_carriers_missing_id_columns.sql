/*
  # Adicionar colunas de ID faltantes na tabela carriers

  1. Alterações na tabela carriers
    - Adicionar cidade_id para referência à tabela cities
    - Adicionar estado_id para referência à tabela states
    - Adicionar pais_id para referência à tabela countries
    
  2. Segurança
    - Manter RLS policies existentes
*/

-- Adicionar cidade_id à tabela carriers se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'carriers' AND column_name = 'cidade_id'
  ) THEN
    ALTER TABLE carriers ADD COLUMN cidade_id UUID REFERENCES cities(id);
  END IF;
END $$;

-- Adicionar estado_id à tabela carriers se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'carriers' AND column_name = 'estado_id'
  ) THEN
    ALTER TABLE carriers ADD COLUMN estado_id UUID REFERENCES states(id);
  END IF;
END $$;

-- Adicionar pais_id à tabela carriers se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'carriers' AND column_name = 'pais_id'
  ) THEN
    ALTER TABLE carriers ADD COLUMN pais_id UUID REFERENCES countries(id);
  END IF;
END $$;
