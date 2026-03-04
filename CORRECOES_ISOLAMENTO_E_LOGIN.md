# Correções de Isolamento e Login Multi-Tenant

## Data: 2026-01-20
## Atualização Final: 2026-01-20 (Correção de códigos alfanuméricos)

---

## Problemas Identificados e Resolvidos

### ❌ PROBLEMA 1: Isolamento de Estabelecimentos por Usuário

**Sintoma:**
- Usuário `jeferson.costa@gruposmartlog.com.br` via TODOS os estabelecimentos
- Deveria ver apenas estabelecimentos 0001 e 0002

**Causa Raiz:**
- Policies RLS de establishments tinham `USING (true)`, permitindo acesso total
- Campo `estabelecimentos_permitidos` não estava sendo respeitado
- Usuário tinha array vazio `[]` em vez dos IDs dos estabelecimentos

**Solução Aplicada:**

1. **Removidas policies permissivas antigas:**
   - "Authenticated users can read establishments" (qual: true)
   - "Users can view own env establishments" (sem validação de permissões)

2. **Criadas funções helper:**
   ```sql
   get_user_allowed_establishments() -- Retorna array de UUIDs permitidos
   is_admin_all_establishments()     -- Verifica se é admin total (array vazio)
   ```

3. **Novas policies RLS:**
   - **SELECT**: Apenas estabelecimentos em `estabelecimentos_permitidos` OU admin total
   - **INSERT**: Apenas admins totais
   - **UPDATE**: Apenas estabelecimentos permitidos OU admin total
   - **DELETE**: Apenas admins totais

4. **Atualizado usuário jeferson.costa:**
   ```sql
   UPDATE users
   SET estabelecimentos_permitidos = ARRAY[
     '1d717f91-f80c-4d60-bc1b-594aa653624a',  -- UUID do 0001
     '4d40c285-ea42-40c3-95b0-d47e57a58d4e'   -- UUID do 0002
   ]
   WHERE email = 'jeferson.costa@gruposmartlog.com.br';
   ```

5. **Corrigido código useAuth.ts:**
   - Linha 271: Mudado de `e.codigo` para `e.id` (agora compara UUIDs)
   - Linha 421: Adicionada query com `.in('id', user.estabelecimentosPermitidos)`

**Resultado:**
✅ Usuário agora vê apenas estabelecimentos 0001 e 0002
✅ Admins totais (array vazio) veem todos os estabelecimentos
✅ RLS garante isolamento em nível de banco de dados

---

### ❌ PROBLEMA 2: Erro de Login Multi-Tenant

**Sintoma:**
- Login de `admin@primeirocliente.com` retorna "Erro ao validar credenciais"
- Login de `admin@segundocliente.com` retorna "Erro ao validar credenciais"
- Usuários existem no banco com senhas corretas

**Causa Raiz:**
- Função RPC `validate_user_credentials` estava sendo bloqueada pelo RLS
- Durante o login, não há JWT ainda, então `get_current_organization_id()` retorna NULL
- Policies de `users` table requerem organization_id e environment_id
- Query `SELECT FROM users WHERE email = ...` falhava silenciosamente

**Solução Aplicada:**

1. **Recriada função RPC com bypass de RLS:**
   ```sql
   CREATE OR REPLACE FUNCTION validate_user_credentials(...)
   SECURITY DEFINER
   SET search_path = public
   AS $$
   BEGIN
     -- Usar EXECUTE format() para bypass direto do RLS
     EXECUTE format('
       SELECT * FROM users WHERE email = %L LIMIT 1
     ', p_email)
     INTO v_user_record;

     -- ... resto da lógica
   END;
   $$;
   ```

2. **Adicionados campos no retorno:**
   - `organization_id` e `environment_id` agora são retornados no `user_data`
   - Permite que aplicação saiba a qual org/env o usuário pertence

3. **Garantidas permissões:**
   ```sql
   GRANT EXECUTE ON FUNCTION validate_user_credentials TO anon;
   GRANT EXECUTE ON FUNCTION validate_user_credentials TO authenticated;
   ```

**Problema Adicional Descoberto:**
- Função falhava com erro: `invalid input syntax for type integer: "ADM-CLI1"`
- Tentava converter `codigo::integer`, mas códigos multi-tenant são alfanuméricos
- Exemplo: "ADM-CLI1", "ADM-CLI2" vs "0001", "0002"

**Correção Final Aplicada:**
- Gera ID numérico derivado do UUID do usuário
- Fórmula: `v_user_id := ('x' || substr(v_user_record.id::text, 1, 8))::bit(32)::int`
- Mantém `codigo` como string no objeto retornado
- Não afeta usuários com códigos numéricos

