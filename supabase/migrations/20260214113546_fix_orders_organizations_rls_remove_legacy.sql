/*
  # Remover policies legadas de orders e organizations

  ## Descrição
  Remove policies antigas que permitiam acesso quando organization_id/environment_id eram NULL,
  mantendo apenas as policies de isolamento estritas.

  ## Mudanças
  1. Remove orders_select_policy, orders_insert_policy, orders_update_policy (legadas)
  2. Remove organizations_select_policy (legada)
  3. Mantém apenas as policies _isolation_* para isolamento estrito

  ## Segurança
  - Garante isolamento estrito multi-tenant
  - Previne vazamento de dados entre organizações/ambientes
*/

-- Remover policies legadas de orders
DROP POLICY IF EXISTS "orders_select_policy" ON orders;
DROP POLICY IF EXISTS "orders_insert_policy" ON orders;
DROP POLICY IF EXISTS "orders_update_policy" ON orders;

-- Remover policies legadas de organizations
DROP POLICY IF EXISTS "organizations_select_policy" ON organizations;
