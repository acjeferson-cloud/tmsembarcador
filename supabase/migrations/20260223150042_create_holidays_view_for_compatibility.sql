/*
  # Criar view holidays para compatibilidade com service

  1. Problema
    - Service usa campo 'date' (palavra reservada no SQL)
    - Banco usa 'data' e 'date_field'
    - Necessário mapear corretamente

  2. Solução
    - Manter tabela original 'holidays'
    - Garantir que triggers sincronizam data <-> date_field
    - SELECT usa 'data' como 'date' no resultado
*/

-- Não é necessário view, apenas ajustar o SELECT
-- O campo 'data' já existe e funciona

-- Atualizar comentários
COMMENT ON COLUMN holidays.data IS 'Data do feriado - campo principal usado nas queries (sincronizado com date_field)';
COMMENT ON COLUMN holidays.date_field IS 'Data do feriado - campo alternativo em inglês (sincronizado com data)';

-- Garantir que todos os registros tenham data sincronizada
UPDATE holidays SET date_field = data WHERE date_field IS NULL AND data IS NOT NULL;
UPDATE holidays SET data = date_field WHERE data IS NULL AND date_field IS NOT NULL;
