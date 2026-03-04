# 📊 Queries Úteis - Organizações

## Ver Todas as Organizações

```sql
SELECT
  name as "Nome",
  slug as "Slug",
  domain as "Domínio",
  subscription_status as "Status",
  is_active as "Ativa",
  (SELECT name FROM saas_plans WHERE id = organizations.plan_id) as "Plano",
  created_at as "Criada em"
FROM organizations
ORDER BY created_at;
```

## Ver Organizações com Contadores

```sql
SELECT
  o.name as "Organização",
  o.slug as "Slug",
  (SELECT name FROM saas_plans WHERE id = o.plan_id) as "Plano",
  os.theme->>'primaryColor' as "Cor Tema",
  (SELECT COUNT(*) FROM users WHERE organization_id = o.id) as "Usuários",
  (SELECT COUNT(*) FROM establishments WHERE organization_id = o.id) as "Establishments",
  (SELECT COUNT(*) FROM carriers WHERE organization_id = o.id) as "Transportadoras",
  (SELECT COUNT(*) FROM orders WHERE organization_id = o.id) as "Pedidos",
  (SELECT COUNT(*) FROM invoices_nfe WHERE organization_id = o.id) as "Notas Fiscais",
  o.created_at as "Criada em"
FROM organizations o
LEFT JOIN organization_settings os ON os.organization_id = o.id
ORDER BY o.created_at;
```

## Ver Usuários por Organização

```sql
SELECT
  o.name as "Organização",
  COUNT(u.id) as "Total Usuários",
  string_agg(u.nome, ', ') as "Nomes"
FROM organizations o
LEFT JOIN users u ON u.organization_id = o.id
GROUP BY o.id, o.name
ORDER BY o.name;
```

## Ver Detalhes de uma Organização Específica

```sql
SELECT
  o.name,
  o.slug,
  o.domain,
  o.subscription_status,
  sp.name as plan_name,
  sp.max_users,
  sp.price_monthly,
  os.theme,
  os.features_enabled,
  o.created_at
FROM organizations o
LEFT JOIN saas_plans sp ON sp.id = o.plan_id
LEFT JOIN organization_settings os ON os.organization_id = o.id
WHERE o.slug = 'primeiro-cliente';
```

## Verificar Isolamento de Dados

```sql
SELECT
  o.name as "Organização",
  (SELECT COUNT(*) FROM users WHERE organization_id = o.id) as "Usuários",
  (SELECT COUNT(*) FROM orders WHERE organization_id = o.id) as "Pedidos",
  (SELECT COUNT(*) FROM invoices_nfe WHERE organization_id = o.id) as "NFe",
  (SELECT COUNT(*) FROM carriers WHERE organization_id = o.id) as "Transportadoras",
  (SELECT COUNT(*) FROM freight_rates WHERE organization_id = o.id) as "Tab. Frete"
FROM organizations o
ORDER BY o.name;
```

## Ver Configurações White Label

```sql
SELECT
  o.name as "Organização",
  os.theme->>'primaryColor' as "Cor Primária",
  os.theme->>'secondaryColor' as "Cor Secundária",
  os.logo_url as "Logo",
  os.email_from_name as "Nome Email",
  os.email_from_address as "Email Remetente",
  os.features_enabled as "Features"
FROM organizations o
LEFT JOIN organization_settings os ON os.organization_id = o.id
ORDER BY o.name;
```

## Ver Planos Disponíveis

```sql
SELECT
  name as "Nome",
  slug as "Slug",
  price_monthly as "Preço Mensal",
  max_users as "Máx. Usuários",
  max_establishments as "Máx. Establishments",
  features as "Features",
  (SELECT COUNT(*) FROM organizations WHERE plan_id = saas_plans.id) as "Organizações Usando"
FROM saas_plans
ORDER BY price_monthly;
```

## Criar Nova Organização (Exemplo)

```sql
DO $$
DECLARE
  v_plan_id UUID;
  v_org_id UUID;
BEGIN
  -- Buscar plano
  SELECT id INTO v_plan_id FROM saas_plans WHERE slug = 'free' LIMIT 1;

  -- Criar organização
  INSERT INTO organizations (name, slug, domain, plan_id, is_active, subscription_status)
  VALUES ('Nova Empresa', 'nova-empresa', 'novaempresa.tms.local', v_plan_id, true, 'active')
  RETURNING id INTO v_org_id;

  -- Criar settings
  INSERT INTO organization_settings (organization_id, theme)
  VALUES (v_org_id, '{"primaryColor": "#0ea5e9"}'::jsonb);

  -- Criar establishment
  INSERT INTO establishments (
    organization_id, codigo, razao_social, cnpj,
    endereco, bairro, cep, cidade, estado, tipo, tracking_prefix
  )
  VALUES (
    v_org_id, 'EMP-001', 'Nova Empresa Ltda', '00000000000000',
    'Rua A', 'Centro', '00000-000', 'Cidade', 'UF', 'matriz', 'EMP'
  );

  -- Criar usuário admin
  INSERT INTO users (
    organization_id, codigo, nome, email, senha, cpf,
    cargo, departamento, data_admissao, perfil, status
  )
  VALUES (
    v_org_id, 'ADM-001', 'Admin Nova Empresa',
    'admin@novaempresa.com', 'senha123', '00000000000',
    'Admin', 'TI', CURRENT_DATE, 'administrador', 'ativo'
  );

  RAISE NOTICE 'Organização criada com sucesso!';
END $$;
```

## Desativar Organização

```sql
UPDATE organizations
SET is_active = false,
    subscription_status = 'cancelled'
WHERE slug = 'primeiro-cliente';
```

## Ativar Organização

```sql
UPDATE organizations
SET is_active = true,
    subscription_status = 'active'
WHERE slug = 'primeiro-cliente';
```

## Mudar Plano de uma Organização

```sql
UPDATE organizations
SET plan_id = (SELECT id FROM saas_plans WHERE slug = 'professional')
WHERE slug = 'primeiro-cliente';
```

## Deletar Organização (CUIDADO!)

```sql
-- ATENÇÃO: Isso remove TUDO da organização
DO $$
DECLARE
  v_org_id UUID;
BEGIN
  SELECT id INTO v_org_id FROM organizations WHERE slug = 'primeiro-cliente';

  -- Deletar dados relacionados
  DELETE FROM users WHERE organization_id = v_org_id;
  DELETE FROM orders WHERE organization_id = v_org_id;
  DELETE FROM invoices_nfe WHERE organization_id = v_org_id;
  DELETE FROM carriers WHERE organization_id = v_org_id;
  DELETE FROM establishments WHERE organization_id = v_org_id;
  DELETE FROM freight_rates WHERE organization_id = v_org_id;
  DELETE FROM organization_settings WHERE organization_id = v_org_id;

  -- Deletar organização
  DELETE FROM organizations WHERE id = v_org_id;

  RAISE NOTICE 'Organização deletada!';
END $$;
```
