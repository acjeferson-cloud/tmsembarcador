# Novo Fluxo de Login: Organization → Environment → Estabelecimento

## Resumo das Mudanças

Foi implementado um novo fluxo de login em 3 etapas para permitir que o administrador global acesse todas as organizações, ambientes e estabelecimentos do sistema.

## Credenciais do Admin Global

**Email:** `admin@gruposmartlog.com.br`
**Senha:** `admin123`

## Fluxo Completo de Login

### Etapa 1: Login com Email e Senha
- Usuário informa email e senha na tela de login
- Sistema valida credenciais usando `validate_user_credentials`
- Suporta 3 tipos de senha:
  - Bcrypt (hash $2*)
  - SHA-256 (64 caracteres hexadecimais) ✅ ADMIN GLOBAL
  - Texto plano (fallback)

### Etapa 2: Seleção de Organization + Environment
- **NOVO:** Após login bem-sucedido, sistema mostra seletor de Organization/Environment
- Admin global vê TODAS as organizations e TODOS os environments
- Usuários normais veem apenas sua organization/environment
- Tela agrupa environments por organization
- Usuário seleciona qual organization/environment deseja acessar

### Etapa 3: Seleção de Estabelecimento
- Após selecionar organization/environment, sistema configura session context
- Sistema busca estabelecimentos da organization/environment selecionada
- **Admin global vê APENAS os estabelecimentos daquela org/env específica**
- Usuários normais veem apenas seus estabelecimentos permitidos
- Usuário seleciona estabelecimento
- Sistema libera acesso ao TMS

**Exemplo:**
- Admin global seleciona "Demonstração + Produção" → Vê 2 estabelecimentos (0001, 0002)
- Admin global seleciona "Quimidrol + Produção" → Vê 1 estabelecimento (CLI1-001)
- Admin global seleciona "Quimidrol + Homologação" → Vê 1 estabelecimento (0001 - criado automaticamente)
- Admin global seleciona "Demonstração + Sandbox" → Vê 2 estabelecimentos (0001, 0002 do sandbox)

**IMPORTANTE:** Todo environment TEM pelo menos um estabelecimento "0001" criado automaticamente via trigger.
Ver: `AUTO_CRIACAO_ESTABELECIMENTO_0001.md`

### Etapa 4: Acesso ao Sistema
- Usuário pode navegar pelo sistema normalmente
- Todos os dados são filtrados por:
  - Organization selecionada
  - Environment selecionado
  - Estabelecimento selecionado

## Mudanças Técnicas Implementadas

### 1. Correção de `validate_user_credentials`

**Arquivo:** Migration `fix_validate_user_credentials_sha256_v2`

**O que foi feito:**
- Adicionada validação de senhas em SHA-256
- Função agora detecta senhas de 64 caracteres hexadecimais
- Usa `digest('sha256')` para validar hash

**Antes:**
```sql
IF v_user_record.senha LIKE '$2%' THEN
  -- Bcrypt
ELSE
  -- Texto plano
END IF;
```

**Depois:**
```sql
IF v_user_record.senha LIKE '$2%' THEN
  -- Bcrypt
ELSIF LENGTH(v_user_record.senha) = 64 AND v_user_record.senha ~ '^[a-f0-9]+$' THEN
  -- SHA-256
ELSE
  -- Texto plano
END IF;
```

### 2. Nova Função RPC: `get_user_organizations_environments`

**Arquivo:** Migration `create_get_user_organizations_environments`

**O que faz:**
- Retorna lista de organizations e seus environments
- Admin global: retorna TODAS as orgs e TODOS os environments
- Usuários normais: retorna apenas sua org/env

**Retorno:**
```sql
organization_id | organization_name | environment_id | environment_name | environment_type
----------------|-------------------|----------------|------------------|------------------
uuid            | text              | uuid           | text             | production/staging/sandbox
```

**Exemplo de uso:**
```typescript
const { data } = await supabase.rpc('get_user_organizations_environments', {
  p_user_email: 'admin@gruposmartlog.com.br'
});
// Retorna 5 registros (5 environments de 3 organizations)
```

### 3. Correção de `get_user_establishments`

**Arquivo:** Migration `fix_get_user_establishments_filter_by_orgenv`

**O que foi corrigido:**
- **ANTES:** Admin global via TODOS os estabelecimentos do sistema (6 total)
- **DEPOIS:** Admin global vê APENAS estabelecimentos da org/env selecionada

**Lógica:**
```sql
-- Admin global: retorna estabelecimentos filtrados por org/env
IF v_is_global_admin THEN
  RETURN QUERY
  SELECT * FROM establishments e
  WHERE e.organization_id = p_organization_id
    AND e.environment_id = p_environment_id
  ORDER BY e.codigo;
END IF;
```

**Resultados dos Testes:**
- Demonstração + Produção: 2 estabelecimentos ✅
- Demonstração + Sandbox: 2 estabelecimentos ✅
- Quimidrol + Produção: 1 estabelecimento ✅
- Quimidrol + Homologação: (ainda não tem estabelecimentos)
- Segundo cliente + Produção: 1 estabelecimento ✅

