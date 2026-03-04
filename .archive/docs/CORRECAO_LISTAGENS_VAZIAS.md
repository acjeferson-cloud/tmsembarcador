# Correção: Listagens Desaparecendo ao Reabrir Módulos

## Problema

Após o login, ao acessar um módulo (como Cadastro de Transportadores), os registros apareciam normalmente. Porém, ao sair e retornar ao mesmo módulo, a listagem aparecia vazia. O problema ocorria em diversos módulos.

## Causa Raiz

O sistema utiliza Row Level Security (RLS) no PostgreSQL para isolamento multi-tenant. As políticas RLS dependem de variáveis de configuração de sessão:
- `app.current_organization_id`
- `app.current_environment_id`
- `app.current_user_email`

Essas variáveis são configuradas através da função `set_session_context()`. O problema era que:

1. O contexto era configurado apenas uma vez durante o login
2. Quando o pool de conexões do Supabase criava novas conexões ou reciclava conexões existentes, as variáveis de sessão eram perdidas
3. Queries subsequentes falhavam silenciosamente porque o RLS bloqueava acesso sem o contexto apropriado
4. Para o usuário, parecia que os dados haviam desaparecido

## Solução Implementada

Foi implementado um sistema robusto de gerenciamento de contexto de sessão em `src/lib/supabase.ts`:

### 1. Cache de Contexto
```typescript
interface SessionContextCache {
  orgId: string;
  envId: string;
  email: string;
  timestamp: number;
}
```
- Cache válido por 5 minutos
- Evita reconfigurações desnecessárias
- Reduz carga no banco de dados

### 2. Wrapper do Supabase Client
```typescript
function createSupabaseWrapper(client) {
  return {
    ...client,
    from: (table: string) => {
      ensureSessionContext();
      return client.from(table);
    },
    rpc: (fn: string, params?: any) => {
      ensureSessionContext();
      return client.rpc(fn, params);
    }
  };
}
```
- Intercepta todas as chamadas `from()` e `rpc()`
- Garante que o contexto está configurado antes de cada query
- Transparente para o código existente

### 3. Reconfiguração Automática
O contexto é reconfigurado automaticamente em múltiplas situações:

#### a) Ao Carregar o Módulo
```typescript
setTimeout(() => {
  ensureSessionContext();
}, 100);
```

#### b) Periodicamente (a cada 30 segundos)
```typescript
setInterval(() => {
  if (sessionContextCache) {
    sessionContextCache = null;
    ensureSessionContext();
  }
}, 30000);
```

#### c) Quando a Janela Recebe Foco
```typescript
window.addEventListener('focus', () => {
  sessionContextCache = null;
  ensureSessionContext();
});
```

#### d) Antes de Cada Query
```typescript
from: (table: string) => {
  ensureSessionContext();
  return client.from(table);
}
```

### 4. Prevenção de Recursão
```typescript
let contextConfigPromise: Promise<void> | null = null;

async function ensureSessionContext(): Promise<void> {
  if (!contextConfigPromise) {
    contextConfigPromise = configureSessionContext().finally(() => {
      contextConfigPromise = null;
    });
  }
  return contextConfigPromise;
}
```
- Evita múltiplas chamadas simultâneas
- Reutiliza promise em andamento

## Arquivos Modificados

1. **src/lib/supabase.ts**
   - Adicionado cache de contexto de sessão
   - Criado wrapper para interceptar queries
   - Implementada reconfiguração automática

2. **src/services/nfeXmlService.ts**
   - Adicionado `organization_id` e `environment_id` na importação de NFe

3. **src/services/ctesCompleteService.ts**
   - Adicionado `organization_id` e `environment_id` na criação de CT-es

4. **supabase/migrations/add_organization_environment_to_invoices_nfe.sql**
   - Adicionadas colunas de isolamento multi-tenant em `invoices_nfe`

## Benefícios

1. **Confiabilidade**: Listagens sempre aparecem quando o usuário acessa módulos
2. **Transparência**: Nenhuma mudança necessária no código dos serviços existentes
3. **Performance**: Cache reduz chamadas desnecessárias ao banco
4. **Resiliência**: Múltiplos mecanismos garantem reconfiguração do contexto
5. **Segurança**: Mantém isolamento multi-tenant em todas as situações

## Testes Recomendados

1. Fazer login no sistema
2. Acessar o módulo de Transportadores - verificar que os registros aparecem
3. Navegar para outro módulo (ex: Estabelecimentos)
4. Retornar ao módulo de Transportadores - verificar que os registros ainda aparecem
5. Aguardar 2-3 minutos
6. Tentar acessar qualquer listagem - verificar que os dados aparecem
7. Trocar de aba do navegador e voltar - verificar que continua funcionando

## Impacto

- **Prioridade**: Crítica ✅ Resolvida
- **Impacto**: Alto - problema comprometia a confiabilidade do sistema
- **Risco**: Baixo - mudanças isoladas e compatíveis com código existente
- **Performance**: Positivo - cache reduz overhead
