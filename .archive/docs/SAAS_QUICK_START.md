# 🚀 SaaS Multi-Tenant - Quick Start

## 📖 Para Desenvolvedores

### 1. Login no TMS (Com organização)

```typescript
import { tenantAuthService } from './services/tenantAuthService';

// Login retorna organization_id automaticamente
const result = await tenantAuthService.loginTMS(
  'usuario@empresa.com',
  'senha123'
);

if (result.success) {
  console.log('Organization ID:', result.organization_id);
  console.log('Organization:', result.organization);
}
```

### 2. Login no Admin Console (Global)

```
URL: http://localhost:5173/saas-admin
Email: admin@saas.local
Senha: admin123
```

### 3. Usar Middleware em Serviços

**❌ NÃO FAZER (query direta):**
```typescript
const { data } = await supabase
  .from('orders')
  .select('*');
```

**✅ FAZER (com middleware):**
```typescript
import { tenantMiddleware } from './services/tenantMiddleware';

// Automaticamente filtrado por organization_id
const orders = await tenantMiddleware.query<Order>('orders');
```

### 4. Operações CRUD

```typescript
// SELECT
const orders = await tenantMiddleware.query<Order>('orders');
const order = await tenantMiddleware.queryById<Order>('orders', id);

// INSERT (organization_id adicionado automaticamente)
const newOrder = await tenantMiddleware.insert<Order>('orders', {
  numero: '12345',
  cliente: 'Cliente ABC'
});

// UPDATE (valida organization_id)
await tenantMiddleware.update<Order>('orders', id, {
  status: 'concluido'
});

// DELETE (valida organization_id)
await tenantMiddleware.delete('orders', id);

// SEARCH
const results = await tenantMiddleware.search<Order>(
  'orders',
  'termo',
  ['numero', 'cliente']
);

// COUNT
const total = await tenantMiddleware.count('orders', {
  status: 'pendente'
});
```

### 5. Pegar Organização Atual

```typescript
import { useOrganization } from './context/OrganizationContext';

function MyComponent() {
  const { organization, settings, loading } = useOrganization();

  if (loading) return <div>Carregando...</div>;

  return (
    <div>
      <h1>{organization?.name}</h1>
      <p>Plano: {organization?.subscription_status}</p>
    </div>
  );
}
```

### 6. Verificar Features

```typescript
import { useOrganization } from './context/OrganizationContext';

function ReverseLogisticsPage() {
  const { isFeatureEnabled } = useOrganization();

  if (!isFeatureEnabled('reverse_logistics')) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200">
        Esta feature não está disponível no seu plano.
        <a href="/upgrade">Fazer upgrade</a>
      </div>
    );
  }

  return <ReverseLogisticsComponent />;
}
```

### 7. Aplicar White Label

```typescript
import { useOrganization } from './context/OrganizationContext';

function Header() {
  const { settings } = useOrganization();

  return (
    <header
      style={{
        backgroundColor: settings?.theme?.primaryColor || '#3b82f6'
      }}
    >
      {settings?.logo_url ? (
        <img src={settings.logo_url} alt="Logo" />
      ) : (
        <span>TMS</span>
      )}
    </header>
  );
}
```

### 8. Verificar se é Admin SaaS

```typescript
import { tenantAuthService } from './services/tenantAuthService';

async function checkAdmin() {
  const isAdmin = await tenantAuthService.isSaasAdmin();

  if (isAdmin) {
    // Mostrar funcionalidades administrativas
  }
}
```

---

## 🗄️ Para DBAs

### Criar Nova Organização

```sql
-- 1. Criar organização
INSERT INTO organizations (name, slug, plan_id, subscription_status)
VALUES (
  'Minha Empresa',
  'minha-empresa',
  (SELECT id FROM saas_plans WHERE slug = 'starter'),
  'trial'
);

-- 2. Criar settings padrão
INSERT INTO organization_settings (organization_id)
VALUES (
  (SELECT id FROM organizations WHERE slug = 'minha-empresa')
);

-- 3. Criar usuário admin para a org
INSERT INTO users (
  organization_id,
  nome,
  email,
  senha,
  perfil,
  is_active
)
VALUES (
  (SELECT id FROM organizations WHERE slug = 'minha-empresa'),
  'Admin',
  'admin@minhaempresa.com',
  'senha_hash_aqui',
  'administrador',
  true
);
```

### Ver Estatísticas de Organização

```sql
SELECT * FROM saas_organization_stats
WHERE slug = 'minha-empresa';
```

### Verificar Isolamento

```sql
-- Ver organization_id de uma tabela
SELECT DISTINCT organization_id, COUNT(*) as total
FROM orders
GROUP BY organization_id;

-- Verificar RLS habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false;  -- Deve retornar 0 linhas
```

---

## 🧪 Para Testers

### Testar Isolamento

