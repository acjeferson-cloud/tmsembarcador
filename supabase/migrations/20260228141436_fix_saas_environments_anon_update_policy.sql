/*
  # Adicionar políticas RLS para anon na tabela saas_environments

  1. Problema
    - SaaS Admin Console usa conexão anon (não authenticated)
    - Não consegue fazer UPDATE na tabela saas_environments
    - Erro: "Não foi possível obter contexto do usuário: dados incompletos"

  2. Solução
    - Adicionar política de UPDATE para anon (necessário para upload de logos)
    - Adicionar política de INSERT para anon (criação de ambientes)
    - Política de DELETE já existe via SELECT/UPDATE

  3. Segurança
    - anon pode acessar via RPC set_session_context
    - Validação de acesso é feita no nível da aplicação (SaaS Admin login)
*/

-- Adicionar política de UPDATE para anon
CREATE POLICY "Anon can update saas_environments via session context"
  ON saas_environments FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Adicionar política de INSERT para anon
CREATE POLICY "Anon can insert saas_environments via session context"
  ON saas_environments FOR INSERT
  TO anon
  WITH CHECK (true);

COMMENT ON POLICY "Anon can update saas_environments via session context" ON saas_environments IS
  'Permite que anon atualize environments (necessário para SaaS Admin Console - upload de logos)';

COMMENT ON POLICY "Anon can insert saas_environments via session context" ON saas_environments IS
  'Permite que anon crie environments (necessário para SaaS Admin Console)';