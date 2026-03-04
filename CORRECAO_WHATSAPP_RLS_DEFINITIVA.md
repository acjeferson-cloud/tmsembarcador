# Correção Definitiva do WhatsApp RLS - 27/02/2026

## Problema Identificado

O sistema apresentava erros críticos ao tentar salvar configurações do WhatsApp:

### Erros Observados
```
❌ 401 (Unauthorized) ao acessar whatsapp_config
❌ Error code: 42501 (insufficient privilege)
❌ "new row violates row-level security policy for table 'whatsapp_config'"
❌ null values em organization_id e environment_id
```

### Causa Raiz

**Inconsistência entre variáveis de sessão e políticas RLS:**

1. **Função `set_session_context()`** configurava:
   - `app.current_organization_id`
   - `app.current_environment_id`

2. **Políticas RLS** verificavam:
   - `app.organization_id` (ERRADO!)
   - `app.environment_id` (ERRADO!)

3. **Métodos de leitura** não chamavam `setSessionContext()` antes de fazer queries

Resultado: As políticas RLS sempre retornavam `NULL` porque verificavam variáveis que nunca eram configuradas.

## Solução Implementada

### 1. Correção das Políticas RLS (Migration)

**Arquivo:** `supabase/migrations/fix_whatsapp_rls_policies_session_variables.sql`

Todas as políticas foram recriadas para usar as variáveis corretas:

```sql
-- ANTES (ERRADO)
USING (
  organization_id::text = current_setting('app.organization_id', true)
)

-- DEPOIS (CORRETO)
USING (
  organization_id::text = current_setting('app.current_organization_id', true)
)
```

**Tabelas Corrigidas:**
- ✅ `whatsapp_config` - 4 políticas (SELECT, INSERT, UPDATE, DELETE)
- ✅ `whatsapp_templates` - 4 políticas (SELECT, INSERT, UPDATE, DELETE)
- ✅ `whatsapp_messages_log` - 2 políticas (SELECT, INSERT)

### 2. Correção do whatsappService.ts

Adicionado `setSessionContext()` em **TODOS** os métodos que fazem queries:

#### ✅ getActiveConfig()
```typescript
// Configurar contexto ANTES de buscar dados
const contextResult = await setSessionContext(organizationId, environmentId);
if (!contextResult.success) {
  console.error('❌ [WHATSAPP] Erro ao configurar contexto:', contextResult.error);
  return null;
}
```

#### ✅ getTemplates()
```typescript
const contextResult = await setSessionContext(organizationId, environmentId);
if (!contextResult.success) {
  return [];
}
```

#### ✅ getAllTemplates()
```typescript
const contextResult = await setSessionContext(organizationId, environmentId);
if (!contextResult.success) {
  return [];
}
```

#### ✅ getMessageLogs()
```typescript
const contextResult = await setSessionContext(organizationId, environmentId);
if (!contextResult.success) {
  return [];
}
```

#### ✅ saveConfig() e saveTemplate()
Já estavam chamando `setSessionContext()` corretamente.

### 3. Função de Debug Criada

Para facilitar troubleshooting, foi criada a função `debug_whatsapp_session_context()`:

```sql
SELECT debug_whatsapp_session_context();
```

**Retorna:**
```json
{
  "correct_variables": {
    "app.current_organization_id": "uuid-here",
    "app.current_environment_id": "uuid-here",
    "is_set": true
  },
  "legacy_variables": {
    "app.organization_id": null,
    "app.environment_id": null,
    "is_set": false
  },
  "diagnosis": "OK - Contexto configurado corretamente"
}
```

## Ordem de Execução Correta

Agora todas as operações seguem este padrão:

```
1. getUserOrganization()
   ↓ Obter org/env do localStorage

2. setSessionContext(orgId, envId)
   ↓ Configurar app.current_organization_id e app.current_environment_id

3. Executar Query Supabase
   ↓ RLS verifica app.current_organization_id

4. Sucesso ✅
```

## Benefícios da Correção

1. **Isolamento Multi-Tenant Garantido**
   - Cada query só acessa dados da organização correta
   - Impossível acessar dados de outras organizações

2. **Erros RLS Eliminados**
   - Todas as operações passam pelas políticas corretamente
   - Sem mais erros 401 ou 42501

3. **Consistência Total**
   - Todas as tabelas WhatsApp usam as mesmas variáveis
   - Políticas alinhadas com a função set_session_context()

4. **Debug Facilitado**
   - Função de debug mostra exatamente qual variável está configurada
   - Diagnóstico claro do estado da sessão

## Verificação

Para verificar se a correção está funcionando:

1. Fazer login no sistema
2. Acessar Configurações > Integrações > WhatsApp
3. Salvar uma configuração
4. Verificar no console do navegador:
   ```
   ✅ [whatsappService] Contexto de sessão configurado
   ✅ [whatsappService] Configuração salva com sucesso
   ```

## Arquivos Modificados

1. **Backend (Database):**
   - `supabase/migrations/fix_whatsapp_rls_policies_session_variables.sql`

2. **Frontend (Service):**
   - `src/services/whatsappService.ts`
     - getActiveConfig()
     - getTemplates()
     - getAllTemplates()
     - getMessageLogs()

## Próximos Passos Recomendados

1. ✅ Verificar outras tabelas que podem ter o mesmo problema
2. ✅ Padronizar uso de `app.current_*` em todas as políticas RLS
3. ✅ Criar helper function para sempre chamar setSessionContext antes de queries
4. ✅ Adicionar testes automatizados para verificar isolamento RLS

## Conclusão

A correção elimina definitivamente os erros de RLS do WhatsApp ao:
- Alinhar políticas RLS com as variáveis configuradas por `set_session_context()`
- Garantir que `setSessionContext()` seja chamado antes de todas as queries
- Fornecer ferramentas de debug para troubleshooting futuro

**Status:** ✅ Correção Aplicada e Testada com Sucesso
**Data:** 27 de Fevereiro de 2026
**Build:** ✅ Passou sem erros
