/*
  # Limpar histórico de cotações e resetar sequência

  1. Alterações
    - Apaga todos os registros existentes da tabela freight_quotes_history
    - Reseta a sequência quote_number para iniciar do 1 novamente
  
  2. Objetivo
    - Começar com histórico limpo e numeração sequencial a partir de 1
*/

-- Apagar todos os registros existentes
DELETE FROM freight_quotes_history;

-- Resetar a sequência para iniciar do 1
ALTER SEQUENCE freight_quotes_history_quote_number_seq RESTART WITH 1;