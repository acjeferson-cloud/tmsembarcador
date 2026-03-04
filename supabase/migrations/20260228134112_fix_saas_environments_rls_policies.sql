/*
  # Corrigir políticas RLS da tabela saas_environments

  1. Problema
    - Tabela saas_environments só tem política de SELECT
    - Faltam políticas de UPDATE para permitir atualizar logo_url e outros campos
  
  2. Solução
    - Adicionar políticas de INSERT, UPDATE e DELETE para authenticated
    - Manter política de SELECT para anon (necessária para login)
*/

-- Política de INSERT para usuários autenticados
CREATE POLICY "Authenticated users can insert saas_environments"
  ON saas_environments FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política de UPDATE para usuários autenticados
CREATE POLICY "Authenticated users can update saas_environments"
  ON saas_environments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política de DELETE para usuários autenticados (soft delete via status)
CREATE POLICY "Authenticated users can delete saas_environments"
  ON saas_environments FOR DELETE
  TO authenticated
  USING (true);

COMMENT ON POLICY "Authenticated users can insert saas_environments" ON saas_environments IS
  'Permite que usuários autenticados criem novos environments';

COMMENT ON POLICY "Authenticated users can update saas_environments" ON saas_environments IS
  'Permite que usuários autenticados atualizem environments (incluindo logo_url)';

COMMENT ON POLICY "Authenticated users can delete saas_environments" ON saas_environments IS
  'Permite que usuários autenticados removam environments';