### 4. Componente `OrganizationEnvironmentSelector`

**Arquivo:** `src/components/Auth/OrganizationEnvironmentSelector.tsx`

**Features:**
- Mostra organizations agrupadas com seus environments
- Cards visuais para cada environment com cores por tipo:
  - Produção: Verde
  - Homologação: Amarelo
  - Sandbox: Azul
- Auto-seleção quando há apenas 1 option
- Confirmação obrigatória antes de prosseguir
- Design responsivo com dark mode

### 5. Modificação no `useAuth` Hook

**Arquivo:** `src/hooks/useAuth.ts`

**Novos estados:**
```typescript
const [showOrgEnvSelector, setShowOrgEnvSelector] = useState(false);
const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
const [selectedEnvId, setSelectedEnvId] = useState<string | null>(null);
```

**Nova função:**
```typescript
const selectOrganizationEnvironment = async (orgId: string, envId: string) => {
  // 1. Configura session context
  await supabase.rpc('set_session_context', {
    p_organization_id: orgId,
    p_environment_id: envId,
    p_user_email: user.email
  });

  // 2. Armazena seleção
  setSelectedOrgId(orgId);
  setSelectedEnvId(envId);
  localStorage.setItem('tms-selected-org-id', orgId);
  localStorage.setItem('tms-selected-env-id', envId);

  // 3. Busca estabelecimentos
  const { data } = await supabase.rpc('get_user_establishments', {
    p_user_email: user.email,
    p_organization_id: orgId,
    p_environment_id: envId
  });

  // 4. Mostra seletor de estabelecimentos
  setShowEstablishmentSelector(true);
};
```

**Modificação no login:**
```typescript
// ANTES: Buscava estabelecimentos direto após login
await supabase.rpc('get_user_establishments', ...);

// DEPOIS: Mostra seletor de org/env
setShowOrgEnvSelector(true);
```

### 6. Modificação no `App.tsx`

**Arquivo:** `src/App.tsx`

**Novo import:**
```typescript
import { OrganizationEnvironmentSelector } from './components/Auth/OrganizationEnvironmentSelector';
```

**Nova lógica de render:**
```typescript
// 1. Se não logado: Login
if (!user) {
  return <Login onLogin={handleLogin} />;
}

// 2. Se precisa selecionar org/env: OrganizationEnvironmentSelector
if (showOrgEnvSelector && user) {
  return (
    <OrganizationEnvironmentSelector
      isOpen={true}
      userEmail={user.email}
      onSelect={async (orgId, envId) => {
        await selectOrganizationEnvironment(orgId, envId);
      }}
      onClose={() => {}}
    />
  );
}

// 3. Se precisa selecionar estabelecimento: EstablishmentSelectionModal
if (!currentEstablishment || showEstablishmentSelector) {
  return <EstablishmentSelectionModal ... />;
}

// 4. Acesso ao sistema
return <MainApp />;
```

## Estrutura de Dados

### Organizations no Sistema

```
00000001 - Demonstração
  - Produção (ativo)
  - Sandbox (inativo)

00000002 - Quimidrol Comércio Indústria Importação LTDA
  - Produção (ativo)
  - Homologação (ativo)

00000003 - Segundo cliente
  - Produção (ativo)
```

### Estabelecimentos por Organization/Environment

**Total no sistema:** 6 estabelecimentos
- Admin global vê TODOS os 6
- Usuários normais veem apenas os de sua org/env

## Testes Realizados

### Teste 1: Validação de Senha SHA-256
```sql
SELECT * FROM validate_user_credentials(
  'admin@gruposmartlog.com.br',
  'admin123',
  NULL, NULL
);

-- Resultado: success = true ✅
```

### Teste 2: Busca de Organizations/Environments
```sql
SELECT * FROM get_user_organizations_environments('admin@gruposmartlog.com.br');

-- Resultado: 5 registros (5 environments) ✅
```

### Teste 3: Busca de Estabelecimentos
```sql
SELECT COUNT(*) FROM establishments;

-- Resultado: 6 estabelecimentos ✅
```

### Teste 4: Build do Projeto
```bash
npm run build

-- Resultado: ✓ built in 1m 39s ✅
```

## Como Usar

### Passo 1: Acessar o Sistema
1. Abra `https://grupo-smart-log-tms-t5ke.bolt.host/`
2. Digite email: `admin@gruposmartlog.com.br`
3. Digite senha: `admin123`
4. Clique em "Entrar"

### Passo 2: Selecionar Organization e Environment
1. Sistema mostra tela com 3 organizations
2. Cada organization mostra seus environments
3. Selecione uma organization/environment:
   - Demonstração → Produção
   - Quimidrol → Produção
   - Quimidrol → Homologação
   - Segundo cliente → Produção
4. Clique em "Confirmar"

### Passo 3: Selecionar Estabelecimento
1. Sistema busca estabelecimentos da org/env selecionada
2. Admin global vê TODOS os 6 estabelecimentos
3. Selecione um estabelecimento
4. Sistema libera acesso ao TMS

