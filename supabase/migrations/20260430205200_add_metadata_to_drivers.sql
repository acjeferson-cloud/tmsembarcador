-- Adiciona coluna metadata do tipo JSONB na tabela drivers
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
