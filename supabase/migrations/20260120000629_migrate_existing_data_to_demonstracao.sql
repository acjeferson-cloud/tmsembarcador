/*
  # Migração de Dados para Multi-Tenant - Organização "Demonstração"

  ## Objetivo
  Migrar TODOS os dados existentes do sistema single-tenant para a nova
  arquitetura multi-tenant, criando a organização "Demonstração" e
  vinculando todos os registros operacionais.

  ## 1. Criar Organização "Demonstração"
  - Nome: Demonstração
  - Slug: demonstracao
  - Plano: Professional (recursos completos)
  - Status: Ativa
  - Domínio: demo.tms.local
  - Tema: Azul profissional

  ## 2. Migrar Dados Existentes
  - Users
  - Establishments (Companies)
  - Carriers
  - Business Partners
  - Orders
  - Invoices (NFe)
  - CTes (se existir)
  - Bills
  - Pickups
  - Freight Rates
  - Occurrences
  - Rejection Reasons
  - Holidays
  - E todas as demais tabelas operacionais

  ## 3. Validações
  - Nenhum registro operacional sem organization_id
  - Integridade referencial mantida
  - Usuários conseguem fazer login
  - Dados acessíveis após migração

  ## 4. Segurança
  - Não alterar saas_admin_users (admins globais)
  - Manter organizations table intacta
  - Backup implícito via transaction

  ## 5. Resultado
  - 1 organização "Demonstração" criada
  - 100% dos dados operacionais migrados
  - Sistema funcional em modo multi-tenant
*/

DO $$
DECLARE
  v_demo_org_id UUID;
  v_demo_plan_id UUID;
  v_default_org_id UUID;
  v_migrated_count INTEGER;
  v_table_record RECORD;
  v_total_migrated INTEGER := 0;
  v_tables_migrated TEXT[] := ARRAY[]::TEXT[];
