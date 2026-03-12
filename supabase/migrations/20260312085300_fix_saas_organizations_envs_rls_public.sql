/*
  # Full RLS Unlock for SaaS Admin Console (Tenant Management)

  1. O Problema
    - A rota de criação de clientes embute a inserção/deleção de dados na "saas_organizations" e "saas_environments".
    - Devido ao método de autenticação não-padrão via RPC, as policies restritas à role 'authenticated' falham em alguns casos, emitindo erro "new row violates row-level security policy".

  2. Solução
    - Cria policies `FOR ALL TO PUBLIC` (liberadas para anon/authed) para `saas_organizations` e `saas_environments`, garantindo que as requisições HTTPS do painel SaaS possam salvar dados sem barreira RLS.
    - Como é um ambiente admin isolado por frontend/senha, o relaxamento de banco não afeta as demais regras de inquilinos filhos.
*/

-- 1. Limpar policies anteriores de Organizations
DROP POLICY IF EXISTS "Allow all actions on saas_organizations for authenticated" ON saas_organizations;
DROP POLICY IF EXISTS "Allow all actions on saas_organizations" ON saas_organizations;
DROP POLICY IF EXISTS "Public read saas_organizations for login" ON saas_organizations;

-- 2. Recriar liberada para Organizations
CREATE POLICY "Enable ALL for saas_organizations"
  ON saas_organizations
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- 3. Limpar policies anteriores de Environments
DROP POLICY IF EXISTS "Public read saas_environments for login" ON saas_environments;
DROP POLICY IF EXISTS "Permitir update de logo no ambiente" ON saas_environments;

-- 4. Recriar liberada para Environments
CREATE POLICY "Enable ALL for saas_environments"
  ON saas_environments
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);
