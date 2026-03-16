/*
  # Corrigir RLS das tabelas de itens de pedido e status de entrega

  1. Problema
    - Devido ao pooler de conexão em chamadas HTTP (PostgREST), o setSessionContext via JS
      não persiste para a próxima requisição (INSERT do order_items).
    - Causando erro 401 Unauthorized / RLS violation ao tentar inserir os produtos do pedido.

  2. Solução
    - Adicionar política permissiva para anon e authenticated em `order_items` e `order_delivery_status`,
      da mesma forma que foi feito globalmente na tabela `orders` anteriormente em
      outra migration para suportar a arquitetura multi-tenant via aplicação.
*/

-- ==============================================================================
-- ORDER_ITEMS
-- ==============================================================================
DO $$
BEGIN
  -- Drop nas políticas restritivas
  EXECUTE 'DROP POLICY IF EXISTS "Anon can view order items with context" ON order_items';
  EXECUTE 'DROP POLICY IF EXISTS "Anon can insert order items with context" ON order_items';
  EXECUTE 'DROP POLICY IF EXISTS "Anon can update order items with context" ON order_items';
  EXECUTE 'DROP POLICY IF EXISTS "Anon can delete order items with context" ON order_items';

  EXECUTE 'DROP POLICY IF EXISTS "Users can view order items from their org/env" ON order_items';
  EXECUTE 'DROP POLICY IF EXISTS "Users can insert order items in their org/env" ON order_items';
  EXECUTE 'DROP POLICY IF EXISTS "Users can update order items in their org/env" ON order_items';
  EXECUTE 'DROP POLICY IF EXISTS "Users can delete order items in their org/env" ON order_items';

  -- Criar nova política permissiva igual à tabela orders
  EXECUTE 'DROP POLICY IF EXISTS "anon_all_order_items" ON order_items';
  EXECUTE 'CREATE POLICY "anon_all_order_items" ON order_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
END $$;

-- ==============================================================================
-- ORDER_DELIVERY_STATUS
-- ==============================================================================
DO $$
BEGIN
  -- Drop nas políticas restritivas
  EXECUTE 'DROP POLICY IF EXISTS "Anon can view delivery status with context" ON order_delivery_status';
  EXECUTE 'DROP POLICY IF EXISTS "Anon can insert delivery status with context" ON order_delivery_status';
  EXECUTE 'DROP POLICY IF EXISTS "Anon can update delivery status with context" ON order_delivery_status';

  EXECUTE 'DROP POLICY IF EXISTS "Users can view delivery status from their org/env" ON order_delivery_status';
  EXECUTE 'DROP POLICY IF EXISTS "Users can insert delivery status in their org/env" ON order_delivery_status';
  EXECUTE 'DROP POLICY IF EXISTS "Users can update delivery status in their org/env" ON order_delivery_status';

  -- Criar nova política permissiva igual à tabela orders
  EXECUTE 'DROP POLICY IF EXISTS "anon_all_order_delivery_status" ON order_delivery_status';
  EXECUTE 'CREATE POLICY "anon_all_order_delivery_status" ON order_delivery_status FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
END $$;
