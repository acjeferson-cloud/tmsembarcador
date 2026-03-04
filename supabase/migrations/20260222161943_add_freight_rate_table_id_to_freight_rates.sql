/*
  # Adicionar freight_rate_table_id à tabela freight_rates

  1. Alterações
    - Adiciona coluna `freight_rate_table_id` (uuid) à tabela `freight_rates`
    - Cria foreign key para freight_rate_tables
    - Cria índice para performance

  2. Notas
    - Permite vincular tarifas às tabelas de frete
    - Mantém compatibilidade com dados existentes (nullable)
*/

-- Adicionar coluna freight_rate_table_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'freight_rates' 
    AND column_name = 'freight_rate_table_id'
  ) THEN
    ALTER TABLE freight_rates ADD COLUMN freight_rate_table_id uuid;
    
    -- Adicionar foreign key
    ALTER TABLE freight_rates
      ADD CONSTRAINT fk_freight_rates_table
      FOREIGN KEY (freight_rate_table_id)
      REFERENCES freight_rate_tables(id)
      ON DELETE CASCADE;
    
    -- Criar índice
    CREATE INDEX idx_freight_rates_table_id ON freight_rates(freight_rate_table_id);
  END IF;
END $$;