1. **Criar 2 organizações:**
```sql
INSERT INTO organizations (name, slug, plan_id)
VALUES
  ('Org A', 'org-a', (SELECT id FROM saas_plans WHERE slug = 'free')),
  ('Org B', 'org-b', (SELECT id FROM saas_plans WHERE slug = 'free'));
```

2. **Criar usuários em cada org:**
```sql
-- Usuário Org A
INSERT INTO users (organization_id, nome, email, senha, perfil)
VALUES (
  (SELECT id FROM organizations WHERE slug = 'org-a'),
  'User A',
  'usera@test.com',
  'senha123',
  'administrador'
);

-- Usuário Org B
INSERT INTO users (organization_id, nome, email, senha, perfil)
VALUES (
  (SELECT id FROM organizations WHERE slug = 'org-b'),
  'User B',
  'userb@test.com',
  'senha123',
  'administrador'
);
```

3. **Fazer login com cada usuário e verificar:**
   - ✅ User A vê apenas dados de Org A
   - ✅ User B vê apenas dados de Org B
   - ❌ User A NÃO vê dados de Org B
   - ❌ User B NÃO vê dados de Org A

### Testar Admin Console

1. Login em `/saas-admin` com `admin@saas.local`
2. Verificar que vê TODAS as organizações
3. Verificar que pode editar qualquer organização
4. Verificar estatísticas globais

---

## 🔧 Para DevOps

### Variáveis de Ambiente

```bash
# .env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

### Migrations

```bash
# Verificar migrations aplicadas
supabase migration list

# Aplicar migrations
supabase db push

# Criar nova migration
supabase migration new nome_da_migration
```

### Backup de Dados

```sql
-- Backup de uma organização específica
COPY (
  SELECT * FROM orders
  WHERE organization_id = 'uuid-da-org'
) TO '/tmp/orders_backup.csv' CSV HEADER;

-- Restaurar para outra organização
COPY orders FROM '/tmp/orders_backup.csv' CSV HEADER;
UPDATE orders
SET organization_id = 'nova-uuid-org'
WHERE organization_id IS NULL;
```

---

## 📊 Queries Úteis

### Ver Planos e Features

```sql
SELECT
  slug,
  name,
  price_monthly,
  max_companies,
  max_users,
  features
FROM saas_plans
ORDER BY price_monthly;
```

### Ver Organizações Ativas

```sql
SELECT
  o.name,
  o.slug,
  o.subscription_status,
  p.name as plan_name,
  COUNT(DISTINCT u.id) as users,
  COUNT(DISTINCT ord.id) as orders
FROM organizations o
LEFT JOIN saas_plans p ON p.id = o.plan_id
LEFT JOIN users u ON u.organization_id = o.id
LEFT JOIN orders ord ON ord.organization_id = o.id
WHERE o.is_active = true
GROUP BY o.id, o.name, o.slug, o.subscription_status, p.name;
```

### Ver Uso por Organização

```sql
SELECT
  o.name,
  COUNT(DISTINCT u.id) as users,
  COUNT(DISTINCT e.id) as establishments,
  COUNT(DISTINCT ord.id) as orders,
  COUNT(DISTINCT inv.id) as invoices
FROM organizations o
LEFT JOIN users u ON u.organization_id = o.id
LEFT JOIN establishments e ON e.organization_id = o.id
LEFT JOIN orders ord ON ord.organization_id = o.id
LEFT JOIN invoices_nfe inv ON inv.organization_id = o.id
GROUP BY o.id, o.name;
```

---

## 🐛 Troubleshooting

### Erro: "No organization context found"

**Causa:** Usuário não tem organization_id no JWT

**Solução:**
```typescript
// Verificar organization_id
const orgId = await tenantAuthService.getCurrentOrganizationId();
console.log('Org ID:', orgId);

// Se null, fazer login novamente
await tenantAuthService.loginTMS(email, password);
```

### Erro: "Access denied to this organization"

**Causa:** Tentando acessar dados de outra organização

**Solução:** Verificar se o organization_id está correto

```typescript
const currentOrgId = await tenantMiddleware.getCurrentOrganizationId();
console.log('Current Org:', currentOrgId);
```

### Erro: "Record not found or access denied"

**Causa:** RLS bloqueando acesso

**Solução:** Verificar RLS policies

```sql
-- Ver policies da tabela
SELECT * FROM pg_policies
WHERE tablename = 'orders';

-- Desabilitar temporariamente RLS (DEV ONLY!)
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
```

---

## 📚 Documentação Completa

- **`SAAS_MULTITENANT_INTEGRATION_GUIDE.md`** - Guia completo de integração
- **`SAAS_MULTITENANT_RESUMO_EXECUTIVO.md`** - Resumo executivo
- **`SAAS_QUICK_START.md`** - Este arquivo

---

**Precisa de ajuda?** Consulte a documentação completa ou abra um issue.
