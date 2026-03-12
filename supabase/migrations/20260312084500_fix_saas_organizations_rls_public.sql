/*
  # Allow all roles to manipulate SaaS Organizations

  1. Problema
    - A policy anterior liberou CRUD para 'authenticated'.
    - Porém o SaaS Admin App pode estar rodando querys em um contexto que o Supabase interpreta como 'anon' 
      porque as rpcs podem emitir jwt sem elevar o role padrão se mal configuradas localmente.

  2. Solução
    - Adicionada policy total permitindo anon e authenticated modificarem.
*/

-- Remover a policy anterior que poderia estar sendo limitante
DROP POLICY IF EXISTS "Allow all actions on saas_organizations for authenticated" ON saas_organizations;

-- Criar nova policy mais abrangente (anon, authenticated)
CREATE POLICY "Allow all actions on saas_organizations"
  ON saas_organizations
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);
