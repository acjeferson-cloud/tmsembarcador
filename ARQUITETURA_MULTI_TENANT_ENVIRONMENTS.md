# Arquitetura Multi-Tenant com Environments

## Visão Geral

O sistema TMS Embarcador foi refatorado para suportar uma arquitetura **SaaS B2B Multi-Tenant completa** com isolamento por **Environments (Ambientes)**.

---

## Hierarquia Obrigatória

```
SAAS ADMIN CONSOLE (global)
 └── ORGANIZATION (tenant)
       └── ENVIRONMENT (produção, testes, homologação, sandbox, desenvolvimento)
             └── COMPANY / ESTABELECIMENTO
                   └── Dados operacionais (usuários, fretes, documentos, regras)
```

---

## 1. Componentes da Arquitetura

### 1.1 SaaS Admin Console (Global)
- **Acesso**: `/SaasAdminConsole` (URL direta, não aparece no menu)
- **Autenticação**: Própria, via tabela `saas_admin_users`
- **Credenciais**:
  - Email: `admin@gruposmartlog.com.br`
  - Senha: `JE278l2035A#`
- **Funcionalidades**:
  - Gerenciar Organizações (Tenants)
  - Gerenciar Ambientes (Environments)
  - Gerenciar Planos SaaS
  - White Label (marca personalizada)
  - Logs de Auditoria
  - Métricas globais

### 1.2 Organization (Tenant)
- **Tabela**: `organizations`
- **Campos principais**:
  - `id` (uuid, PK)
  - `name` (text) - Nome da organização
  - `slug` (text, unique) - Identificador único
  - `domain` (text) - Domínio customizado (white-label)
  - `plan_id` (uuid) - Plano SaaS
  - `subscription_status` - active, trial, suspended, cancelled
  - `is_active` (boolean)

### 1.3 Environment (Ambiente)
- **Tabela**: `environments`
- **Tipos disponíveis**:
  - `production` - Produção (não pode ser deletado)
  - `staging` - Homologação
  - `testing` - Testes
  - `sandbox` - Sandbox (experimentação)
  - `development` - Desenvolvimento
- **Campos principais**:
  - `id` (uuid, PK)
  - `organization_id` (uuid, FK)
  - `name` (text) - Nome do ambiente
  - `slug` (text) - Identificador único dentro da org
  - `type` (text) - Tipo do ambiente
  - `is_active` (boolean)
  - `data_retention_days` (integer)
  - **UNIQUE constraint**: (organization_id, slug)

### 1.4 Company / Estabelecimento
- **Tabela**: `establishments`
- **Isolamento**: Por `organization_id` + `environment_id`
- **Relacionamento**: Múltiplos estabelecimentos por environment

### 1.5 Dados Operacionais
**TODAS as tabelas operacionais agora contêm**:
- `organization_id` (uuid, NOT NULL)
- `environment_id` (uuid, NOT NULL)

**Tabelas cobertas**:
- `users`, `establishments`, `carriers`, `business_partners`
- `orders`, `invoices_nfe`, `bills`, `pickups`, `ctes`
- `freight_rates`, `freight_rate_tables`, `freight_rate_values`
- `occurrences`, `rejection_reasons`, `holidays`
- `reverse_logistics`, `nps_surveys`, `nps_responses`
- `whatsapp_config`, `google_maps_config`, `openai_config`
- E todas as demais tabelas operacionais

---

## 2. Isolamento de Dados (RLS Policies)

### 2.1 Princípio Fundamental
**NENHUM dado pode ser acessado sem validação de**:
1. `organization_id` do usuário autenticado
2. `environment_id` do usuário autenticado

### 2.2 Exemplo de Policy Atualizada

```sql
CREATE POLICY "Users can view own env users"
  ON users FOR SELECT
  TO authenticated
  USING (
    organization_id = get_current_organization_id()
    AND environment_id = get_current_environment_id()
  );
```

### 2.3 Funções Helper