**Resultado:**
✅ Login de admin@primeirocliente.com funciona (id: -1856005315, codigo: "ADM-CLI1")
✅ Login de admin@segundocliente.com funciona (id: -717135893, codigo: "ADM-CLI2")
✅ Login de jeferson.costa funciona (id: 769829840, codigo: "0001")
✅ Cada usuário acessa apenas sua organization e environment
✅ RLS mantém isolamento após login bem-sucedido

---

## Validação das Correções

### Teste 1: Isolamento de Estabelecimentos

```sql
-- Simular usuário jeferson.costa
SET LOCAL jwt.claims.email = 'jeferson.costa@gruposmartlog.com.br';

-- Query deve retornar apenas 2 estabelecimentos
SELECT id, codigo, razao_social
FROM establishments
WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e'
  AND environment_id = 'abe69012-4449-4946-977e-46af45790a43';

-- Resultado esperado: 0001 e 0002
```

### Teste 2: Login Multi-Tenant

```javascript
// Testar login do primeiro cliente
const result = await supabase.rpc('validate_user_credentials', {
  p_email: 'admin@primeirocliente.com',
  p_password: 'Demo123!',
  p_ip_address: null,
  p_user_agent: 'test'
});

console.log(result);
// Deve retornar: { success: true, user_data: {...} }
```

---

## Arquitetura Atualizada

### Hierarquia de Isolamento

```
ORGANIZATION (tenant)
 └── ENVIRONMENT (produção, testes, etc)
       └── COMPANY / ESTABELECIMENTO
             ├── Usuário Admin Total (estabelecimentos_permitidos = [])
             │    └── Acessa TODOS os estabelecimentos
             │
             └── Usuário Restrito (estabelecimentos_permitidos = [uuid1, uuid2])
                  └── Acessa APENAS estabelecimentos específicos
```

### RLS Policies - Establishments

| Operação | Admin Total | Usuário Restrito |
|----------|-------------|------------------|
| SELECT   | ✅ Todos    | ✅ Apenas permitidos |
| INSERT   | ✅ Sim      | ❌ Não |
| UPDATE   | ✅ Todos    | ✅ Apenas permitidos |
| DELETE   | ✅ Sim      | ❌ Não |

### Fluxo de Autenticação

```
1. Frontend chama login(email, password)
   ↓
2. useAuth chama RPC validate_user_credentials
   ↓
3. RPC bypassa RLS usando EXECUTE format()
   ↓
4. RPC valida email/senha diretamente
   ↓
5. RPC retorna user_data com organization_id e environment_id
   ↓
6. Frontend salva sessão em localStorage
   ↓
7. Frontend busca estabelecimentos permitidos
   ↓
8. RLS policies aplicam filtros baseados em estabelecimentos_permitidos
   ↓
9. Usuário vê apenas estabelecimentos permitidos
```

---

## Migrations Aplicadas

### 1. `fix_establishments_rls_v2.sql`
- Remove policies antigas permissivas
- Cria funções `get_user_allowed_establishments()` e `is_admin_all_establishments()`
- Cria policies que respeitam `estabelecimentos_permitidos`
- Atualiza usuário jeferson.costa com UUIDs corretos

### 2. `fix_login_rpc_bypass_rls.sql`
- Recria função `validate_user_credentials` com bypass de RLS
- Usa `EXECUTE format()` para queries diretas
- Adiciona `organization_id` e `environment_id` no retorno
- Garante permissões para `anon` e `authenticated`

### 3. `fix_login_rpc_codigo_alfanumerico.sql`
- **CORREÇÃO CRÍTICA**: Função falhava ao converter códigos alfanuméricos para integer
- Usuários multi-tenant têm códigos como "ADM-CLI1", "ADM-CLI2" (não numéricos)
- Solução: Gera ID numérico a partir do hash do UUID
- Mantém campo `codigo` como string no retorno
- Formula: `('x' || substr(uuid, 1, 8))::bit(32)::int`

---

## Código Atualizado

### useAuth.ts

**Linha 271-273:**
```typescript
// ANTES
allowedEstablishments = dbEstablishments.filter(e =>
  userData.estabelecimentosPermitidos?.includes(e.codigo) // ❌ Comparava código
);

// DEPOIS
allowedEstablishments = dbEstablishments.filter(e =>
  userData.estabelecimentosPermitidos?.includes(e.id) // ✅ Compara UUID
);
```

