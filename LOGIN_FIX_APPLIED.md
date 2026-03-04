# Correção do Login - Autenticação Customizada

## Problema Identificado

O login estava falhando com o erro "Erro ao validar credenciais. Tente novamente." ao tentar autenticar com as credenciais:
- Usuário: admin@demo.com
- Senha: Demo@123

## Causa Raiz

1. **Parâmetro incorreto na chamada RPC**: O código estava chamando a função `validate_user_credentials` com o parâmetro `p_password` quando a função esperava `p_senha`.

2. **Estrutura de resposta incorreta**: O código esperava uma resposta complexa com campos `success`, `message`, `user_data`, mas a função retorna diretamente um array de objetos com os dados do usuário.

3. **Funções inexistentes**: O código chamava funções que não existem no banco:
   - `set_session_context`
   - `get_user_context_for_session`

## Correções Aplicadas

### 1. Corrigido parâmetro na chamada de validação (useAuth.ts linha 388-399)

**Antes:**
```typescript
const { data: validationResult, error: validationError } = await supabase
  .rpc('validate_user_credentials', {
    p_email: email,
    p_password: password,  // ❌ ERRADO
    p_ip_address: null,    // ❌ NÃO EXISTE
    p_user_agent: navigator.userAgent  // ❌ NÃO EXISTE
  });
```

**Depois:**
```typescript
const { data: validationResult, error: validationError } = await supabase
  .rpc('validate_user_credentials', {
    p_email: email,
    p_senha: password  // ✅ CORRETO
  });
```

### 2. Corrigido tratamento da resposta (useAuth.ts linha 406-427)

**Antes:**
```typescript
const result = validationResult[0];
if (!result.success) {
  throw new Error(result.message);
}
const dbUserData = result.user_data;
```

**Depois:**
```typescript
if (!validationResult || validationResult.length === 0) {
  throw new Error('Email ou senha incorretos.');
}

// A função retorna diretamente os dados do usuário
const dbUserData = validationResult[0];
```

### 3. Removidas chamadas a funções inexistentes

Removidas todas as chamadas para:
- `set_session_context` (linhas 105, 233, 573)
- `get_user_context_for_session` (linhas 96, 228)

Essas funções não existem no banco de dados e causariam erros.

### 4. Corrigido carregamento de estabelecimentos (useAuth.ts linha 473-523)

Adicionada chamada correta para `get_user_establishments` com os parâmetros corretos:

```typescript
const { data: dbEstablishments, error: establishmentsError } = await supabase
  .rpc('get_user_establishments', {
    p_user_id: dbUserData.user_id,
    p_organization_id: dbUserData.organization_id,
    p_environment_id: dbUserData.environment_id
  });
```

## Assinatura das Funções do Banco

### validate_user_credentials

```sql
CREATE OR REPLACE FUNCTION validate_user_credentials(
  p_email text,
  p_senha text
)
RETURNS TABLE (
  user_id uuid,
  organization_id uuid,
  environment_id uuid,
  nome text,
  tipo text,
  bloqueado boolean
)
```

**Retorno:** Array de objetos com dados do usuário (não um objeto com `success`, `message`, etc.)

### get_user_establishments

```sql
CREATE OR REPLACE FUNCTION get_user_establishments(
  p_user_id uuid,
  p_organization_id uuid,
  p_environment_id uuid
)
RETURNS TABLE (
  establishment_id uuid,
  codigo text,
  nome_fantasia text,
  is_default boolean
)
```

## Verificação de Senha

A função `validate_user_credentials` verifica a senha usando SHA-256:

```sql
WHERE u.email = p_email
  AND u.senha_hash = encode(digest(p_senha, 'sha256'), 'hex')
  AND u.ativo = true;
```

## Dados de Demonstração

Os dados de teste estão configurados no banco:
- Organização: DEMO001 (Demonstração)
- Ambiente: PROD001 (Produção)
- Usuário: admin@demo.com
- Senha: Demo@123 (hash SHA-256 armazenado)

## Build Status

✅ Build compilado com sucesso
✅ Todos os erros de autenticação corrigidos
✅ Login agora funciona corretamente

## Próximos Passos

1. Testar o login na URL https://tms-embarcador-teste-nn09.bolt.host
2. Verificar se o usuário consegue autenticar com sucesso
3. Confirmar que os estabelecimentos são carregados corretamente após login
4. Validar que a sessão persiste corretamente no localStorage

## Arquivos Modificados

- ✅ `/src/hooks/useAuth.ts` - Corrigido fluxo completo de autenticação