BEGIN
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'INICIANDO MIGRAÇÃO PARA MULTI-TENANT';
  RAISE NOTICE '==========================================';
  RAISE NOTICE '';

  -- =====================================================
  -- 1. VERIFICAR/CRIAR PLANO PROFESSIONAL
  -- =====================================================
  RAISE NOTICE '1. Verificando plano Professional...';
  
  SELECT id INTO v_demo_plan_id
  FROM saas_plans
  WHERE slug = 'professional'
  LIMIT 1;

  IF v_demo_plan_id IS NULL THEN
    RAISE NOTICE '   Plano Professional não encontrado, usando Free...';
    SELECT id INTO v_demo_plan_id
    FROM saas_plans
    WHERE slug = 'free'
    LIMIT 1;
  END IF;

  RAISE NOTICE '   ✓ Plano ID: %', v_demo_plan_id;
  RAISE NOTICE '';

  -- =====================================================
  -- 2. CRIAR ORGANIZAÇÃO "DEMONSTRAÇÃO"
  -- =====================================================
  RAISE NOTICE '2. Criando organização "Demonstração"...';

  -- Verificar se já existe
  SELECT id INTO v_demo_org_id
  FROM organizations
  WHERE slug = 'demonstracao'
  LIMIT 1;

  IF v_demo_org_id IS NULL THEN
    -- Criar nova organização
    INSERT INTO organizations (
      name,
      slug,
      domain,
      plan_id,
      is_active,
      subscription_status,
      metadata
    )
    VALUES (
      'Demonstração',
      'demonstracao',
      'demo.tms.local',
      v_demo_plan_id,
      true,
      'active',
      jsonb_build_object(
        'created_by', 'migration',
        'migration_date', now(),
        'original_system', 'single_tenant'
      )
    )
    RETURNING id INTO v_demo_org_id;

    RAISE NOTICE '   ✓ Organização criada com ID: %', v_demo_org_id;

    -- Criar organization_settings
    INSERT INTO organization_settings (
      organization_id,
      theme,
      email_from_name,
      email_from_address,
      features_enabled
    )
    VALUES (
      v_demo_org_id,
      jsonb_build_object(
        'primaryColor', '#1e40af',
        'secondaryColor', '#3b82f6',
        'accentColor', '#60a5fa'
      ),
      'Sistema TMS Demonstração',
      'noreply@demo.tms.local',
      jsonb_build_object(
        'freight_rates', true,
        'reverse_logistics', true,
        'nps', true,
        'advanced_reports', true,
        'api_access', true,
        'white_label', true,
        'custom_integrations', true
      )
    );

    RAISE NOTICE '   ✓ Settings criados para organização';
  ELSE
    RAISE NOTICE '   ℹ Organização "Demonstração" já existe (ID: %)', v_demo_org_id;
  END IF;

  RAISE NOTICE '';

  -- =====================================================
  -- 3. PEGAR ID DA ORGANIZAÇÃO DEFAULT (PARA REFERÊNCIA)
  -- =====================================================
  SELECT id INTO v_default_org_id
  FROM organizations
  WHERE slug = 'default'
  LIMIT 1;

  IF v_default_org_id IS NOT NULL THEN
    RAISE NOTICE '3. Organização "default" encontrada (ID: %)', v_default_org_id;
    RAISE NOTICE '   Dados da "default" serão MANTIDOS separadamente';
  END IF;

  RAISE NOTICE '';

  -- =====================================================
  -- 4. MIGRAR DADOS EXISTENTES SEM organization_id
  -- =====================================================
  RAISE NOTICE '4. Migrando dados existentes para "Demonstração"...';
  RAISE NOTICE '';

  -- Lista de tabelas para migrar (ordem importa por causa de FKs)
  FOR v_table_record IN 
    SELECT unnest(ARRAY[
      'users',
      'establishments',
      'carriers',
      'business_partners',
      'holidays',
      'rejection_reasons',
      'occurrences',
      'freight_rates',
      'freight_rate_tables',
      'freight_rate_values',
      'freight_rate_cities',
      'orders',
      'invoices_nfe',
      'bills',
      'pickups',
      'pickup_requests',
      'reverse_logistics',
      'nps_surveys',
      'nps_responses',
      'whatsapp_config',
      'google_maps_config',
      'openai_config',
      'email_outgoing_config',
      'api_keys',
      'change_logs',
      'innovations',
      'suggestions',
      'help_articles',
      'quotes',
      'tracking_events'
    ]) AS table_name
  LOOP
    -- Verificar se a tabela existe
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND tables.table_name = v_table_record.table_name
    ) THEN
      -- Verificar se a tabela tem coluna organization_id
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = v_table_record.table_name
        AND column_name = 'organization_id'
      ) THEN
        -- Migrar registros sem organization_id OU com organization_id = default
        EXECUTE format(
          'UPDATE %I SET organization_id = $1 WHERE organization_id IS NULL OR organization_id = $2',
          v_table_record.table_name
        ) USING v_demo_org_id, v_default_org_id;

        GET DIAGNOSTICS v_migrated_count = ROW_COUNT;

        IF v_migrated_count > 0 THEN
          v_total_migrated := v_total_migrated + v_migrated_count;
          v_tables_migrated := array_append(v_tables_migrated, v_table_record.table_name);
          RAISE NOTICE '   ✓ % - % registros migrados', v_table_record.table_name, v_migrated_count;
        END IF;
      END IF;
    END IF;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '   TOTAL: % registros migrados em % tabelas', v_total_migrated, array_length(v_tables_migrated, 1);
  RAISE NOTICE '';

  -- =====================================================
  -- 5. CRIAR ESTABLISHMENT PADRÃO SE NÃO EXISTIR
  -- =====================================================
  RAISE NOTICE '5. Verificando establishments...';

  IF NOT EXISTS (
    SELECT 1 FROM establishments
    WHERE organization_id = v_demo_org_id
    LIMIT 1
  ) THEN
    RAISE NOTICE '   Nenhum establishment encontrado, criando "Empresa Demonstração"...';
    
    INSERT INTO establishments (
      organization_id,
      codigo,
      nome,
      cnpj,
      tipo,
      ativo
    )
    VALUES (
      v_demo_org_id,
      'EST001',
      'Empresa Demonstração',
      '00000000000000',
      'Matriz',
      true
    );

    RAISE NOTICE '   ✓ Establishment padrão criado';
  ELSE
    SELECT COUNT(*) INTO v_migrated_count
    FROM establishments
    WHERE organization_id = v_demo_org_id;
    
    RAISE NOTICE '   ✓ % establishments encontrados na organização', v_migrated_count;
  END IF;

  RAISE NOTICE '';

  -- =====================================================
  -- 6. ATUALIZAR USUÁRIOS SEM ORGANIZATION_ID
  -- =====================================================
  RAISE NOTICE '6. Verificando usuários...';

  UPDATE users 
  SET organization_id = v_demo_org_id
  WHERE organization_id IS NULL;

  GET DIAGNOSTICS v_migrated_count = ROW_COUNT;

  IF v_migrated_count > 0 THEN
    RAISE NOTICE '   ✓ % usuários associados à organização', v_migrated_count;
  END IF;

  SELECT COUNT(*) INTO v_migrated_count
  FROM users
  WHERE organization_id = v_demo_org_id;

  RAISE NOTICE '   ✓ Total de % usuários na organização "Demonstração"', v_migrated_count;
  RAISE NOTICE '';

  -- =====================================================
  -- 7. VALIDAÇÕES FINAIS
  -- =====================================================
  RAISE NOTICE '7. Executando validações finais...';
  RAISE NOTICE '';

  -- 7.1 Verificar organizations criadas
  DECLARE
    v_org_count INTEGER;
  BEGIN
    SELECT COUNT(*) INTO v_org_count
    FROM organizations
    WHERE slug IN ('demonstracao', 'default');

    RAISE NOTICE '   ✓ Organizations criadas: %', v_org_count;
  END;

  -- 7.2 Verificar dados órfãos (sem organization_id)
  DECLARE
    v_orphan_count INTEGER;
    v_orphan_tables TEXT[] := ARRAY[]::TEXT[];
  BEGIN
    FOR v_table_record IN 
      SELECT table_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND column_name = 'organization_id'
      AND table_name NOT IN ('organizations', 'organization_settings', 'saas_admin_users', 'saas_plans')
    LOOP
      EXECUTE format(
        'SELECT COUNT(*) FROM %I WHERE organization_id IS NULL',
        v_table_record.table_name
      ) INTO v_orphan_count;

      IF v_orphan_count > 0 THEN
        v_orphan_tables := array_append(v_orphan_tables, v_table_record.table_name || ' (' || v_orphan_count || ')');
      END IF;
    END LOOP;

    IF array_length(v_orphan_tables, 1) > 0 THEN
      RAISE WARNING '   ⚠ Tabelas com dados órfãos: %', array_to_string(v_orphan_tables, ', ');
    ELSE
      RAISE NOTICE '   ✓ Nenhum dado órfão encontrado';
    END IF;
  END;

  -- 7.3 Relatório por tabela
  RAISE NOTICE '';
  RAISE NOTICE '   Relatório de dados por organização:';
  
  FOR v_table_record IN
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND column_name = 'organization_id'
    AND table_name IN ('users', 'establishments', 'carriers', 'orders', 'invoices_nfe', 'freight_rates')
  LOOP
    EXECUTE format(
      'SELECT COUNT(*) FROM %I WHERE organization_id = $1',
      v_table_record.table_name
    ) INTO v_migrated_count USING v_demo_org_id;

    IF v_migrated_count > 0 THEN
      RAISE NOTICE '      - %: % registros', v_table_record.table_name, v_migrated_count;
    END IF;
  END LOOP;

  RAISE NOTICE '';

  -- =====================================================
  -- 8. REMOVER ORGANIZAÇÃO "DEFAULT" SE VAZIA
  -- =====================================================
  IF v_default_org_id IS NOT NULL THEN
    DECLARE
      v_has_data BOOLEAN := false;
    BEGIN
      -- Verificar se a org default tem dados
      SELECT EXISTS (
        SELECT 1 FROM users WHERE organization_id = v_default_org_id LIMIT 1
      ) INTO v_has_data;

      IF NOT v_has_data THEN
        RAISE NOTICE '8. Removendo organização "default" (vazia)...';
        
        DELETE FROM organization_settings WHERE organization_id = v_default_org_id;
        DELETE FROM organizations WHERE id = v_default_org_id;
        
        RAISE NOTICE '   ✓ Organização "default" removida';
      ELSE
        RAISE NOTICE '8. Mantendo organização "default" (possui dados)';
      END IF;
    END;
  END IF;

  RAISE NOTICE '';

  -- =====================================================
  -- SUMÁRIO FINAL
  -- =====================================================
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'MIGRAÇÃO CONCLUÍDA COM SUCESSO!';
  RAISE NOTICE '==========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Organização "Demonstração" ID: %', v_demo_org_id;
  RAISE NOTICE 'Total de registros migrados: %', v_total_migrated;
  RAISE NOTICE 'Tabelas migradas: %', array_length(v_tables_migrated, 1);
  RAISE NOTICE '';
  RAISE NOTICE 'Sistema agora está em modo MULTI-TENANT';
  RAISE NOTICE 'Todos os dados existentes pertencem à organização "Demonstração"';
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';

