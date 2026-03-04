/*
  # Criar Cenário Completo - Sandbox Environment
  
  ## Hierarquia:
  └── Organization: Demonstração (código: 00000001)
      ├── Environment: Produção
      │   ├── Estabelecimento 0001
      │   └── Estabelecimento 0002
      └── Environment: Sandbox
          ├── Estabelecimento 0001 (clone)
          └── Estabelecimento 0002 (clone)
  
  ## Isolamento Garantido:
  - RLS garante que cada environment vê apenas seus dados
  - Usuários com estabelecimentos_permitidos veem apenas esses
  - Mesmo código (0001, 0002) pode existir em environments diferentes
*/

DO $$
DECLARE
  v_org_id UUID;
  v_env_sandbox_id UUID;
  v_env_production_id UUID;
  v_est_0001_prod_id UUID;
  v_est_0002_prod_id UUID;
  v_est_0001_sandbox_id UUID;
  v_est_0002_sandbox_id UUID;
BEGIN
  -- =====================================================
  -- 1. BUSCAR ORGANIZATION
  -- =====================================================
  
  SELECT id INTO v_org_id
  FROM organizations
  WHERE name = 'Demonstração'
  LIMIT 1;
  
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Organization Demonstração não encontrada';
  END IF;
  
  -- Adicionar código à metadata
  UPDATE organizations
  SET metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{codigo}',
    '"00000001"'
  )
  WHERE id = v_org_id;
  
  -- =====================================================
  -- 2. BUSCAR/CRIAR ENVIRONMENTS
  -- =====================================================
  
  SELECT id INTO v_env_production_id
  FROM environments
  WHERE organization_id = v_org_id
    AND type = 'production'
  LIMIT 1;
  
  SELECT id INTO v_env_sandbox_id
  FROM environments
  WHERE organization_id = v_org_id
    AND slug = 'sandbox'
  LIMIT 1;
  
  IF v_env_sandbox_id IS NULL THEN
    INSERT INTO environments (
      organization_id,
      name,
      slug,
      type,
      description,
      data_retention_days,
      is_active
    ) VALUES (
      v_org_id,
      'Sandbox',
      'sandbox',
      'sandbox',
      'Ambiente de testes e desenvolvimento com dados isolados',
      90,
      true
    )
    RETURNING id INTO v_env_sandbox_id;
    
    RAISE NOTICE '✓ Environment Sandbox criado';
  END IF;
  
  -- =====================================================
  -- 3. BUSCAR ESTABELECIMENTOS DE PRODUÇÃO
  -- =====================================================
  
  SELECT id INTO v_est_0001_prod_id
  FROM establishments
  WHERE organization_id = v_org_id
    AND environment_id = v_env_production_id
    AND codigo = '0001'
  LIMIT 1;
  
  SELECT id INTO v_est_0002_prod_id
  FROM establishments
  WHERE organization_id = v_org_id
    AND environment_id = v_env_production_id
    AND codigo = '0002'
  LIMIT 1;
  
  IF v_est_0001_prod_id IS NULL OR v_est_0002_prod_id IS NULL THEN
    RAISE EXCEPTION 'Estabelecimentos 0001 e/ou 0002 não encontrados em Produção';
  END IF;
  
  -- =====================================================
  -- 4. CRIAR ESTABELECIMENTOS NO SANDBOX
  -- =====================================================
  
  -- Estabelecimento 0001 Sandbox
  SELECT id INTO v_est_0001_sandbox_id
  FROM establishments
  WHERE organization_id = v_org_id
    AND environment_id = v_env_sandbox_id
    AND codigo = '0001'
  LIMIT 1;
  
  IF v_est_0001_sandbox_id IS NULL THEN
    INSERT INTO establishments (
      organization_id,
      environment_id,
      codigo,
      cnpj,
      inscricao_estadual,
      razao_social,
      fantasia,
      endereco,
      bairro,
      cep,
      cidade,
      estado,
      tipo,
      tracking_prefix
    )
    SELECT
      v_org_id,
      v_env_sandbox_id,
      codigo, -- Mesmo código (0001)
      CASE 
        WHEN cnpj ~ '^[0-9]+$' THEN 
          lpad(((cnpj::bigint + 90000000000000)::text), 14, '0')
        ELSE cnpj || '-SB'
      END,
      inscricao_estadual || '-SB',
      razao_social || ' (Sandbox)',
      COALESCE(fantasia, razao_social) || ' (Sandbox)',
      endereco,
      bairro,
      cep,
      cidade,
      estado,
      tipo,
      tracking_prefix || '-SB'
    FROM establishments
    WHERE id = v_est_0001_prod_id
    RETURNING id INTO v_est_0001_sandbox_id;
    
    RAISE NOTICE '✓ Estabelecimento 0001 criado no Sandbox';
  END IF;
  
  -- Estabelecimento 0002 Sandbox
  SELECT id INTO v_est_0002_sandbox_id
  FROM establishments
  WHERE organization_id = v_org_id
    AND environment_id = v_env_sandbox_id
    AND codigo = '0002'
  LIMIT 1;
  
  IF v_est_0002_sandbox_id IS NULL THEN
    INSERT INTO establishments (
      organization_id,
      environment_id,
      codigo,
      cnpj,
      inscricao_estadual,
      razao_social,
      fantasia,
      endereco,
      bairro,
      cep,
      cidade,
      estado,
      tipo,
      tracking_prefix
    )
    SELECT
      v_org_id,
      v_env_sandbox_id,
      codigo, -- Mesmo código (0002)
      CASE 
        WHEN cnpj ~ '^[0-9]+$' THEN 
          lpad(((cnpj::bigint + 90000000000000)::text), 14, '0')
        ELSE cnpj || '-SB'
      END,
      inscricao_estadual || '-SB',
      razao_social || ' (Sandbox)',
      COALESCE(fantasia, razao_social) || ' (Sandbox)',
      endereco,
      bairro,
      cep,
      cidade,
      estado,
      tipo,
      tracking_prefix || '-SB'
    FROM establishments
    WHERE id = v_est_0002_prod_id
    RETURNING id INTO v_est_0002_sandbox_id;
    
    RAISE NOTICE '✓ Estabelecimento 0002 criado no Sandbox';
  END IF;
  
  -- =====================================================
  -- 5. CRIAR USUÁRIO TESTE SANDBOX
  -- =====================================================
  
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE email = 'teste.sandbox@gruposmartlog.com.br'
  ) THEN
    INSERT INTO users (
      organization_id,
      environment_id,
      codigo,
      nome,
      email,
      senha,
      cpf,
      cargo,
      departamento,
      perfil,
      status,
      estabelecimentos_permitidos,
      permissoes,
      data_admissao
    ) VALUES (
      v_org_id,
      v_env_sandbox_id,
      'TST-SB01',
      'Usuário Teste Sandbox',
      'teste.sandbox@gruposmartlog.com.br',
      'Teste123!',
      '11122233344',
      'Analista de Testes',
      'TI',
      'administrador',
      'ativo',
      ARRAY[v_est_0001_sandbox_id, v_est_0002_sandbox_id],
      '["all"]'::jsonb,
      CURRENT_DATE
    );
    
    RAISE NOTICE '✓ Usuário teste.sandbox criado';
  ELSE
    UPDATE users
    SET 
      organization_id = v_org_id,
      environment_id = v_env_sandbox_id,
      estabelecimentos_permitidos = ARRAY[v_est_0001_sandbox_id, v_est_0002_sandbox_id]
    WHERE email = 'teste.sandbox@gruposmartlog.com.br';
    
    RAISE NOTICE '✓ Usuário teste.sandbox atualizado';
  END IF;
  
  -- =====================================================
  -- RESUMO FINAL
  -- =====================================================
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '          CENÁRIO SANDBOX CRIADO COM SUCESSO';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Organization: Demonstração';
  RAISE NOTICE '  ID: %', v_org_id;
  RAISE NOTICE '  Código: 00000001';
  RAISE NOTICE '';
  RAISE NOTICE 'Environment: Produção';
  RAISE NOTICE '  ID: %', v_env_production_id;
  RAISE NOTICE '  Estabelecimentos: 0001, 0002';
  RAISE NOTICE '';
  RAISE NOTICE 'Environment: Sandbox';
  RAISE NOTICE '  ID: %', v_env_sandbox_id;
  RAISE NOTICE '  Estabelecimentos: 0001, 0002 (clones isolados)';
  RAISE NOTICE '';
  RAISE NOTICE '───────────────────────────────────────────────────────────';
  RAISE NOTICE 'CREDENCIAIS DE TESTE';
  RAISE NOTICE '───────────────────────────────────────────────────────────';
  RAISE NOTICE 'Email:    teste.sandbox@gruposmartlog.com.br';
  RAISE NOTICE 'Senha:    Teste123!';
  RAISE NOTICE 'Acesso:   Apenas estabelecimentos 0001 e 0002 do Sandbox';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  
END $$;
