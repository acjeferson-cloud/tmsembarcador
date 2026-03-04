# Correção: Erro ao Salvar Configuração do WhatsApp

## Problema Identificado

Ao salvar a configuração do WhatsApp Business, o sistema apresentava o seguinte erro:

```
null value in column "environment_id" of relation "whatsapp_config" violates not-null constraint
```

## Causa Raiz

O serviço `whatsappService.ts` tinha **dois problemas**:

1. **Estava usando `supabase_user_id`** para buscar o usuário (coluna que não existe)
2. **Não estava incluindo `environment_id`** ao salvar a configuração

A função helper `getUserOrganization()` retornava apenas `organization_id` (string), mas a tabela `whatsapp_config` requer também `environment_id` (constraint NOT NULL).

## Correção Aplicada

### 1. Atualizada a Helper Function

Mudou de retornar apenas `string` para retornar um objeto com ambos os IDs:

```typescript
// ❌ ANTES - Retornava apenas organizationId
async function getUserOrganization(): Promise<string | null> {
  // ...
  return userProfile.organization_id;
}

// ✅ DEPOIS - Retorna organizationId e environmentId
async function getUserOrganization(): Promise<{ organizationId: string; environmentId: string } | null> {
  try {
    const savedUser = localStorage.getItem('tms-user');
    if (!savedUser) {
      console.error('❌ [whatsappService] Usuário não autenticado');
      return null;
    }

    const userData = JSON.parse(savedUser);
    const userEmail = userData.email;

    const { data: userProfile, error } = await supabase
      .from('users')
      .select('organization_id, environment_id')  // ✅ Busca ambos
      .eq('email', userEmail)  // ✅ Busca por email
      .maybeSingle();

    if (error || !userProfile) {
      console.error('❌ [whatsappService] Erro ao buscar perfil do usuário:', error);
      return null;
    }

    if (!userProfile.organization_id || !userProfile.environment_id) {
      console.error('❌ [whatsappService] organization_id ou environment_id não encontrado');
      return null;
    }

    return {
      organizationId: userProfile.organization_id,
      environmentId: userProfile.environment_id
    };
  } catch (error) {
    console.error('❌ [whatsappService] Erro ao obter organização do usuário:', error);
    return null;
  }
}
```

### 2. Atualizado o Método `saveConfig()`

Agora inclui `environment_id` ao salvar:

```typescript
// ❌ ANTES - Sem environment_id
const { error: insertError } = await supabase
  .from('whatsapp_config')
  .insert({
    access_token: config.access_token,
    phone_number_id: config.phone_number_id,
    business_account_id: config.business_account_id,
    webhook_verify_token: config.webhook_verify_token,
    is_active: true,
    created_by: config.created_by,
    organization_id: organizationId,  // ❌ Faltava environment_id
    updated_at: new Date().toISOString()
  });

// ✅ DEPOIS - Com environment_id
async saveConfig(config: WhatsAppConfig): Promise<{ success: boolean; error?: string }> {
  try {
    const userOrg = await getUserOrganization();
    if (!userOrg) {
      throw new Error('Usuário não autenticado ou organization ID não encontrado');
    }

    const { organizationId, environmentId } = userOrg;  // ✅ Desestrutura ambos

    // ... código de desativação de configs antigas ...

    const { error: insertError } = await supabase
      .from('whatsapp_config')
      .insert({
        access_token: config.access_token,
        phone_number_id: config.phone_number_id,
        business_account_id: config.business_account_id,
        webhook_verify_token: config.webhook_verify_token,
        is_active: true,
        created_by: config.created_by,
        organization_id: organizationId,
        environment_id: environmentId,  // ✅ Agora inclui environment_id
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('❌ [whatsappService] Erro ao inserir configuração');
      // ... logs detalhados ...
      throw insertError;
    }

    console.log('✅ [whatsappService] Configuração salva com sucesso');
    return { success: true };
  } catch (error) {
    console.error('❌ [whatsappService] Erro geral ao salvar configuração:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return { success: false, error: `Erro ao salvar configuração do WhatsApp: ${errorMessage}` };
  }
}
```

### 3. Corrigidos Outros Métodos

Também foram corrigidos os métodos:
- ✅ `getActiveConfig()` - Busca configuração ativa
- ✅ `logMessage()` - Registra log de mensagem
- ✅ `getMessageLogs()` - Busca logs de mensagens
- ✅ `getTemplates()` - Busca templates aprovados
- ✅ `getAllTemplates()` - Busca todos templates
- ✅ `saveTemplate()` - Salva template

Todos agora usam a helper function corrigida que:
1. Busca usuário por **email** (não por supabase_user_id)
2. Retorna **organization_id** e **environment_id**

## Estrutura da Tabela whatsapp_config

```sql
CREATE TABLE whatsapp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token TEXT NOT NULL,
  phone_number_id TEXT NOT NULL,
  business_account_id TEXT NOT NULL,
  webhook_verify_token TEXT,
  is_active BOOLEAN DEFAULT true,
  test_status TEXT,
  last_tested_at TIMESTAMPTZ,
  created_by TEXT,
  organization_id UUID NOT NULL,  -- ✅ NOT NULL
  environment_id UUID NOT NULL,   -- ✅ NOT NULL (era aqui o problema!)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Resultado

Agora ao salvar a configuração do WhatsApp:
1. ✅ Busca usuário corretamente por email
2. ✅ Obtém organization_id do perfil
3. ✅ Obtém environment_id do perfil
4. ✅ Salva com ambos os valores preenchidos
5. ✅ Não mais viola constraint NOT NULL

## Teste

Para testar:
1. Atualizar página (Ctrl+Shift+R)
2. Ir em: **Integrações > WhatsApp**
3. Preencher:
   - Access Token
   - Phone Number ID (ex: 123)
   - Business Account ID (ex: 1231231)
4. Clicar em **Salvar Configuração**
5. ✅ Deve salvar com sucesso!

## Logs para Debug

Os logs agora mostram claramente:
```
💾 [whatsappService] Salvando configuração do WhatsApp...
💾 [whatsappService] Dados a salvar: {
  access_token: "***",
  phone_number_id: "123",
  business_account_id: "1231231",
  webhook_verify_token: undefined,
  is_active: true,
  created_by: "...",
  organization_id: "8b007dd0-0db6-4288-a1c1-7b05ffb7b32e",
  environment_id: "abe69012-4449-4946-977e-46af45790a43"  // ✅ Agora está presente!
}
✅ [whatsappService] Configuração salva com sucesso
```

## Arquivos Modificados

- `/src/services/whatsappService.ts`
  - Helper function `getUserOrganization()` - Retorna organizationId e environmentId
  - Método `saveConfig()` - Inclui environment_id ao salvar
  - Métodos `getActiveConfig()`, `logMessage()`, `getMessageLogs()`, `getTemplates()`, `getAllTemplates()`, `saveTemplate()` - Todos atualizados

## Build

✅ Build realizado com sucesso após correções

---

**Data da Correção:** 2026-02-13
**Status:** ✅ CORRIGIDO
**Testado em:** Desenvolvimento local
**Build:** ✅ SUCESSO
