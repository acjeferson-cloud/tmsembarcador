# Guia de Implementação de Change Logs

## Visão Geral

O sistema possui um mecanismo centralizado para registro de todas as alterações realizadas nas parametrizações através do `changeLogsService`. Este guia explica como implementar logs em novos módulos e services.

## Estrutura da Tabela `change_logs`

```sql
- id (uuid, PK)
- entity_type (text) - Tipo da entidade (ex: 'users', 'countries', 'establishments')
- entity_id (text) - ID da entidade modificada
- action_type (text) - Tipo de ação: 'CREATE', 'UPDATE', 'DELETE'
- user_id (integer) - ID do usuário que realizou a ação
- user_name (text) - Nome do usuário
- field_name (text) - Nome do campo alterado
- old_value (text) - Valor anterior
- new_value (text) - Valor novo
- created_at (timestamptz) - Data/hora da modificação
```

## Como Implementar Logs em um Service

### 1. Importar o `changeLogsService`

```typescript
import { changeLogsService } from './changeLogsService';
```

### 2. Registrar Criação (CREATE)

No método `create` do seu service:

```typescript
async create(data: YourType): Promise<YourType | null> {
  try {
    const { data: newRecord, error } = await supabase
      .from('your_table')
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    // Registrar log de criação
    await changeLogsService.logCreate({
      entityType: 'your_table',  // Nome da tabela/entidade
      entityId: newRecord.id,
      entityName: `${newRecord.name} (${newRecord.code})`,  // Descrição do registro
      userId: data.created_by,
      userName: data.user_name || 'Sistema'
    });

    return newRecord;
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  }
}
```

### 3. Registrar Atualização (UPDATE)

No método `update` do seu service:

```typescript
async update(id: string, data: Partial<YourType>): Promise<YourType | null> {
  try {
    // IMPORTANTE: Buscar dados antigos ANTES de atualizar
    const oldData = await this.getById(id);

    const { data: updatedRecord, error } = await supabase
      .from('your_table')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Registrar logs de todas as alterações automaticamente
    if (oldData) {
      await changeLogsService.logMultipleUpdates({
        entityType: 'your_table',
        entityId: id,
        oldData,
        newData: updatedRecord,
        userId: data.updated_by,
        userName: oldData.name || 'Sistema'
      });
    }

    return updatedRecord;
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  }
}
```

### 4. Registrar Exclusão (DELETE)

No método `delete` do seu service:

```typescript
async delete(id: string): Promise<boolean> {
  try {
    // IMPORTANTE: Buscar dados ANTES de excluir
    const record = await this.getById(id);

    const { error } = await supabase
      .from('your_table')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Registrar log de exclusão
    if (record) {
      await changeLogsService.logDelete({
        entityType: 'your_table',
        entityId: id,
        entityName: `${record.name} (${record.code})`,
        userName: 'Sistema'
      });
    }

    return true;
  } catch (error) {
    console.error('Erro:', error);
    return false;
  }
}
```

## Funções Auxiliares Disponíveis

### `logCreate()`
Registra a criação de um novo registro.

```typescript
await changeLogsService.logCreate({
  entityType: string,
  entityId: string,
  entityName: string,
  userId?: number,
  userName: string
});
```

### `logUpdate()`
Registra a alteração de um único campo.

```typescript
await changeLogsService.logUpdate({
  entityType: string,
  entityId: string,
  fieldName: string,
  oldValue: any,
  newValue: any,
  userId?: number,
  userName: string
});
```

### `logMultipleUpdates()`
Registra automaticamente TODAS as alterações entre dois objetos (recomendado).

```typescript
await changeLogsService.logMultipleUpdates({
  entityType: string,
  entityId: string,
  oldData: any,
  newData: any,
  userId?: number,
  userName: string,
  fieldsToLog?: string[]  // Opcional: especificar campos específicos
});
```

### `logDelete()`
Registra a exclusão de um registro.

```typescript
await changeLogsService.logDelete({
  entityType: string,
  entityId: string,
  entityName: string,
  userId?: number,
  userName: string
});
```

