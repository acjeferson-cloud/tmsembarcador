# Debug do Fluxo de Login Multi-Environment

## Correções Aplicadas

### 1. Service de Autenticação Corrigido
- ❌ **Antes:** Funções lançavam exceções (throw)
- ✅ **Agora:** Retornam objetos com `success: false` e mensagem de erro
- **Arquivo:** `src/services/authWithEnvironmentService.ts`

### 2. Logs de Debug Adicionados
- Console logs em todas as etapas do fluxo
- Facilita identificar onde o processo está falhando
- **Arquivo:** `src/components/Auth/LoginWithEnvironmentFlow.tsx`

## Como Testar com Logs de Debug

### 1. Abrir Developer Tools (F12)
Vá para a aba "Console"

### 2. Fazer Login
**Email:** jeferson.costa@logaxis.com.br
**Senha:** JE278l2035A#

### 3. Verificar Logs no Console

Você deve ver esta sequência:

```
[LoginWithEnvironmentFlow] Current step: login
[LoginWithEnvironmentFlow] Validating credentials for: jeferson.costa@logaxis.com.br
[LoginWithEnvironmentFlow] Validation result: { success: true, user_id: "...", email: "...", name: "..." }
[LoginWithEnvironmentFlow] Credentials valid, switching to environment selection
[LoginWithEnvironmentFlow] Current step: select-environment
```

### 4. O Que Verificar

#### Se NÃO aparecer a tela de seleção:

**Cenário A: Erro na validação**
```
[LoginWithEnvironmentFlow] Validation failed: [mensagem de erro]
```
- Verificar se a função RPC `validate_user_credentials_only` está funcionando
- Verificar se o hash da senha está correto

**Cenário B: Credenciais validadas mas não muda de step**
```
[LoginWithEnvironmentFlow] Credentials valid, switching to environment selection
[LoginWithEnvironmentFlow] Current step: login  ← AINDA ESTÁ EM LOGIN!
```
- Problema com o setState do React
- Verificar se há algum erro no React DevTools

**Cenário C: Nenhum log aparece**
```
(vazio - nenhum log)
```
- O componente LoginWithEnvironmentFlow não está sendo renderizado
- Verificar App.tsx

## Teste Manual da Função RPC

Execute no Supabase SQL Editor:

```sql
-- Validar credenciais
SELECT validate_user_credentials_only('jeferson.costa@logaxis.com.br', 'JE278l2035A#');
```

**Resultado esperado:**
```json
{
  "success": true,
  "user_id": "e494b5f1-ad08-4c50-8558-03be820a3743",
  "email": "jeferson.costa@logaxis.com.br",
  "name": "Jeferson Costa"
}
```

```sql
-- Listar environments disponíveis
SELECT * FROM get_user_available_environments('jeferson.costa@logaxis.com.br');
```

**Resultado esperado:** 5 linhas (1 Produção + 4 Testes)

## Arquivos Modificados

### 1. authWithEnvironmentService.ts
```typescript
// Antes
if (error) {
  throw new Error('Erro ao validar credenciais');
}

// Depois
if (error) {
  return {
    success: false,
    error: 'Erro ao validar credenciais'
  };
}
```

### 2. LoginWithEnvironmentFlow.tsx
- Adicionados console.logs em todas as etapas
- Try-catch mantidos para re-lançar erros para o componente Login
- Logs ajudam a identificar onde o fluxo está parando

## Possíveis Causas do Problema

### 1. Autenticação Anônima no Supabase
Se o Supabase não está permitindo chamadas RPC com usuário anônimo:

**Solução:**
```sql
-- Verificar políticas RLS das funções
SELECT * FROM pg_proc
WHERE proname IN ('validate_user_credentials_only', 'tms_login_with_environment');

-- Garantir que funções RPC permitem acesso anônimo
ALTER FUNCTION validate_user_credentials_only(text, text) SECURITY DEFINER;
ALTER FUNCTION tms_login_with_environment(text, uuid) SECURITY DEFINER;
```

### 2. CORS ou Configuração Supabase
Verificar se as credenciais do Supabase estão corretas:

**Arquivo:** `.env`
```
VITE_SUPABASE_URL=https://[seu-projeto].supabase.co
VITE_SUPABASE_ANON_KEY=[sua-chave-anon]
```

### 3. Cache do Navegador
Limpar cache e recarregar:
- Chrome/Edge: Ctrl + Shift + Delete
- Ou usar modo anônimo (Ctrl + Shift + N)

## Próximos Passos se Problema Persistir

### Verificação 1: Testar função diretamente
```typescript
// No console do navegador (após abrir a aplicação)
const { data, error } = await supabase.rpc('validate_user_credentials_only', {
  p_email: 'jeferson.costa@logaxis.com.br',
  p_password: 'JE278l2035A#'
});
console.log('Result:', data, 'Error:', error);
```

### Verificação 2: Verificar se o componente está montado
```typescript
// Adicionar no componente LoginWithEnvironmentFlow
useEffect(() => {
  console.log('LoginWithEnvironmentFlow mounted!');
  return () => console.log('LoginWithEnvironmentFlow unmounted!');
}, []);
```

### Verificação 3: Verificar imports do Supabase
```typescript
// src/lib/supabase.ts
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase client initialized:', !!supabase);
```

## Status Atual

✅ Migration aplicada (email único por environment)
✅ Usuário criado em 5 environments
✅ Funções RPC criadas e testadas manualmente
✅ Service de autenticação corrigido (sem throws)
✅ Logs de debug adicionados
✅ Build executado com sucesso
⏳ Aguardando teste no navegador com logs

## Comando para Ver Logs em Tempo Real

Após abrir a aplicação no navegador:

1. Pressione F12
2. Vá para aba Console
3. Digite: `localStorage.clear()` (para limpar dados antigos)
4. Recarregue a página (F5)
5. Faça login e observe os logs

Os logs vão mostrar exatamente onde o fluxo está parando!
