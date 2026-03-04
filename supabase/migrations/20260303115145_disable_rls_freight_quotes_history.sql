/*
  # Desabilitar RLS na tabela freight_quotes_history

  1. Mudanças
    - Remove todas as políticas RLS existentes
    - Desabilita completamente o RLS na tabela freight_quotes_history

  2. Motivo
    - Seguir o padrão das outras tabelas do sistema
    - Eliminar erros de violação de políticas RLS
    - Permitir operações de INSERT/UPDATE/DELETE sem restrições
*/

-- Remove todas as políticas existentes
DROP POLICY IF EXISTS "allow_anon_insert_freight_quotes_history" ON freight_quotes_history;
DROP POLICY IF EXISTS "allow_anon_select_freight_quotes_history" ON freight_quotes_history;
DROP POLICY IF EXISTS "allow_anon_update_freight_quotes_history" ON freight_quotes_history;
DROP POLICY IF EXISTS "allow_anon_delete_freight_quotes_history" ON freight_quotes_history;

-- Desabilita RLS completamente
ALTER TABLE freight_quotes_history DISABLE ROW LEVEL SECURITY;