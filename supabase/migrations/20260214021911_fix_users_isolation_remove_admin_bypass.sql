/*
  # Corrigir Isolamento de Usuários - Remover Bypass Admin Global
  
  1. Problema CRÍTICO
    - Admin global está vendo TODOS os usuários de TODAS as organizations
    - Políticas antigas têm `is_global_admin_user()` que bypassa o isolamento
    - Quando admin global seleciona org/env, ele DEVE ver apenas usuários daquela org/env
  
  2. Solução
    - Remover políticas antigas que têm bypass
    - Manter APENAS políticas de isolamento rígido
    - SEMPRE filtrar por organization_id AND environment_id
    - Sem exceções, mesmo para admin global
  
  3. Comportamento Correto
    - Admin global em Demonstração/Produção → vê 12 usuários
    - Admin global em Quimidrol/Produção → vê 1 usuário
    - Admin global em Segundo cliente/Produção → vê 1 usuário
    - Admin global em Demonstração/Sandbox → vê 1 usuário
  
  4. Segurança
    - Isolamento TOTAL entre organizations
    - Isolamento TOTAL entre environments
    - Sem vazamento de dados
*/

-- 1. Remover políticas antigas que têm bypass do admin global

DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;

-- 2. Manter apenas políticas de isolamento rígido (já existem)

-- Verificar se policies de isolamento existem, se não, criar

DO $$
BEGIN
  -- SELECT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' AND policyname = 'users_isolation_select'
  ) THEN
    CREATE POLICY "users_isolation_select"
      ON users FOR SELECT
      TO anon
      USING (
        organization_id = get_session_organization_id() 
        AND environment_id = get_session_environment_id()
      );
  END IF;

  -- INSERT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' AND policyname = 'users_isolation_insert'
  ) THEN
    CREATE POLICY "users_isolation_insert"
      ON users FOR INSERT
      TO anon
      WITH CHECK (
        organization_id = get_session_organization_id() 
        AND environment_id = get_session_environment_id()
      );
  END IF;

  -- UPDATE policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' AND policyname = 'users_isolation_update'
  ) THEN
    CREATE POLICY "users_isolation_update"
      ON users FOR UPDATE
      TO anon
      USING (
        organization_id = get_session_organization_id() 
        AND environment_id = get_session_environment_id()
      )
      WITH CHECK (
        organization_id = get_session_organization_id() 
        AND environment_id = get_session_environment_id()
      );
  END IF;

  -- DELETE policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' AND policyname = 'users_isolation_delete'
  ) THEN
    CREATE POLICY "users_isolation_delete"
      ON users FOR DELETE
      TO anon
      USING (
        organization_id = get_session_organization_id() 
        AND environment_id = get_session_environment_id()
      );
  END IF;
END $$;

-- 3. Verificar que apenas 4 políticas existem (uma para cada operação)

DO $$
DECLARE
  v_count int;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM pg_policies
  WHERE tablename = 'users';
  
  IF v_count != 4 THEN
    RAISE EXCEPTION 'Erro: Esperado 4 políticas, encontrado %', v_count;
  END IF;
  
  RAISE NOTICE 'Sucesso: 4 políticas de isolamento configuradas corretamente!';
END $$;

-- 4. Comentários das políticas

COMMENT ON POLICY "users_isolation_select" ON users IS
  'Permite SELECT apenas de usuários da organization/environment corrente. SEM EXCEÇÕES.';

COMMENT ON POLICY "users_isolation_insert" ON users IS
  'Permite INSERT apenas na organization/environment corrente. SEM EXCEÇÕES.';

COMMENT ON POLICY "users_isolation_update" ON users IS
  'Permite UPDATE apenas de usuários da organization/environment corrente. SEM EXCEÇÕES.';

COMMENT ON POLICY "users_isolation_delete" ON users IS
  'Permite DELETE apenas de usuários da organization/environment corrente. SEM EXCEÇÕES.';
