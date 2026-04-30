-- Adiciona a coluna metadata do tipo JSONB na tabela vehicles
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
