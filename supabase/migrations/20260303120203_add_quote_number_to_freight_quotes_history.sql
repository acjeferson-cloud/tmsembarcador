/*
  # Adicionar numeração sequencial ao histórico de cotações

  1. Alterações
    - Adiciona coluna `quote_number` (INTEGER) para numeração sequencial única
    - Cria sequência `freight_quotes_history_quote_number_seq` iniciando em 1
    - Define valor padrão da coluna para usar a sequência automaticamente
    - Adiciona índice para melhorar performance de consultas
  
  2. Objetivo
    - Cada cotação terá um número sequencial único iniciando pelo 1
    - A numeração é gerada automaticamente ao inserir novo registro
*/

-- Criar sequência para numeração das cotações
CREATE SEQUENCE IF NOT EXISTS freight_quotes_history_quote_number_seq START WITH 1 INCREMENT BY 1;

-- Adicionar coluna quote_number à tabela
ALTER TABLE freight_quotes_history 
ADD COLUMN IF NOT EXISTS quote_number INTEGER DEFAULT nextval('freight_quotes_history_quote_number_seq');

-- Criar índice para melhorar consultas por número de cotação
CREATE INDEX IF NOT EXISTS idx_freight_quotes_history_quote_number ON freight_quotes_history(quote_number);

-- Adicionar comentário na coluna
COMMENT ON COLUMN freight_quotes_history.quote_number IS 'Número sequencial único da cotação, gerado automaticamente';