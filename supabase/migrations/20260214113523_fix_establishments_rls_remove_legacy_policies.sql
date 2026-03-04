/*
  # Remover policies legadas de establishments

  ## Descrição
  Remove policies antigas que permitiam acesso quando organization_id/environment_id eram NULL,
  mantendo apenas as policies de isolamento estritas.

  ## Mudanças
  1. Remove establishments_select_policy (legada)
  2. Remove establishments_insert_policy (legada)
  3. Remove establishments_update_policy (legada)
  4. Mantém apenas as policies _isolation_* para isolamento estrito

  ## Segurança
  - Garante isolamento estrito multi-tenant
  - Previne vazamento de dados entre organizações/ambientes
*/

-- Remover policies legadas
DROP POLICY IF EXISTS "establishments_select_policy" ON establishments;
DROP POLICY IF EXISTS "establishments_insert_policy" ON establishments;
DROP POLICY IF EXISTS "establishments_update_policy" ON establishments;
