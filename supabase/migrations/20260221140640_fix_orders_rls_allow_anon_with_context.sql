/*
  # Corrigir RLS da tabela orders para permitir acesso anon com contexto
  
  1. Problema
    - A função get_orders_prioritized() só tem permissão para authenticated
    - Mas estamos usando role anon com contexto de sessão
    - Erro: "Could not refer to either a PL/pgSQL variable or a table column"
  
  2. Solução
    - Dar permissão EXECUTE para anon
    - Adicionar policies RLS para anon com contexto
    - A função já valida org/env/estab corretamente
  
  3. Segurança
    - Acesso controlado por organization_id e environment_id
    - Sem vazamento entre organizações
*/

-- 1. Dar permissão de execução para anon
GRANT EXECUTE ON FUNCTION get_orders_prioritized() TO anon;

-- 2. Habilitar RLS se ainda não estiver
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 3. Remover policies antigas que podem estar conflitando
DROP POLICY IF EXISTS "orders_anon_select_with_context" ON orders;
DROP POLICY IF EXISTS "orders_anon_insert_with_context" ON orders;
DROP POLICY IF EXISTS "orders_anon_update_with_context" ON orders;
DROP POLICY IF EXISTS "orders_anon_delete_with_context" ON orders;

-- 4. Criar policies para anon com contexto de sessão
CREATE POLICY "orders_anon_select_with_context"
ON orders FOR SELECT TO anon
USING (
  organization_id::text = current_setting('app.current_organization_id', true)
  AND environment_id::text = current_setting('app.current_organization_id', true)
);

CREATE POLICY "orders_anon_insert_with_context"
ON orders FOR INSERT TO anon
WITH CHECK (
  organization_id::text = current_setting('app.current_organization_id', true)
  AND environment_id::text = current_setting('app.current_environment_id', true)
);

CREATE POLICY "orders_anon_update_with_context"
ON orders FOR UPDATE TO anon
USING (
  organization_id::text = current_setting('app.current_organization_id', true)
  AND environment_id::text = current_setting('app.current_environment_id', true)
)
WITH CHECK (
  organization_id::text = current_setting('app.current_organization_id', true)
  AND environment_id::text = current_setting('app.current_environment_id', true)
);

CREATE POLICY "orders_anon_delete_with_context"
ON orders FOR DELETE TO anon
USING (
  organization_id::text = current_setting('app.current_organization_id', true)
  AND environment_id::text = current_setting('app.current_environment_id', true)
);
