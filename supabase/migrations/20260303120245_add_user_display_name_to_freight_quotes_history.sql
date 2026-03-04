/*
  # Adicionar campo para nome formatado do usuário

  1. Alterações
    - Adiciona coluna `user_display_name` (TEXT) para armazenar o nome formatado do usuário
    - Formato: 0000-Nome Completo (código do usuário + nome)
  
  2. Objetivo
    - Permitir exibir o usuário que realizou a cotação no formato legível
    - Evitar joins adicionais para mostrar o nome do usuário
*/

-- Adicionar coluna user_display_name
ALTER TABLE freight_quotes_history 
ADD COLUMN IF NOT EXISTS user_display_name TEXT;

-- Adicionar comentário na coluna
COMMENT ON COLUMN freight_quotes_history.user_display_name IS 'Nome formatado do usuário no formato: 0000-Nome Completo';