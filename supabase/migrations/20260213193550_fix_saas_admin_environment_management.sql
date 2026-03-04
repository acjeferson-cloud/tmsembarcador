/*
  # Correção: Permitir SaaS Admin gerenciar environments

  1. Problema
    - SaaS Admin não consegue criar/gerenciar environments
    - RLS policies bloqueiam operações porque não há session context configurado
  
  2. Solução
    - Criar função helper para verificar se usuário é SaaS Admin
    - Criar policies específicas para SaaS Admin que bypassam verificação de organization_id
    - Manter policies existentes para usuários normais

  3. Segurança
    - SaaS Admin tem acesso total a environments (necessário para gerenciamento)
    - Usuários normais continuam isolados por organization
*/

-- 1. Criar função helper para verificar se é SaaS Admin
CREATE OR REPLACE FUNCTION is_saas_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Verifica se o usuário tem a flag is_saas_admin no auth.users metadata
  RETURN COALESCE(
    (SELECT raw_app_meta_data->>'is_saas_admin' = 'true'
     FROM auth.users
     WHERE id = auth.uid()),
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Dropar policies antigas para environments
DROP POLICY IF EXISTS "environments_isolation_select" ON environments;
DROP POLICY IF EXISTS "environments_isolation_insert" ON environments;
DROP POLICY IF EXISTS "environments_isolation_update" ON environments;
DROP POLICY IF EXISTS "environments_isolation_delete" ON environments;

-- 3. Criar novas policies que permitem SaaS Admin ou isolamento por organization

-- SELECT: SaaS Admin vê tudo, usuários normais veem apenas da sua organization
CREATE POLICY "environments_select_policy"
  ON environments FOR SELECT
  TO anon
  USING (
    is_saas_admin() OR
    organization_id = get_session_organization_id()
  );

-- INSERT: SaaS Admin pode criar em qualquer organization, usuários normais apenas na sua
CREATE POLICY "environments_insert_policy"
  ON environments FOR INSERT
  TO anon
  WITH CHECK (
    is_saas_admin() OR
    organization_id = get_session_organization_id()
  );

-- UPDATE: SaaS Admin pode atualizar qualquer, usuários normais apenas da sua organization
CREATE POLICY "environments_update_policy"
  ON environments FOR UPDATE
  TO anon
  USING (
    is_saas_admin() OR
    organization_id = get_session_organization_id()
  )
  WITH CHECK (
    is_saas_admin() OR
    organization_id = get_session_organization_id()
  );

-- DELETE: SaaS Admin pode deletar qualquer, usuários normais apenas da sua organization
CREATE POLICY "environments_delete_policy"
  ON environments FOR DELETE
  TO anon
  USING (
    is_saas_admin() OR
    organization_id = get_session_organization_id()
  );

-- 4. Comentários para documentação
COMMENT ON FUNCTION is_saas_admin() IS 
  'Verifica se o usuário atual é um SaaS Admin. Usado pelas RLS policies para permitir acesso administrativo global.';

COMMENT ON POLICY "environments_select_policy" ON environments IS
  'Permite SaaS Admin ver todos os environments, ou usuários normais verem apenas da sua organization';

COMMENT ON POLICY "environments_insert_policy" ON environments IS
  'Permite SaaS Admin criar environments em qualquer organization, ou usuários normais apenas na sua';

COMMENT ON POLICY "environments_update_policy" ON environments IS
  'Permite SaaS Admin atualizar qualquer environment, ou usuários normais apenas da sua organization';

COMMENT ON POLICY "environments_delete_policy" ON environments IS
  'Permite SaaS Admin deletar qualquer environment, ou usuários normais apenas da sua organization';
