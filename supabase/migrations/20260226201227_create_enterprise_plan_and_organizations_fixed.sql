/*
  # Criar Plano Enterprise e Organizações Multi-Tenant
  
  1. Plano Enterprise
    - Cria plano completo para grandes empresas
    - Usuários ilimitados (-1)
    - Estabelecimentos ilimitados (-1)
    - Todos os módulos disponíveis
  
  2. Organizações
    - 00000001 - Demonstração (apenas ambiente Testes)
    - 00000002 - Quimidrol (ambientes Testes e Produção)
    - 00000003 - Lynus (ambientes Testes e Produção)
    - 00000004 - GMEG (ambientes Testes e Produção)
  
  3. Ambientes
    - Cria ambientes para cada organização conforme especificado
    - teste: para desenvolvimento e homologação
    - producao: para operação real
*/

-- Criar Plano Enterprise
INSERT INTO saas_plans (
  id,
  nome,
  descricao,
  valor_mensal,
  max_users,
  max_establishments,
  features,
  ativo,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Enterprise',
  'Plano completo para grandes empresas com recursos ilimitados',
  9999.99,
  -1,
  -1,
  jsonb_build_object(
    'modulos', ARRAY['pedidos', 'notas', 'ctes', 'coletas', 'frete', 'rastreamento', 'bi', 'api'],
    'suporte', 'prioritario_24x7',
    'integrações', ARRAY['whatsapp', 'email', 'sms', 'webhook', 'api'],
    'white_label', true,
    'custom_domain', true,
    'sla', '99.9%',
    'backup', 'diario',
    'storage_gb', -1,
    'api_calls', -1
  ),
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Criar Organização 1: Demonstração
DO $$
DECLARE
  v_org_id UUID;
  v_plan_id UUID;
BEGIN
  SELECT id INTO v_plan_id FROM saas_plans WHERE nome = 'Enterprise' LIMIT 1;
  
  INSERT INTO saas_organizations (
    id,
    codigo,
    nome,
    status,
    plan_id,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    '00000001',
    'Demonstração',
    'ativo',
    v_plan_id,
    NOW(),
    NOW()
  ) ON CONFLICT (codigo) DO UPDATE SET
    nome = EXCLUDED.nome,
    plan_id = EXCLUDED.plan_id,
    updated_at = NOW()
  RETURNING id INTO v_org_id;
  
  -- Criar ambiente Testes para Demonstração
  INSERT INTO saas_environments (
    id,
    organization_id,
    codigo,
    nome,
    tipo,
    status,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_org_id,
    'TESTES',
    'Testes',
    'teste',
    'ativo',
    NOW(),
    NOW()
  ) ON CONFLICT DO NOTHING;
END $$;

-- Criar Organização 2: Quimidrol
DO $$
DECLARE
  v_org_id UUID;
  v_plan_id UUID;
BEGIN
  SELECT id INTO v_plan_id FROM saas_plans WHERE nome = 'Enterprise' LIMIT 1;
  
  INSERT INTO saas_organizations (
    id,
    codigo,
    nome,
    status,
    plan_id,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    '00000002',
    'Quimidrol',
    'ativo',
    v_plan_id,
    NOW(),
    NOW()
  ) ON CONFLICT (codigo) DO UPDATE SET
    nome = EXCLUDED.nome,
    plan_id = EXCLUDED.plan_id,
    updated_at = NOW()
  RETURNING id INTO v_org_id;
  
  -- Criar ambientes para Quimidrol
  INSERT INTO saas_environments (
    id,
    organization_id,
    codigo,
    nome,
    tipo,
    status,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_org_id,
    'TESTES',
    'Testes',
    'teste',
    'ativo',
    NOW(),
    NOW()
  ) ON CONFLICT DO NOTHING;
  
  INSERT INTO saas_environments (
    id,
    organization_id,
    codigo,
    nome,
    tipo,
    status,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_org_id,
    'PRODUCAO',
    'Produção',
    'producao',
    'ativo',
    NOW(),
    NOW()
  ) ON CONFLICT DO NOTHING;
END $$;

-- Criar Organização 3: Lynus
DO $$
DECLARE
  v_org_id UUID;
  v_plan_id UUID;
BEGIN
  SELECT id INTO v_plan_id FROM saas_plans WHERE nome = 'Enterprise' LIMIT 1;
  
  INSERT INTO saas_organizations (
    id,
    codigo,
    nome,
    status,
    plan_id,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    '00000003',
    'Lynus',
    'ativo',
    v_plan_id,
    NOW(),
    NOW()
  ) ON CONFLICT (codigo) DO UPDATE SET
    nome = EXCLUDED.nome,
    plan_id = EXCLUDED.plan_id,
    updated_at = NOW()
  RETURNING id INTO v_org_id;
  
  -- Criar ambientes para Lynus
  INSERT INTO saas_environments (
    id,
    organization_id,
    codigo,
    nome,
    tipo,
    status,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_org_id,
    'TESTES',
    'Testes',
    'teste',
    'ativo',
    NOW(),
    NOW()
  ) ON CONFLICT DO NOTHING;
  
  INSERT INTO saas_environments (
    id,
    organization_id,
    codigo,
    nome,
    tipo,
    status,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_org_id,
    'PRODUCAO',
    'Produção',
    'producao',
    'ativo',
    NOW(),
    NOW()
  ) ON CONFLICT DO NOTHING;
END $$;

-- Criar Organização 4: GMEG
DO $$
DECLARE
  v_org_id UUID;
  v_plan_id UUID;
BEGIN
  SELECT id INTO v_plan_id FROM saas_plans WHERE nome = 'Enterprise' LIMIT 1;
  
  INSERT INTO saas_organizations (
    id,
    codigo,
    nome,
    status,
    plan_id,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    '00000004',
    'GMEG',
    'ativo',
    v_plan_id,
    NOW(),
    NOW()
  ) ON CONFLICT (codigo) DO UPDATE SET
    nome = EXCLUDED.nome,
    plan_id = EXCLUDED.plan_id,
    updated_at = NOW()
  RETURNING id INTO v_org_id;
  
  -- Criar ambientes para GMEG
  INSERT INTO saas_environments (
    id,
    organization_id,
    codigo,
    nome,
    tipo,
    status,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_org_id,
    'TESTES',
    'Testes',
    'teste',
    'ativo',
    NOW(),
    NOW()
  ) ON CONFLICT DO NOTHING;
  
  INSERT INTO saas_environments (
    id,
    organization_id,
    codigo,
    nome,
    tipo,
    status,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_org_id,
    'PRODUCAO',
    'Produção',
    'producao',
    'ativo',
    NOW(),
    NOW()
  ) ON CONFLICT DO NOTHING;
END $$;
