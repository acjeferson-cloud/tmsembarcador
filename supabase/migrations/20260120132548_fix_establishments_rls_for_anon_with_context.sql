/*
  # Corrigir RLS de Establishments para ANON com Session Context
  
  ## Problema:
  - Sistema usa auth customizado (não Supabase Auth real)
  - Cliente opera como role ANON (não authenticated)
  - Todas policies eram para authenticated apenas
  - Removi policy permissiva, agora NINGUÉM acessa
  
  ## Solução:
  - Adicionar policies para ANON que respeitam session context
  - Policies filtram por organization_id e environment_id via funções RLS
  - Segurança mantida através de session context setado no login
*/

-- =====================================================
-- POLICIES PARA ANON (com filtros de segurança)
-- =====================================================

-- Policy de SELECT para anon (com filtros)
CREATE POLICY "Anon can view establishments with session context"
  ON establishments FOR SELECT
  TO anon
  USING (
    -- Filtrar por organization_id e environment_id do session context
    organization_id = get_current_organization_id()
    AND environment_id = get_current_environment_id()
  );

-- Policy de INSERT para anon (com filtros)
CREATE POLICY "Anon can insert establishments with session context"
  ON establishments FOR INSERT
  TO anon
  WITH CHECK (
    organization_id = get_current_organization_id()
    AND environment_id = get_current_environment_id()
  );

-- Policy de UPDATE para anon (com filtros)
CREATE POLICY "Anon can update establishments with session context"
  ON establishments FOR UPDATE
  TO anon
  USING (
    organization_id = get_current_organization_id()
    AND environment_id = get_current_environment_id()
  )
  WITH CHECK (
    organization_id = get_current_organization_id()
    AND environment_id = get_current_environment_id()
  );

-- Policy de DELETE para anon (com filtros)
CREATE POLICY "Anon can delete establishments with session context"
  ON establishments FOR DELETE
  TO anon
  USING (
    organization_id = get_current_organization_id()
    AND environment_id = get_current_environment_id()
  );

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON POLICY "Anon can view establishments with session context" ON establishments IS 
'Permite role anon ver estabelecimentos, mas APENAS da org/env setada no session context via set_session_context()';

COMMENT ON POLICY "Anon can insert establishments with session context" ON establishments IS 
'Permite role anon criar estabelecimentos, mas APENAS na org/env setada no session context';

COMMENT ON POLICY "Anon can update establishments with session context" ON establishments IS 
'Permite role anon atualizar estabelecimentos, mas APENAS da org/env setada no session context';

COMMENT ON POLICY "Anon can delete establishments with session context" ON establishments IS 
'Permite role anon deletar estabelecimentos, mas APENAS da org/env setada no session context';
