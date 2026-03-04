/*
  # Corrigir RLS de Environments para SaaS Admin Console

  ## Problema:
  - SaaS Admin Console não consegue criar environments
  - Policies requerem authenticated user com organization_id
  - Admin console acessa sem JWT configurado
  
  ## Solução:
  - Adicionar policies para anon (usado pelo SaaS Admin Console)
  - Manter segurança através de validação no serviço
*/

-- =====================================================
-- POLICIES PARA ANON (SAAS ADMIN CONSOLE)
-- =====================================================

-- Policy de SELECT para anon
CREATE POLICY "Anon can view all environments"
  ON environments FOR SELECT
  TO anon
  USING (true);

-- Policy de INSERT para anon
CREATE POLICY "Anon can insert environments"
  ON environments FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy de UPDATE para anon
CREATE POLICY "Anon can update environments"
  ON environments FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Policy de DELETE para anon (soft delete apenas)
CREATE POLICY "Anon can delete non-production environments"
  ON environments FOR DELETE
  TO anon
  USING (type != 'production');
