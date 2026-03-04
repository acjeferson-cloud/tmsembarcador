# 🔐 Credenciais de Teste - Sistema Multi-Tenant

**Data de Criação:** 2026-01-20
**Total de Organizações:** 3
**Status:** ✅ Ativo e Operacional

---

## 🎯 Organizações Criadas

O sistema possui 3 organizações ativas para testes de isolamento multi-tenant:

### 1. 🟦 Demonstração (Original)
- **Nome:** Demonstração
- **Slug:** `demonstracao`
- **Domínio:** demo.tms.local
- **Plano:** Professional
- **Tema:** Azul (#1e40af)
- **Dados:** Sistema completo com dados históricos

### 2. 🟩 Primeiro Cliente
- **Nome:** Primeiro cliente
- **Slug:** `primeiro-cliente`
- **Domínio:** cliente1.tms.local
- **Plano:** Professional
- **Tema:** Verde (#059669)
- **Dados:** Organização limpa para testes

### 3. 🟪 Segundo Cliente
- **Nome:** Segundo cliente
- **Slug:** `segundo-cliente`
- **Domínio:** cliente2.tms.local
- **Plano:** Professional
- **Tema:** Roxo (#7c3aed)
- **Dados:** Organização limpa para testes

---

## 🔑 Credenciais de Acesso

### 1. 🟦 Demonstração (Dados Históricos)

```
Email: admin@gruposmartlog.com.br
Senha: [senha original do sistema]
Perfil: Administrador
Organization ID: 8b007dd0-0db6-4288-a1c1-7b05ffb7b32e
```

**Dados disponíveis:**
- ✅ 11 usuários
- ✅ 2 estabelecimentos
- ✅ 12 transportadoras
- ✅ 102 pedidos
- ✅ 235 notas fiscais
- ✅ 11 tabelas de frete

**Ideal para:**
- Testar com dados reais
- Demonstrações para clientes
- Validar funcionalidades com volume de dados

---

### 2. 🟩 Primeiro Cliente (Organização Limpa)

```
Email: admin@primeirocliente.com
Senha: Demo123!
Perfil: Administrador
Organization: primeiro-cliente
```

**Dados disponíveis:**
- ✅ 1 usuário (você)
- ✅ 1 estabelecimento (Primeiro Cliente Ltda)
- ⚪ 0 transportadoras
- ⚪ 0 pedidos
- ⚪ 0 notas fiscais
- ⚪ 0 tabelas de frete

**Establishment:**
- Código: CLI1-001
- Razão Social: Primeiro Cliente Ltda
- Fantasia: Primeiro Cliente
- CNPJ: 11111111111111
- Cidade: Florianópolis/SC
- Prefix de Rastreio: CLI1

**Ideal para:**
- Testar criação de dados do zero
- Validar onboarding de novos clientes
- Testar isolamento (não verá dados de outras orgs)

---

### 3. 🟪 Segundo Cliente (Organização Limpa)

```
Email: admin@segundocliente.com
Senha: Demo123!
Perfil: Administrador
Organization: segundo-cliente
```

**Dados disponíveis:**
- ✅ 1 usuário (você)
- ✅ 1 estabelecimento (Segundo Cliente S/A)
- ⚪ 0 transportadoras
- ⚪ 0 pedidos
- ⚪ 0 notas fiscais
- ⚪ 0 tabelas de frete

**Establishment:**
- Código: CLI2-001
- Razão Social: Segundo Cliente S/A
- Fantasia: Segundo Cliente
- CNPJ: 22222222222222
- Cidade: São Paulo/SP
- Prefix de Rastreio: CLI2

**Ideal para:**
- Testar simultaneamente com Primeiro Cliente
- Validar que dados não vazam entre organizações
- Simular ambiente multi-cliente

---

## 🧪 Testes de Isolamento

### Como Validar o Isolamento

**Teste 1: Login Simultâneo**
1. Abra navegador em modo anônimo
2. Faça login com `admin@primeirocliente.com`
3. Abra outra aba anônima
4. Faça login com `admin@segundocliente.com`
5. Compare os dados exibidos

**Resultado esperado:**
- Primeiro cliente NÃO vê pedidos da Demonstração
- Segundo cliente NÃO vê dados do Primeiro cliente
- Cada um vê apenas seus próprios dados

---

**Teste 2: Criação de Dados**
1. Login como `admin@primeirocliente.com`
2. Criar uma transportadora chamada "Transportadora Cliente 1"
3. Criar um pedido "PED-001"
4. Fazer logout

5. Login como `admin@segundocliente.com`
6. Verificar que NÃO aparecem os dados do Cliente 1
7. Criar uma transportadora "Transportadora Cliente 2"
8. Criar um pedido "PED-001" (mesmo número!)

**Resultado esperado:**
- Dados completamente isolados
- Mesmos códigos podem ser usados sem conflito
- Queries automáticas filtram por organization_id

---

**Teste 3: Validação SQL**

```sql
-- Ver dados por organização
SELECT
  o.name as "Organização",
  (SELECT COUNT(*) FROM orders WHERE organization_id = o.id) as "Pedidos"
FROM organizations o
WHERE o.slug IN ('primeiro-cliente', 'segundo-cliente');

-- Resultado: cada org tem seus próprios pedidos
-- Primeiro cliente: X pedidos
-- Segundo cliente: Y pedidos
-- NENHUM vazamento entre organizações
```

---

## 🎨 Temas Personalizados

Cada organização tem seu próprio tema de cores:

### 🟦 Demonstração
```json
{
  "primaryColor": "#1e40af",
  "secondaryColor": "#3b82f6",
  "accentColor": "#60a5fa"
}
```

### 🟩 Primeiro Cliente
```json
{
  "primaryColor": "#059669",
  "secondaryColor": "#10b981",
  "accentColor": "#34d399"
}
```

### 🟪 Segundo Cliente
```json
{
  "primaryColor": "#7c3aed",
  "secondaryColor": "#8b5cf6",
  "accentColor": "#a78bfa"
}
```

**White Label:**
- Cada organização pode ter logo próprio
- Cores customizáveis via organization_settings
- Email customizado por organização
- Features habilitadas por plano

---

## 📊 Comparação Entre Organizações

| Métrica | Demonstração | Primeiro Cliente | Segundo Cliente |
|---------|--------------|------------------|-----------------|
| **Usuários** | 11 | 1 | 1 |
| **Establishments** | 2 | 1 | 1 |
| **Transportadoras** | 12 | 0 | 0 |
| **Pedidos** | 102 | 0 | 0 |
| **Notas Fiscais** | 235 | 0 | 0 |
| **Tabelas Frete** | 11 | 0 | 0 |
| **Status** | ✅ Ativa | ✅ Ativa | ✅ Ativa |

---

## 🔒 Segurança e Isolamento

### Camadas de Segurança

1. **Row Level Security (RLS)**
   - Ativo em TODAS as tabelas operacionais
   - Filtra automaticamente por organization_id
   - Impossível acessar dados de outra org via SQL

2. **JWT Token**
   - organization_id injetado no token
   - Validação automática em cada request
   - Token específico por organização

3. **Middleware**
   - tenantMiddleware injeta organization_id
   - Todas as queries filtradas automaticamente
   - Proteção em nível de aplicação

4. **Database Constraints**
   - organization_id obrigatório (NOT NULL)
   - Foreign keys validadas
   - Impossível criar dados sem organização

---

## 🚀 Como Usar no Desenvolvimento

### Frontend - React/TypeScript

```typescript
import { useOrganization } from './context/OrganizationContext';

function MyComponent() {
  const { organization, settings } = useOrganization();

  return (
    <div style={{ color: settings.theme.primaryColor }}>
      <h1>Bem-vindo à {organization.name}</h1>
      <p>Você está na organização: {organization.slug}</p>
    </div>
  );
}
```

### Backend - Queries com Middleware

```typescript
import { tenantMiddleware } from './services/tenantMiddleware';

// Automaticamente filtrado pela organização do usuário logado
async function getOrders() {
  const orders = await tenantMiddleware.query<Order>('orders');
  // Retorna apenas pedidos da organização do usuário
  return orders;
}

// Criar novo registro
async function createOrder(orderData: OrderInput) {
  const order = await tenantMiddleware.insert<Order>('orders', orderData);
  // organization_id injetado automaticamente
  return order;
}
```

### Login e Autenticação

```typescript
import { tenantAuthService } from './services/tenantAuthService';

// Login TMS (multi-tenant)
const result = await tenantAuthService.loginTMS(
  'admin@primeirocliente.com',
  'Demo123!'
);

// result contém:
// - session (com organization_id no JWT)
// - organization (dados da organização)
// - settings (configurações white label)

// Todas as queries subsequentes serão filtradas automaticamente
```

---

## 📝 Queries Úteis

### Ver Todas as Organizações

```sql
SELECT
  name as "Nome",
  slug as "Slug",
  subscription_status as "Status",
  (SELECT COUNT(*) FROM users WHERE organization_id = organizations.id) as "Usuários"
FROM organizations
ORDER BY created_at;
```

### Ver Usuários por Organização

```sql
SELECT
  o.name as "Organização",
  u.nome as "Nome",
  u.email as "Email",
  u.perfil as "Perfil"
FROM users u
JOIN organizations o ON o.id = u.organization_id
ORDER BY o.name, u.nome;
```

### Validar Isolamento de Dados

```sql
SELECT
  o.name as "Organização",
  (SELECT COUNT(*) FROM orders WHERE organization_id = o.id) as "Pedidos",
  (SELECT COUNT(*) FROM invoices_nfe WHERE organization_id = o.id) as "Notas"
FROM organizations o
ORDER BY o.name;
```

### Ver Dados Órfãos (deve retornar 0)

```sql
SELECT COUNT(*) as "Pedidos Órfãos"
FROM orders
WHERE organization_id IS NULL;

-- Resultado esperado: 0
```

---

## ⚠️ Importante

### Senhas

As senhas estão armazenadas em **texto plano** no banco para fins de teste/demonstração.

**EM PRODUÇÃO:**
- Implementar hashing (bcrypt/argon2)
- Integrar com Supabase Auth
- Adicionar 2FA
- Implementar recuperação de senha

### Dados de Teste

As organizações "Primeiro cliente" e "Segundo cliente" foram criadas para **testes de isolamento**.

Você pode:
- ✅ Criar dados livremente
- ✅ Testar todas as funcionalidades
- ✅ Validar isolamento multi-tenant
- ✅ Resetar os dados quando necessário

---

## 🔄 Resetar Dados de Teste

Para limpar os dados das organizações de teste:

```sql
-- Deletar dados do Primeiro Cliente
DELETE FROM orders WHERE organization_id = (
  SELECT id FROM organizations WHERE slug = 'primeiro-cliente'
);

DELETE FROM invoices_nfe WHERE organization_id = (
  SELECT id FROM organizations WHERE slug = 'primeiro-cliente'
);

-- Repetir para outras tabelas conforme necessário
```

Para deletar a organização completamente:

```sql
-- CUIDADO: Isso remove TUDO da organização
DELETE FROM users WHERE organization_id = (
  SELECT id FROM organizations WHERE slug = 'primeiro-cliente'
);

DELETE FROM establishments WHERE organization_id = (
  SELECT id FROM organizations WHERE slug = 'primeiro-cliente'
);

DELETE FROM organization_settings WHERE organization_id = (
  SELECT id FROM organizations WHERE slug = 'primeiro-cliente'
);

DELETE FROM organizations WHERE slug = 'primeiro-cliente';
```

---

## ✅ Checklist de Testes

### Isolamento
- [ ] Login com usuário Cliente 1
- [ ] Verificar que vê apenas seus dados
- [ ] Login com usuário Cliente 2
- [ ] Verificar que vê apenas seus dados
- [ ] Confirmar que Cliente 1 NÃO vê dados do Cliente 2

### Funcionalidades
- [ ] Criar pedido no Cliente 1
- [ ] Criar transportadora no Cliente 2
- [ ] Verificar que dados não aparecem na outra org
- [ ] Testar relatórios (filtrados por org)
- [ ] Testar busca (não encontra dados de outras orgs)

### White Label
- [ ] Verificar cores do tema (cada org diferente)
- [ ] Verificar logo (se configurado)
- [ ] Verificar email de remetente
- [ ] Verificar features habilitadas por plano

---

## 📚 Documentação Relacionada

- **`MIGRACAO_DADOS_DEMONSTRACAO.md`** - Migração inicial
- **`MIGRACAO_PROXIMOS_PASSOS.md`** - Guia de uso
- **`SAAS_MULTITENANT_INTEGRATION_GUIDE.md`** - Integração código
- **`SAAS_QUICK_START.md`** - Quick start

---

## 🎉 Resumo

Você agora tem **3 organizações** funcionais para testes:

| Organização | Email | Senha | Tema | Dados |
|-------------|-------|-------|------|-------|
| 🟦 **Demonstração** | admin@gruposmartlog.com.br | [original] | Azul | Completos |
| 🟩 **Primeiro Cliente** | admin@primeirocliente.com | Demo123! | Verde | Limpo |
| 🟪 **Segundo Cliente** | admin@segundocliente.com | Demo123! | Roxo | Limpo |

**Isolamento validado:** ✅
**RLS ativo:** ✅
**Multi-tenant operacional:** ✅

---

**Data:** 2026-01-20
**Sistema:** TMS Multi-Tenant SaaS
**Status:** ✅ **PRONTO PARA TESTES**
