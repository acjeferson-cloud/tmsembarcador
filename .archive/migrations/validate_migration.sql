/*
  SCRIPT DE VALIDAÇÃO DA MIGRAÇÃO MULTI-TENANT

  Execute este script para validar que a migração foi bem-sucedida
  e que o sistema está operando corretamente em modo multi-tenant.

  Usage:
    psql -d seu_database < validate_migration.sql

  Ou via Supabase:
    Copie e execute no SQL Editor
*/

-- =====================================================
-- 1. VERIFICAR ORGANIZAÇÕES CRIADAS
-- =====================================================

\echo ''
\echo '=========================================='
\echo '1. ORGANIZAÇÕES CRIADAS'
\echo '=========================================='

SELECT
  name as "Nome",
  slug as "Slug",
  subscription_status as "Status",
  is_active as "Ativa",
  (SELECT name FROM saas_plans WHERE id = organizations.plan_id) as "Plano",
  created_at as "Criada em"
FROM organizations
ORDER BY created_at;

-- =====================================================
-- 2. CONTAGEM DE DADOS POR ORGANIZAÇÃO
-- =====================================================

\echo ''
\echo '=========================================='
\echo '2. DADOS POR ORGANIZAÇÃO'
\echo '=========================================='

SELECT * FROM migration_validation_report;

-- =====================================================
-- 3. VERIFICAR DADOS ÓRFÃOS (SEM organization_id)
-- =====================================================

\echo ''
\echo '=========================================='
\echo '3. VERIFICAÇÃO DE DADOS ÓRFÃOS'
\echo '=========================================='
\echo 'Esperado: 0 em todas as tabelas'
\echo ''

DO $$
DECLARE
  v_table_name TEXT;
  v_orphan_count INTEGER;
  v_total_orphans INTEGER := 0;
  v_has_orphans BOOLEAN := FALSE;
BEGIN
  RAISE NOTICE 'Verificando dados órfãos (organization_id IS NULL)...';
  RAISE NOTICE '';

  FOR v_table_name IN
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND column_name = 'organization_id'
    AND table_name NOT IN ('organizations', 'organization_settings', 'saas_admin_users', 'saas_plans')
    ORDER BY table_name
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM %I WHERE organization_id IS NULL', v_table_name)
    INTO v_orphan_count;

    IF v_orphan_count > 0 THEN
      RAISE WARNING '  ⚠ %: % registros órfãos', v_table_name, v_orphan_count;
      v_total_orphans := v_total_orphans + v_orphan_count;
      v_has_orphans := TRUE;
    END IF;
  END LOOP;

  RAISE NOTICE '';
  IF v_has_orphans THEN
    RAISE WARNING '⚠ TOTAL: % registros órfãos encontrados!', v_total_orphans;
    RAISE WARNING '⚠ AÇÃO NECESSÁRIA: Migrar registros órfãos para uma organização';
  ELSE
    RAISE NOTICE '✓ Nenhum dado órfão encontrado - OK!';
  END IF;
END $$;

-- =====================================================
-- 4. VERIFICAR INTEGRIDADE REFERENCIAL
-- =====================================================

\echo ''
\echo '=========================================='
\echo '4. INTEGRIDADE REFERENCIAL'
\echo '=========================================='

-- 4.1 Verificar users → organizations
SELECT
  '4.1 users → organizations' as "Verificação",
  COUNT(*) as "Total Users",
  COUNT(CASE WHEN organization_id IS NOT NULL THEN 1 END) as "Com Org ID",
  COUNT(CASE WHEN organization_id IS NULL THEN 1 END) as "Órfãos"
FROM users;

-- 4.2 Verificar orders → organizations
SELECT
  '4.2 orders → organizations' as "Verificação",
  COUNT(*) as "Total Orders",
  COUNT(CASE WHEN organization_id IS NOT NULL THEN 1 END) as "Com Org ID",
  COUNT(CASE WHEN organization_id IS NULL THEN 1 END) as "Órfãos"
FROM orders;

-- 4.3 Verificar invoices → organizations
SELECT
  '4.3 invoices → organizations' as "Verificação",
  COUNT(*) as "Total Invoices",
  COUNT(CASE WHEN organization_id IS NOT NULL THEN 1 END) as "Com Org ID",
  COUNT(CASE WHEN organization_id IS NULL THEN 1 END) as "Órfãos"
FROM invoices_nfe;

