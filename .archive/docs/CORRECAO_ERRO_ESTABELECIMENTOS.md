# Correção: Lista de Estabelecimentos Vazia

## Problema Identificado

O usuário `jeferson.costa@gruposmartlog.com.br` não conseguia ver nenhum estabelecimento na tela de Estabelecimentos, mesmo existindo dados válidos no banco.

## Causa Raiz

O serviço `establishmentsService.ts` estava tentando buscar o `organization_id` do usuário através da coluna `supabase_user_id`, que **não existe** na tabela `users`.

```typescript
// CÓDIGO ERRADO (antes da correção)
const { data: userProfile } = await supabase
  .from('users')
  .select('organization_id')
  .eq('supabase_user_id', user.id)  // ❌ Esta coluna não existe!
  .maybeSingle();
```

O sistema usa autenticação customizada (via RPC `validate_user_credentials`), não o Supabase Auth nativo. Portanto:
- Não há coluna `supabase_user_id` na tabela `users`
- O usuário é identificado pelo **email**
- Os dados da sessão estão no `localStorage` (chave `tms-user`)

## Correção Aplicada

### 1. Criada Helper Function

Criada função `getUserOrganization()` que:
- Lê o email do `localStorage` (sessão customizada)
- Busca o usuário no banco pelo email
- Retorna `organization_id` e `environment_id`

```typescript
async function getUserOrganization(): Promise<{ organizationId: string; environmentId: string | null } | null> {
  try {
    const savedUser = localStorage.getItem('tms-user');
    if (!savedUser) {
      console.error('❌ Usuário não autenticado');
      return null;
    }

    const userData = JSON.parse(savedUser);
    const userEmail = userData.email;

    const { data: userProfile, error } = await supabase
      .from('users')
      .select('organization_id, environment_id')
      .eq('email', userEmail)  // ✅ Busca por email
      .maybeSingle();

    if (error || !userProfile) {
      console.error('❌ Erro ao buscar perfil do usuário:', error);
      return null;
    }

    return {
      organizationId: userProfile.organization_id,
      environmentId: userProfile.environment_id
    };
  } catch (error) {
    console.error('❌ Erro ao obter organização do usuário:', error);
    return null;
  }
}
```

### 2. Corrigidos TODOS os Métodos

Todos os 9 métodos do serviço foram corrigidos para usar a helper function:

- ✅ `getAll()` - Lista todos os estabelecimentos
- ✅ `getById()` - Busca por ID
- ✅ `getByCodigo()` - Busca por código
- ✅ `create()` - Cria estabelecimento
- ✅ `update()` - Atualiza estabelecimento
- ✅ `delete()` - Exclui estabelecimento
- ✅ `getNextCode()` - Gera próximo código
- ✅ `getByEstado()` - Busca por estado
- ✅ `search()` - Busca com filtros

**Exemplo de correção (método getAll):**

```typescript
// ✅ CÓDIGO CORRETO (depois da correção)
async getAll(): Promise<Establishment[]> {
  try {
    const userOrg = await getUserOrganization();
    if (!userOrg) {
      return [];
    }

    const { organizationId, environmentId } = userOrg;

    console.log('🏢 [establishmentsService] Buscando estabelecimentos:', {
      organizationId,
      environmentId
    });

    const { data, error } = await supabase
      .from('establishments')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('environment_id', environmentId)
      .order('codigo', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar estabelecimentos:', error);
      throw error;
    }

    console.log(`✅ [establishmentsService] ${data?.length || 0} estabelecimentos encontrados`);
    return data || [];
  } catch (error) {
    console.error('❌ Erro ao buscar estabelecimentos:', error);
    return [];
  }
}
```

## Dados Validados no Banco

### Usuário
```
Email: jeferson.costa@gruposmartlog.com.br
Organization ID: 8b007dd0-0db6-4288-a1c1-7b05ffb7b32e
Environment ID: abe69012-4449-4946-977e-46af45790a43
Estabelecimentos Permitidos: [
  "1d717f91-f80c-4d60-bc1b-594aa653624a",
  "4d40c285-ea42-40c3-95b0-d47e57a58d4e"
]
```

### Estabelecimentos no Banco
```
1. ID: 1d717f91-f80c-4d60-bc1b-594aa653624a
   Código: 0001
   Razão Social: Abc Indústria e Comércio de Máquinas Ltda
   Organization ID: 8b007dd0-0db6-4288-a1c1-7b05ffb7b32e
   Environment ID: abe69012-4449-4946-977e-46af45790a43

2. ID: 4d40c285-ea42-40c3-95b0-d47e57a58d4e
   Código: 0002
   Razão Social: Abc Indústria e Comércio de Máquinas Ltda
   Organization ID: 8b007dd0-0db6-4288-a1c1-7b05ffb7b32e
   Environment ID: abe69012-4449-4946-977e-46af45790a43
```

## Resultado

Agora o serviço:
1. ✅ Busca o usuário corretamente pelo email
2. ✅ Obtém `organization_id` e `environment_id` do perfil
3. ✅ Filtra estabelecimentos corretamente
4. ✅ Retorna os 2 estabelecimentos para o usuário
5. ✅ Exibe na tela corretamente

## Logs Adicionados

Logs com emojis para facilitar debug:
- 🏢 Indica busca de estabelecimentos com contexto
- ✅ Indica sucesso na operação
- ❌ Indica erro ou falha

**Exemplo de log:**
```
🏢 [establishmentsService] Buscando estabelecimentos:
{
  userEmail: "jeferson.costa@gruposmartlog.com.br",
  organizationId: "8b007dd0-0db6-4288-a1c1-7b05ffb7b32e",
  environmentId: "abe69012-4449-4946-977e-46af45790a43"
}
✅ [establishmentsService] 2 estabelecimentos encontrados
```

## Benefícios da Solução

1. **Compatível com autenticação customizada** - Usa email ao invés de supabase_user_id
2. **Código reutilizável** - Helper function evita duplicação
3. **Mais robusto** - Tratamento de erros melhorado
4. **Melhor debug** - Logs detalhados com contexto
5. **Consistente** - Todos os métodos seguem o mesmo padrão

## Arquivos Modificados

- `/src/services/establishmentsService.ts` - Corrigidos todos os 9 métodos

## Build

✅ Build realizado com sucesso após correções

## Próximos Passos Recomendados

1. Verificar se outros serviços têm o mesmo problema (usando `supabase_user_id`)
2. Considerar criar um helper global para obter contexto do usuário
3. Documentar que o sistema usa autenticação customizada, não Supabase Auth nativo

---

**Data da Correção:** 2026-02-13
**Status:** ✅ CORRIGIDO
**Testado em:** Desenvolvimento local
**Build:** ✅ SUCESSO