### Passo 4: Usar o Sistema
1. Navegue normalmente pelo TMS
2. Todos os dados são filtrados por:
   - Organization selecionada
   - Environment selecionado
   - Estabelecimento selecionado
3. Pode trocar de estabelecimento clicando no seletor no header

## Diferenças: Admin Global vs Usuário Normal

| Recurso | Admin Global | Usuário Normal |
|---------|-------------|----------------|
| Organizations visíveis no seletor | TODAS (3) | Apenas a sua (1) |
| Environments visíveis no seletor | TODOS (5) | Apenas o seu (1) |
| Estabelecimentos visíveis | **Apenas da org/env selecionada** | Apenas os permitidos |
| Pode trocar de org/env? | ✅ Sim (a qualquer momento) | ❌ Não |
| Vê dados de outras orgs? | ✅ Sim (da org/env selecionada) | ❌ Não |
| RLS bypass? | ✅ Parcial (via is_global_admin_user) | ❌ Não |

**Exemplo Prático:**
- Admin global seleciona "Demonstração + Produção" → Vê 2 estabelecimentos
- Admin global seleciona "Quimidrol + Produção" → Vê 1 estabelecimento diferente
- Admin global pode trocar para "Demonstração + Sandbox" → Vê 2 estabelecimentos do sandbox

## Arquivos Modificados

1. **Migrations:**
   - `fix_validate_user_credentials_sha256_v2.sql` - Validação SHA-256
   - `create_get_user_organizations_environments.sql` - Busca orgs/envs
   - `fix_get_user_establishments_filter_by_orgenv.sql` - Filtro correto por org/env ✅
   - `auto_create_establishment_0001_for_environments.sql` - Auto-criação estabelecimento 0001 ✅

2. **Componentes:**
   - `src/components/Auth/OrganizationEnvironmentSelector.tsx` (NOVO)
   - `src/App.tsx` - Adicionado seletor no fluxo

3. **Hooks:**
   - `src/hooks/useAuth.ts` - Adicionado estados e função selectOrganizationEnvironment

4. **Documentação:**
   - `FLUXO_LOGIN_ORGANIZATION_ENVIRONMENT.md` - Este arquivo
   - `ADMIN_GLOBAL_ACESSO_TOTAL.md` - Documentação do admin global
   - `AUTO_CRIACAO_ESTABELECIMENTO_0001.md` - Auto-criação de estabelecimentos ✅
   - `CORRECAO_FILTRO_ESTABELECIMENTOS.md` - Correção do filtro por org/env ✅

## Garantia de Estabelecimentos

### Auto-Criação de Estabelecimento 0001

**Regra:** TODO environment DEVE ter pelo menos um estabelecimento.

**Implementação:**
1. **Correção de environments existentes:** Quimidrol Homologação recebeu estabelecimento 0001
2. **Trigger automático:** Novos environments recebem estabelecimento 0001 automaticamente
3. **Acesso admin global:** Admin tem acesso implícito a todos os estabelecimentos

**Detalhes técnicos:**
- Função: `create_default_establishment_for_environment()`
- Trigger: `trigger_create_default_establishment`
- Dispara: AFTER INSERT em `environments`
- Cria: Estabelecimento código "0001" com dados temporários

**Ver documentação completa:** `AUTO_CRIACAO_ESTABELECIMENTO_0001.md`

## Próximos Passos

1. **Testar o Login:**
   - Fazer login como admin global
   - Selecionar diferentes organizations/environments
   - Verificar isolamento de dados

2. **Testar Usuário Normal:**
   - Criar um usuário normal vinculado a uma org/env específica
   - Fazer login e verificar que vê apenas sua org/env
   - Verificar que não consegue trocar de org/env

3. **Documentar Permissões:**
   - Criar guia de permissões por perfil
   - Documentar o que cada perfil pode fazer

4. **Alterar Senha Padrão:**
   - CRÍTICO: Alterar senha do admin global antes de produção
   - Guardar nova senha em cofre seguro

## Suporte

Em caso de problemas:

1. **Login não funciona:**
   - Verificar se email é exatamente `admin@gruposmartlog.com.br`
   - Verificar se senha é exatamente `admin123`
   - Verificar logs do navegador (F12)

2. **Não mostra organizations:**
   - Verificar se função `get_user_organizations_environments` existe
   - Executar manualmente no SQL e verificar resultado

3. **Não mostra estabelecimentos:**
   - Verificar se org/env foi selecionado corretamente
   - Verificar se session context foi configurado
   - Verificar se estabelecimentos existem para aquela org/env

## Logs Úteis

Para debugging, adicione no Console do navegador:

```javascript
// Ver usuário logado
JSON.parse(localStorage.getItem('tms-user'))

// Ver session
JSON.parse(localStorage.getItem('tms-session'))

// Ver org/env selecionados
localStorage.getItem('tms-selected-org-id')
localStorage.getItem('tms-selected-env-id')

// Ver estabelecimento
JSON.parse(localStorage.getItem('tms-current-establishment'))
```