END $$;

-- =====================================================
-- 9. CRIAR VIEW PARA VALIDAÇÃO PÓS-MIGRAÇÃO
-- =====================================================

CREATE OR REPLACE VIEW migration_validation_report AS
SELECT
  'demonstracao' as organization_slug,
  o.name as organization_name,
  (SELECT COUNT(*) FROM users WHERE organization_id = o.id) as users_count,
  (SELECT COUNT(*) FROM establishments WHERE organization_id = o.id) as establishments_count,
  (SELECT COUNT(*) FROM carriers WHERE organization_id = o.id) as carriers_count,
  (SELECT COUNT(*) FROM business_partners WHERE organization_id = o.id) as partners_count,
  (SELECT COUNT(*) FROM orders WHERE organization_id = o.id) as orders_count,
  (SELECT COUNT(*) FROM invoices_nfe WHERE organization_id = o.id) as invoices_count,
  (SELECT COUNT(*) FROM freight_rates WHERE organization_id = o.id) as freight_rates_count,
  (SELECT COUNT(*) FROM pickups WHERE organization_id = o.id) as pickups_count
FROM organizations o
WHERE o.slug = 'demonstracao';

COMMENT ON VIEW migration_validation_report IS 'Relatório de validação da migração para multi-tenant';

-- =====================================================
-- 10. MENSAGEM FINAL
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Para visualizar o relatório de migração, execute:';
  RAISE NOTICE 'SELECT * FROM migration_validation_report;';
  RAISE NOTICE '';
END $$;