## Nomenclatura de `entity_type`

Use o nome da tabela no plural e em inglês:
- ✅ `users`
- ✅ `countries`
- ✅ `states`
- ✅ `cities`
- ✅ `establishments`
- ✅ `occurrences`
- ✅ `rejection_reasons`
- ✅ `licenses`
- ✅ `whatsapp_config`
- ✅ `google_maps_config`
- ✅ `openai_config`

## Services já Implementados

### ✅ Implementados com Logs Completos:
- `usersService` - Usuários
- `establishmentsService` - Estabelecimentos (já existia)

### ⚠️ Imports Adicionados (Aguardando Implementação):
- `countriesService` - Países
- `statesService` - Estados
- `citiesService` - Cidades
- `occurrencesService` - Ocorrências
- `rejectionReasonsService` - Motivos de Rejeição
- `licensesService` - Licenças

### 📋 Pendentes:
- `implementationService` - Centro de Implementação
- `whatsappService` - WhatsApp Business
- `googleMapsService` - Google Maps
- `openaiService` - OpenAI/ChatGPT

## Visualização dos Logs

Os logs podem ser visualizados em:
1. **Menu Lateral** → **Log de Modificações**
2. **Filtros disponíveis**: Por entidade, por usuário, por tipo de ação
3. **Detalhes**: Data, usuário, campo, valor anterior, valor novo

## Boas Práticas

1. **SEMPRE** busque os dados antigos antes de atualizar/excluir
2. **SEMPRE** registre o log APÓS a operação ser bem-sucedida
3. Use `logMultipleUpdates()` para updates - é mais eficiente
4. Forneça `entityName` descritivos para facilitar identificação
5. Os logs são registrados de forma assíncrona - não bloqueiam a operação principal
6. Erros nos logs não devem impedir a operação principal (catch interno)

## Exemplo Completo: Countries Service

```typescript
import { supabase } from '../lib/supabase';
import { changeLogsService } from './changeLogsService';

export const countriesService = {
  async create(country: Country): Promise<Country | null> {
    try {
      const { data, error } = await supabase
        .from('countries')
        .insert(country)
        .select()
        .single();

      if (error) throw error;

      await changeLogsService.logCreate({
        entityType: 'countries',
        entityId: data.id,
        entityName: `${data.name} (${data.code})`,
        userName: 'Sistema'
      });

      return data;
    } catch (error) {
      console.error('Erro:', error);
      throw error;
    }
  },

  async update(id: string, country: Partial<Country>): Promise<Country | null> {
    try {
      const oldData = await this.getById(id);

      const { data, error } = await supabase
        .from('countries')
        .update(country)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (oldData) {
        await changeLogsService.logMultipleUpdates({
          entityType: 'countries',
          entityId: id,
          oldData,
          newData: data,
          userName: 'Sistema'
        });
      }

      return data;
    } catch (error) {
      console.error('Erro:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const country = await this.getById(id);

      const { error } = await supabase
        .from('countries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      if (country) {
        await changeLogsService.logDelete({
          entityType: 'countries',
          entityId: id,
          entityName: `${country.name} (${country.code})`,
          userName: 'Sistema'
        });
      }

      return true;
    } catch (error) {
      console.error('Erro:', error);
      return false;
    }
  }
};
```

## Troubleshooting

### Logs não aparecem no sistema
1. Verifique se o `entityType` está correto
2. Verifique se o log está sendo registrado APÓS o sucesso da operação
3. Verifique erros no console do navegador

### Performance
- Os logs são assíncronos e não bloqueiam
- Para bulk operations, considere registrar um log resumido ao invés de um por item
- A função `logMultipleUpdates` já otimiza registrando apenas campos que mudaram

## Suporte

Para dúvidas ou problemas, consulte:
- Arquivo: `src/services/changeLogsService.ts`
- Componente: `src/components/ChangeLog/ChangeLog.tsx`
- Tabela: `change_logs` no Supabase
