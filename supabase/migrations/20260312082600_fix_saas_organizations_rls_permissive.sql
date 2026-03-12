/*
  # Fix RLS for SaaS Organizations

  1. Problema
    - A tabela `saas_organizations` tem o Row Level Security ativado desde a criação 
    - Apenas policies de leitura pública ("Public read saas_organizations for login") foram definidas
    - Inserções e atualizações via painel SaaS Console Admin falhavam silenciosamente porque o Super Admin estava sendo bloqueado por falta de policy permissiva

  2. Solução
    - Adicionadas policies permissivas completas (SELECT, INSERT, UPDATE, DELETE) para a role 'authenticated' poder gerenciar clientes no painel SaaS Master.
*/

CREATE POLICY "Allow all actions on saas_organizations for authenticated"
  ON saas_organizations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
