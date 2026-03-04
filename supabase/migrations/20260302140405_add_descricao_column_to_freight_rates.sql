/*
  # Adicionar coluna descricao à tabela freight_rates

  Correção urgente: O frontend está tentando usar a coluna 'descricao' que não existe.
  
  1. Adicionar coluna descricao (text, nullable)
  2. Manter compatibilidade com dados existentes
*/

-- Adicionar coluna descricao
ALTER TABLE freight_rates 
ADD COLUMN IF NOT EXISTS descricao TEXT;

-- Log sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Coluna descricao adicionada à tabela freight_rates';
END $$;
