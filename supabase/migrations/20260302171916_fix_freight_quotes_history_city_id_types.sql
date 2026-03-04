/*
  # Corrigir tipos de colunas city_id na freight_quotes_history

  1. Alterações
    - Alterar origin_city_id de integer para uuid
    - Alterar destination_city_id de integer para uuid
    - Adicionar foreign keys para cities(id)
  
  2. Segurança
    - Manter RLS existente
*/

-- Remover constraints antigas se existirem
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'freight_quotes_history_origin_city_id_fkey'
  ) THEN
    ALTER TABLE freight_quotes_history DROP CONSTRAINT freight_quotes_history_origin_city_id_fkey;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'freight_quotes_history_destination_city_id_fkey'
  ) THEN
    ALTER TABLE freight_quotes_history DROP CONSTRAINT freight_quotes_history_destination_city_id_fkey;
  END IF;
END $$;

-- Alterar tipos de colunas
ALTER TABLE freight_quotes_history 
  ALTER COLUMN origin_city_id TYPE uuid USING origin_city_id::text::uuid,
  ALTER COLUMN destination_city_id TYPE uuid USING destination_city_id::text::uuid;

-- Adicionar foreign keys
ALTER TABLE freight_quotes_history
  ADD CONSTRAINT freight_quotes_history_origin_city_id_fkey 
    FOREIGN KEY (origin_city_id) REFERENCES cities(id) ON DELETE SET NULL;

ALTER TABLE freight_quotes_history
  ADD CONSTRAINT freight_quotes_history_destination_city_id_fkey 
    FOREIGN KEY (destination_city_id) REFERENCES cities(id) ON DELETE SET NULL;