**Linha 421-443:**
```typescript
// NOVO: Query específica por UUIDs
if (user.estabelecimentosPermitidos && user.estabelecimentosPermitidos.length > 0) {
  const { data: userEstablishments } = await supabase
    .from('establishments')
    .select('*')
    .in('id', user.estabelecimentosPermitidos) // ✅ Filtra por UUIDs
    .order('codigo');

  if (userEstablishments) {
    return userEstablishments.map(est => ({...}));
  }
}
```

---

## Dados de Teste

### Organizações e Environments

| Organization | Environment ID | Estabelecimentos |
|--------------|----------------|------------------|
| Demonstração | `abe69012-4449-4946-977e-46af45790a43` | 0001, 0002 |
| Primeiro Cliente | `07f23b7e-471d-4968-a5fe-fd388e739780` | CLI1-001 |
| Segundo Cliente | `68d4e9f6-2a75-4b30-a660-721de45faedd` | CLI2-001 |

### Credenciais de Teste

```
# Organização Demonstração
jeferson.costa@gruposmartlog.com.br / JE278l2035A#
- Deve ver apenas: 0001 e 0002

# Primeiro Cliente
admin@primeirocliente.com / Demo123!
- Deve ver apenas: CLI1-001

# Segundo Cliente
admin@segundocliente.com / Demo123!
- Deve ver apenas: CLI2-001
```

---

## Checklist de Validação

### Isolamento de Estabelecimentos
- [x] Usuário jeferson.costa vê apenas 0001 e 0002
- [x] Admin total (array vazio) vê todos os estabelecimentos
- [x] RLS bloqueia acesso a estabelecimentos não permitidos
- [x] UPDATE funciona apenas em estabelecimentos permitidos
- [x] INSERT bloqueado para usuários restritos

### Login Multi-Tenant
- [x] Login de admin@primeirocliente.com funciona
- [x] Login de admin@segundocliente.com funciona
- [x] Cada usuário vê apenas estabelecimentos de sua organization
- [x] RLS isola dados entre organizations
- [x] RLS isola dados entre environments

### Código
- [x] useAuth.ts usa UUIDs em vez de códigos
- [x] Função RPC bypassa RLS corretamente
- [x] Queries de estabelecimentos funcionam sem JWT
- [x] Build compila sem erros

---

## Próximos Passos (Opcional)

### Melhorias Futuras
- [ ] Implementar troca de environment no header do usuário
- [ ] Adicionar indicador visual de "environment ativo"
- [ ] Criar auditoria de acessos a estabelecimentos restritos
- [ ] Implementar dashboard de permissões por usuário

### Monitoramento
- [ ] Adicionar logs de tentativas de acesso bloqueadas
- [ ] Monitorar performance das queries com RLS
- [ ] Alertar quando usuário não tem estabelecimentos permitidos

---

## Contatos e Suporte

**Documentação atualizada em**: 2026-01-20
**Versão**: 2.1 (com correções de isolamento)
**Responsável**: Arquiteto de Software Sênior

---

## Apêndice: Queries Úteis

### Verificar Estabelecimentos de um Usuário
```sql
SELECT
  u.email,
  u.estabelecimentos_permitidos,
  array_agg(e.codigo ORDER BY e.codigo) as codigos_permitidos
FROM users u
LEFT JOIN establishments e ON e.id = ANY(u.estabelecimentos_permitidos)
WHERE u.email = 'jeferson.costa@gruposmartlog.com.br'
GROUP BY u.email, u.estabelecimentos_permitidos;
```

### Listar Todos os Usuários com Permissões
```sql
SELECT
  u.email,
  u.perfil,
  o.name as organization,
  env.name as environment,
  CASE
    WHEN array_length(u.estabelecimentos_permitidos, 1) IS NULL THEN 'Admin Total'
    ELSE array_length(u.estabelecimentos_permitidos, 1)::text || ' estabelecimentos'
  END as nivel_acesso
FROM users u
JOIN organizations o ON o.id = u.organization_id
JOIN environments env ON env.id = u.environment_id
ORDER BY o.name, u.email;
```

### Testar RLS Policy
```sql
-- Executar como superuser
SET ROLE postgres;

-- Simular usuário específico
SET LOCAL jwt.claims.email = 'user@example.com';
SET LOCAL jwt.claims.app_metadata = '{"organization_id": "uuid", "environment_id": "uuid"}';

-- Testar query
SELECT * FROM establishments;

-- Voltar ao normal
RESET ROLE;
```

---

**FIM DA DOCUMENTAÇÃO**
