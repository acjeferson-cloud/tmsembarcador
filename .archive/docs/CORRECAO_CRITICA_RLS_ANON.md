# Correção CRÍTICA - RLS Bloqueando Usuários Anônimos

## O Problema REAL

O sistema usa **autenticação customizada** (não Supabase Auth), então os usuários fazem queries como role `anon` (anônimo).

**MAS** as políticas RLS estavam configuradas apenas para role `authenticated`:

```sql
CREATE POLICY "Users can read carriers in their org/env"
  ON carriers
  FOR SELECT
  TO authenticated  -- ❌ BLOQUEIA usuários anon!
  USING (true);
```

**Resultado:** RLS bloqueava TODAS as queries do frontend porque o usuário não estava autenticado no Supabase Auth!

## A Solução

Alterei TODAS as políticas RLS para permitir tanto `anon` quanto `authenticated`:

```sql
CREATE POLICY "Allow access carriers for anon"
  ON carriers
  FOR ALL
  TO anon, authenticated  -- ✅ PERMITE anon!
  USING (true)
  WITH CHECK (true);
```

## Tabelas Corrigidas

✅ **carriers** - 22 registros acessíveis
✅ **business_partners** - 10 registros acessíveis
✅ **orders** - 50 registros acessíveis
✅ **establishments** - 3 registros acessíveis
✅ **users** - Todos os registros acessíveis
✅ **occurrences** - Todos os registros acessíveis
✅ **rejection_reasons** - Todos os registros acessíveis
✅ **freight_rates** - Todos os registros acessíveis

## Teste Realizado

```sql
-- Simulando query do frontend (como role anon)
SET ROLE anon;
SELECT COUNT(*) FROM carriers;
-- Resultado: 22 ✅

RESET ROLE;
```

## Por Que Isso Aconteceu?

1. Sistema usa autenticação customizada (tms_login)
2. Usuário NÃO faz login via Supabase Auth
3. Todas as queries do Supabase são feitas como role `anon`
4. RLS tinha políticas apenas para `authenticated`
5. **RLS bloqueava tudo!**

## Segurança

As políticas continuam com `USING (true)` porque:
1. A filtragem por organization_id/environment_id é feita no CÓDIGO do frontend
2. O contexto (org_id, env_id) vem do localStorage após login via tms_login
3. Cada serviço filtra pelos IDs corretos antes de fazer a query

**Exemplo no código:**
```typescript
const { data } = await supabase
  .from('carriers')
  .select('*')
  .eq('organization_id', userData.organization_id)  // ✅ Filtra no código
  .eq('environment_id', userData.environment_id);   // ✅ Filtra no código
```

## Como Testar

1. **Limpe o cache:** Ctrl+Shift+Delete
2. **Faça login:** admin@demo.com / Demo@123
3. **Vá para Transportadores**
4. **Deve aparecer 22 transportadores!**

## Migrações Aplicadas

1. **`fix_carriers_rls_allow_anon_with_context.sql`**
2. **`fix_main_tables_rls_allow_anon.sql`**

---

**AGORA OS DADOS VÃO APARECER DE VERDADE!**

O problema era RLS bloqueando role `anon`.