```sql
-- Retorna organization_id do JWT
CREATE OR REPLACE FUNCTION get_current_organization_id()
RETURNS UUID
AS $$
BEGIN
  RETURN (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Retorna environment_id do JWT
CREATE OR REPLACE FUNCTION get_current_environment_id()
RETURNS UUID
AS $$
BEGIN
  RETURN (auth.jwt() -> 'app_metadata' ->> 'environment_id')::uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 3. Migrations Aplicadas

### 3.1 Migration: add_environment_layer_v2

**Ações executadas**:
1. ✅ Criou tabela `environments`
2. ✅ Criou environment `production` para cada organização existente
3. ✅ Adicionou coluna `environment_id` em todas as tabelas com `organization_id`
4. ✅ Populou `environment_id` com o environment de produção
5. ✅ Tornou `environment_id` NOT NULL
6. ✅ Criou índices compostos (organization_id, environment_id)
7. ✅ Atualizou TODAS as RLS policies para incluir `environment_id`

**Environments padrão criados para organização "default"**:
- `production` (Produção)
- `testing` (Testes)
- `staging` (Homologação)
- `sandbox` (Sandbox)

---

## 4. Serviços Criados/Atualizados

### 4.1 environmentsService.ts
**Novo serviço para gerenciar environments**

```typescript
import { environmentsService } from '../services/environmentsService';

// Listar environments de uma organização
const environments = await environmentsService.getAll(organizationId);

// Buscar environment por slug
const env = await environmentsService.getBySlug(organizationId, 'production');

// Criar novo environment
await environmentsService.create({
  organization_id: orgId,
  name: 'Homologação',
  slug: 'staging',
  type: 'staging',
  description: 'Ambiente de homologação'
});

// Obter estatísticas de um environment
const stats = await environmentsService.getStats(environmentId);
```

### 4.2 OrganizationContext (Atualizado)
**Agora inclui informações de environment**

```typescript
const {
  organization,
  settings,
  currentEnvironment,      // ← NOVO
  availableEnvironments,   // ← NOVO
  switchEnvironment,       // ← NOVO
  isFeatureEnabled
} = useOrganization();
```

### 4.3 baseConfigService.ts
**Funcionamento automático através de RLS**
- Não requer mudanças
- As policies RLS garantem isolamento por environment automaticamente

---

## 5. Interface Administrativa (SaaS Admin Console)

### 5.1 Nova Aba: "Ambientes"
**Localização**: `/SaasAdminConsole` → Aba "Ambientes"

**Funcionalidades**:
- ✅ Listar todas as organizações
- ✅ Expandir/recolher organizações
- ✅ Ver ambientes de cada organização
- ✅ Criar novos ambientes
- ✅ Editar ambientes existentes
- ✅ Ativar/desativar ambientes
- ✅ Visualizar estatísticas por ambiente:
  - Total de usuários
  - Total de estabelecimentos
  - Total de transportadores
  - Total de notas fiscais
  - Total de pedidos

### 5.2 Componentes Criados
1. **SaasEnvironmentsView.tsx**
   - Lista organizações
   - Permite expandir para ver environments

2. **SaasEnvironmentsManager.tsx**
   - CRUD completo de environments
   - Estatísticas em tempo real
   - Validações de segurança

---

## 6. Casos de Uso

### 6.1 Criar Novo Environment para Testes

**Cenário**: Uma organização precisa de um ambiente de testes isolado.

**Passo a passo**:
1. Acessar `/SaasAdminConsole`
2. Fazer login como admin SaaS
3. Ir na aba "Ambientes"
4. Expandir a organização desejada
5. Clicar em "Novo Ambiente"
6. Preencher:
   - Nome: "Testes QA"
   - Slug: "qa-testing"
   - Tipo: "testing"
   - Descrição: "Ambiente para testes de qualidade"
   - Retenção: 90 dias
7. Clicar em "Criar"

**Resultado**:
- Environment criado com isolamento total
- Pode ser usado para testes sem afetar produção
- Dados completamente separados

### 6.2 Migração Produção → Staging

**Cenário**: Copiar estrutura de produção para homologação.

**Status**: Função `cloneData()` preparada, mas não implementada
- Requer cuidados especiais para não corromper dados
- Deve ser implementada com comandos SQL específicos
- TODO: Implementar em fase futura

### 6.3 Trocar de Environment (Usuário Final)

**Funcionalidade**: Usuários podem trocar entre environments disponíveis.

**Como usar**:
```typescript
const { switchEnvironment, availableEnvironments } = useOrganization();

