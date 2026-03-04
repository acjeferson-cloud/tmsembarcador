/*
  # Adicionar coluna logotipo à tabela carriers

  1. Alterações
    - Adiciona coluna `logotipo` (text) à tabela `carriers`
    - Permite armazenar imagens em formato Base64
    - Coluna opcional (nullable)

  2. Notas
    - A coluna armazenará strings Base64 de imagens
    - Não afeta dados existentes
*/

-- Adicionar coluna logotipo se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'carriers' 
    AND column_name = 'logotipo'
  ) THEN
    ALTER TABLE carriers ADD COLUMN logotipo text;
  END IF;
END $$;