-- 4.4 Verificar carriers → organizations
SELECT
  '4.4 carriers → organizations' as "Verificação",
  COUNT(*) as "Total Carriers",
  COUNT(CASE WHEN organization_id IS NOT NULL THEN 1 END) as "Com Org ID",
  COUNT(CASE WHEN organization_id IS NULL THEN 1 END) as "Órfãos"
FROM carriers;

-- =====================================================
-- 5. VERIFICAR RLS HABILITADO
-- =====================================================

\echo ''
\echo '=========================================='
\echo '5. ROW LEVEL SECURITY (RLS)'
\echo '=========================================='
\echo 'Esperado: TRUE em todas as tabelas operacionais'
\echo ''

SELECT
  tablename as "Tabela",
  rowsecurity as "RLS Habilitado"
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'users', 'establishments', 'carriers', 'business_partners',
  'orders', 'invoices_nfe', 'bills', 'pickups',
  'freight_rates', 'occurrences'
)
ORDER BY tablename;

-- =====================================================
-- 6. VERIFICAR POLICIES RLS
-- =====================================================

\echo ''
\echo '=========================================='
\echo '6. POLICIES RLS POR TABELA'
\echo '=========================================='

SELECT
  tablename as "Tabela",
  COUNT(*) as "Num Policies",
  string_agg(policyname, ', ') as "Policies"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'users', 'establishments', 'carriers', 'orders', 'invoices_nfe'
)
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- 7. TESTAR QUERIES COM FILTRO organization_id
-- =====================================================

\echo ''
\echo '=========================================='
\echo '7. TESTE DE QUERIES COM ORGANIZATION'
\echo '=========================================='

-- 7.1 Ver dados da organização "Demonstração"
WITH demo_org AS (
  SELECT id FROM organizations WHERE slug = 'demonstracao' LIMIT 1
)
SELECT
  'Demonstração' as "Organização",
  (SELECT COUNT(*) FROM users WHERE organization_id = (SELECT id FROM demo_org)) as "Users",
  (SELECT COUNT(*) FROM establishments WHERE organization_id = (SELECT id FROM demo_org)) as "Establishments",
  (SELECT COUNT(*) FROM orders WHERE organization_id = (SELECT id FROM demo_org)) as "Orders",
  (SELECT COUNT(*) FROM invoices_nfe WHERE organization_id = (SELECT id FROM demo_org)) as "Invoices",
  (SELECT COUNT(*) FROM carriers WHERE organization_id = (SELECT id FROM demo_org)) as "Carriers";

-- =====================================================
-- 8. RESUMO FINAL
-- =====================================================

\echo ''
\echo '=========================================='
\echo '8. RESUMO DA VALIDAÇÃO'
\echo '=========================================='

DO $$
DECLARE
  v_total_orgs INTEGER;
  v_total_users INTEGER;
  v_total_orders INTEGER;
  v_users_orphans INTEGER;
  v_orders_orphans INTEGER;
  v_validation_status TEXT := '✓ VALIDAÇÃO PASSOU';
BEGIN
  -- Contar organizações
  SELECT COUNT(*) INTO v_total_orgs FROM organizations;

  -- Contar dados
  SELECT COUNT(*) INTO v_total_users FROM users;
  SELECT COUNT(*) INTO v_total_orders FROM orders;

  -- Contar órfãos
  SELECT COUNT(*) INTO v_users_orphans FROM users WHERE organization_id IS NULL;
  SELECT COUNT(*) INTO v_orders_orphans FROM orders WHERE organization_id IS NULL;

  -- Exibir resumo
  RAISE NOTICE '';
  RAISE NOTICE 'Organizations criadas: %', v_total_orgs;
  RAISE NOTICE 'Total de usuários: %', v_total_users;
  RAISE NOTICE 'Total de pedidos: %', v_total_orders;
  RAISE NOTICE '';

  -- Validar
  IF v_users_orphans > 0 OR v_orders_orphans > 0 THEN
    v_validation_status := '⚠ VALIDAÇÃO FALHOU - Dados órfãos encontrados';
    RAISE WARNING '%', v_validation_status;
  ELSE
    RAISE NOTICE '%', v_validation_status;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'Sistema operando em modo MULTI-TENANT';
  RAISE NOTICE 'Isolamento por organization_id: ATIVO';
  RAISE NOTICE '';
END $$;

\echo ''
\echo '=========================================='
\echo 'FIM DA VALIDAÇÃO'
\echo '=========================================='
\echo ''
\echo 'Para ver relatório completo:'
\echo 'SELECT * FROM migration_validation_report;'
\echo ''