// Trocar para environment de testes
await switchEnvironment(testingEnvironmentId);
```

**Comportamento**:
- Recarrega a aplicação
- Todas as queries respeitam o novo environment
- Isolamento total garantido por RLS

---

## 7. Segurança e Validações

### 7.1 Regras de Negócio
✅ **Environment de produção NÃO pode ser deletado**
✅ **Environment de produção NÃO pode ser desativado**
✅ **Slug deve ser único dentro da organização**
✅ **Dados de um environment NUNCA acessam outro environment**
✅ **Estabelecimentos podem repetir códigos entre environments**

### 7.2 RLS (Row Level Security)
- ✅ Todas as tabelas operacionais têm RLS habilitado
- ✅ Políticas validam `organization_id` E `environment_id`
- ✅ Impossível fazer queries cross-environment
- ✅ Impossível fazer queries cross-organization

### 7.3 Índices de Performance
```sql
CREATE INDEX idx_tablename_org_env
  ON tablename(organization_id, environment_id);
```

**Benefícios**:
- Queries rápidas mesmo com milhões de registros
- Isolamento garantido em nível de banco
- Performance otimizada para multi-tenant

---

## 8. White Label e Preparação

### 8.1 Domínios Customizados
**Já suportado na tabela `organizations`**:
- Campo `domain` permite domínio personalizado
- Ex: `cliente.seudominio.com.br`
- Settings em `organization_settings`

### 8.2 Temas Personalizados
**Por organização**:
- Cores primárias e secundárias
- Logo customizado
- Favicon customizado
- CSS customizado
- Nome e email de envio customizados

---

## 9. Monitoramento e Métricas

### 9.1 Estatísticas por Environment
**Via `environmentsService.getStats()`**:
```typescript
{
  total_users: number,
  total_establishments: number,
  total_carriers: number,
  total_invoices: number,
  total_orders: number,
  storage_used_mb: number  // TODO: implementar
}
```

### 9.2 Logs de Auditoria
**Tabela `saas_admin_logs`**:
- Registra ações dos admins SaaS
- Inclui `organization_id` e `environment_id`
- Rastreabilidade completa

---

## 10. Próximos Passos e Roadmap

### 10.1 Implementações Futuras
- [ ] Clonagem de dados entre environments
- [ ] Sincronização seletiva de tabelas
- [ ] Backup automático por environment
- [ ] Restore pontual por environment
- [ ] Métricas de uso de storage
- [ ] Billing por environment
- [ ] Limites de API por environment
- [ ] Webhooks por environment

### 10.2 Melhorias de Interface
- [ ] Seletor de environment no header do TMS
- [ ] Badge visual indicando environment atual
- [ ] Warning ao entrar em environment de testes
- [ ] Comparação de dados entre environments

---

## 11. Troubleshooting

### Problema: Usuário não vê dados após login
**Causa**: `environment_id` não definido no JWT
**Solução**: Verificar se usuário tem environment atribuído

### Problema: RLS bloqueando queries
**Causa**: Policies validando environment_id
**Solução**: Garantir que JWT contém `environment_id` correto

### Problema: Erro ao criar environment duplicado
**Causa**: UNIQUE constraint (organization_id, slug)
**Solução**: Usar slug único dentro da organização

---

## 12. Checklist de Validação

### Banco de Dados
- [x] Tabela `environments` criada
- [x] Coluna `environment_id` em todas as tabelas
- [x] RLS policies atualizadas
- [x] Índices compostos criados
- [x] Funções helper criadas

### Backend/Serviços
- [x] environmentsService criado
- [x] OrganizationContext atualizado
- [x] baseConfigService compatível

### Frontend
- [x] SaasEnvironmentsView criado
- [x] SaasEnvironmentsManager criado
- [x] SaasAdminConsole atualizado
- [x] Aba "Ambientes" adicionada

### Segurança
- [x] RLS em todas as tabelas
- [x] Validação de organization_id
- [x] Validação de environment_id
- [x] Impossível deletar produção
- [x] Impossível desativar produção

---

## 13. Contatos e Suporte

**Documentação atualizada em**: 2026-01-20
**Versão da arquitetura**: 2.0 (com Environments)
**Compatibilidade**: Supabase PostgreSQL 15+

---

## Apêndice A: Estrutura de Tabelas

### environments
```sql
CREATE TABLE environments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('production', 'staging', 'testing', 'sandbox', 'development')),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  data_retention_days INTEGER DEFAULT 365,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, slug)
);
```

### organizations
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  domain TEXT UNIQUE,
  plan_id UUID REFERENCES saas_plans(id),
  is_active BOOLEAN DEFAULT true,
  trial_ends_at TIMESTAMPTZ,
  subscription_status TEXT DEFAULT 'trial',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

**FIM DA DOCUMENTAÇÃO**
