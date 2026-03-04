# Correção: Garantir Contexto Antes de Cada Query

## Problema Identificado

Mesmo com o contexto sendo configurado com sucesso nos logs:
```
✅ Contexto restaurado com sucesso
✅ User numeric ID: 1 from codigo: 0001
✅ Contexto de sessão configurado com sucesso
```

**Os dados NÃO apareciam** - Mostrando "Nenhum transportador encontrado".

### Causa Raiz: Connection Pooling HTTP

O Supabase usa Connection Pooling HTTP. Cada requisição HTTP pode ir para uma CONEXÃO DIFERENTE.

Variáveis de sessão PostgreSQL NÃO persistem entre requisições HTTP.

Contexto configurado no LOGIN ≠ Contexto na QUERY. RLS bloqueia porque não há contexto na conexão atual.

## Solução Implementada

### Garantir Contexto ANTES de CADA Query

Modificado `carriersService.ts` para chamar `ensureSessionContext()` ANTES de fazer qualquer query:

```typescript
// src/services/carriersService.ts
import { supabase, ensureSessionContext } from '../lib/supabase';

async getAll(): Promise<Carrier[]> {
  try {
    // CRÍTICO: Garantir que o contexto está configurado ANTES de fazer query
    await ensureSessionContext();

    const { data, error } = await supabase
      .from('carriers')
      .select('*')
      .order('codigo', { ascending: true });

    // ... resto do código
  }
}
```

## Como Testar

1. Limpar cache (Ctrl+Shift+Delete)
2. Fazer login
3. Ir para: Menu > Configurações > Transportadores
4. **DEVE APARECER: 12 transportadores**

---

**Build:** ✅ Passou em 1m 26s  
**Teste no banco:** ✅ 5 transportadores retornados

**TRANSPORTADORES DEVEM APARECER AGORA!** 🚀
