# Sistema de Bloqueio de Login - Documentação Completa

## 📋 Visão Geral

Sistema de segurança que protege contra ataques de força bruta bloqueando usuários após múltiplas tentativas falhadas de login.

## 🔢 Comportamento do Contador de Tentativas

### Cenário 1: Tentativas Normais
```
Tentativa 1 (senha errada) → "Credenciais inválidas. Tentativa 1 de 3."
Tentativa 2 (senha errada) → "Credenciais inválidas. Tentativa 2 de 3."
Tentativa 3 (senha errada) → "Usuário bloqueado após 3 tentativas falhadas. Contate o administrador."
```

**Resultado**: Usuário BLOQUEADO ❌

### Cenário 2: Login Bem-Sucedido Durante as Tentativas
```
Tentativa 1 (senha errada) → "Credenciais inválidas. Tentativa 1 de 3."
Tentativa 2 (senha correta) → ✅ Login realizado com sucesso
```

**Resultado**: 
- ✅ Login permitido
- 🔄 Contador resetado para 0
- 🔓 Todas tentativas falhadas são deletadas
- 📊 Próximo login começa do 1 novamente

### Cenário 3: Admin Desbloqueia Usuário
```
Estado: Usuário BLOQUEADO após 3 tentativas
Admin: Clica em "Desbloquear" → ✅ Desbloqueado
```

**Resultado**:
- 🔓 Usuário desbloqueado
- 🔄 **TODAS as tentativas são deletadas do banco**
- ✨ Contador volta para 0 (zero)
- 📊 Próximo login começa do 1 de 3
- 📝 Log registrado: "Desbloqueado por admin: [email_admin]"

### Cenário 4: Bloqueio Expira Automaticamente
```
Estado: Usuário bloqueado há 7+ dias
Sistema: Executa cleanup automático → ✅ Desbloqueado
```

**Resultado**:
- 🔓 Usuário desbloqueado automaticamente
- 📊 Tentativas antigas são mantidas (para auditoria)
- ✨ Próximo login começa do 1 de 3

## 🔧 Funções SQL e Comportamento

### 1. `record_failed_login(email, ip, user_agent, reason)`
**Quando**: A cada tentativa falhada de login

**O que faz**:
```sql
1. Insere registro na tabela login_attempts (success = false)
2. Conta tentativas falhadas na última 1 hora
3. Se >= 3 tentativas:
   - Atualiza users.is_blocked = true
   - Define users.blocked_reason
   - Define users.blocked_at = agora
```

**Retorna**:
- `should_block`: true/false
- `failed_attempts`: número atual
- `message`: mensagem personalizada

### 2. `reset_login_attempts(email)`
**Quando**: Login bem-sucedido

**O que faz**:
```sql
1. DELETA todas tentativas falhadas (success = false)
2. Insere registro de sucesso
3. Se usuário está bloqueado:
   - users.is_blocked = false
   - users.blocked_at = NULL
   - users.blocked_reason = NULL
4. Limpa tentativas bem-sucedidas > 30 dias
```

**Resultado**: Contador volta a 0 ✅

### 3. `unlock_user(email, admin_email)`
**Quando**: Admin desbloqueia manualmente

**O que faz**:
```sql
1. Valida se quem desbloqueia é administrador
2. Atualiza users:
   - is_blocked = false
   - blocked_at = NULL
   - blocked_reason = NULL
3. DELETA TODAS as tentativas (success = true E false)
4. Insere log: "Desbloqueado por admin: [email]"
5. Conta quantas tentativas foram deletadas
```

**Retorna**:
```
"Usuário desbloqueado com sucesso. X tentativas foram resetadas."
```

**Resultado**: Contador volta a 0 ✅

### 4. `check_login_block(email)`
**Quando**: Antes de qualquer tentativa de login

**O que faz**:
```sql
1. Busca status na tabela users
2. Conta tentativas falhadas nas últimas 24h
```

**Retorna**:
- `is_blocked`: true/false
- `blocked_reason`: motivo do bloqueio
- `blocked_at`: timestamp do bloqueio
- `failed_attempts`: contador atual

## 📊 Tabelas do Banco de Dados

### `login_attempts`
```sql
id                  uuid
user_email          text (índice)
ip_address          text
user_agent          text
attempt_timestamp   timestamptz (índice)
success             boolean
failure_reason      text
created_at          timestamptz
```

### Colunas em `users`
```sql
is_blocked          boolean (default: false)
blocked_at          timestamptz
blocked_reason      text
```

## 🔍 Queries Úteis

### Ver tentativas de um usuário
```sql
SELECT 
  user_email,
  success,
  failure_reason,
  attempt_timestamp
FROM login_attempts
WHERE user_email = 'maria.silva@tmsgestor.com'
ORDER BY attempt_timestamp DESC
LIMIT 10;
```

### Ver usuários bloqueados
```sql
SELECT 
  email,
  nome,
  is_blocked,
  blocked_at,
  blocked_reason
FROM users
WHERE is_blocked = true
ORDER BY blocked_at DESC;
```

### Contar tentativas falhadas por usuário (últimas 24h)
```sql
SELECT 
  user_email,
  COUNT(*) as tentativas_falhadas,
  MAX(attempt_timestamp) as ultima_tentativa
FROM login_attempts
WHERE success = false
  AND attempt_timestamp > NOW() - INTERVAL '24 hours'
GROUP BY user_email
ORDER BY tentativas_falhadas DESC;
```

## 🎯 Fluxograma Completo

```
┌─────────────────────────┐
│ Usuário tenta fazer login│
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ check_login_block()     │
│ Verifica se bloqueado   │
└───────────┬─────────────┘
            │
     ┌──────┴──────┐
     │ Bloqueado?  │
     └──────┬──────┘
            │
    ┌───────┴────────┐
    │ SIM            │ NÃO
    │                │
    ▼                ▼
┌────────────┐  ┌─────────────────┐
│ Retorna    │  │ Tenta autenticar│
│ erro       │  │ no Supabase Auth│
└────────────┘  └────────┬────────┘
                         │
                  ┌──────┴─────┐
                  │ Sucesso?   │
                  └──────┬─────┘
                         │
                 ┌───────┴────────┐
                 │ SIM            │ NÃO
                 │                │
                 ▼                ▼
        ┌────────────────┐  ┌──────────────────────┐
        │ reset_login_   │  │ record_failed_login()│
        │ attempts()     │  │ Registra falha       │
        │ • Deleta todas │  │ • Conta tentativas   │
        │   tentativas   │  │ • Bloqueia se >= 3   │
        │   falhadas     │  └──────────┬───────────┘
        │ • Contador→ 0  │             │
        └────────────────┘      ┌──────┴──────┐
                                │ Tentativa X │
                                │ de 3        │
                                └─────────────┘

┌──────────────────────────┐
│ Admin desbloqueia        │
│ unlock_user()            │
│ • Desbloqueia usuário    │
│ • DELETA TODAS tentativas│
│ • Contador → 0           │
│ • Insere log de admin    │
└──────────────────────────┘
```

## ✅ Resumo do Comportamento

| Ação | Contador Antes | Contador Depois | Tentativas Deletadas |
|------|----------------|-----------------|---------------------|
| Login falhado (1ª vez) | 0 | 1 | ❌ Não |
| Login falhado (2ª vez) | 1 | 2 | ❌ Não |
| Login falhado (3ª vez) | 2 | 3 + BLOQUEIO | ❌ Não |
| Login bem-sucedido | 2 | 0 | ✅ Sim (apenas falhadas) |
| Admin desbloqueia | 3 (bloqueado) | 0 | ✅ Sim (TODAS) |
| Expiração automática (7d) | 3+ | 0 | ❌ Não (mantém histórico) |

## 🔒 Segurança

- ✅ RLS habilitado em todas as tabelas
- ✅ Funções com `SECURITY DEFINER`
- ✅ Validação de permissões (apenas admin desbloqueia)
- ✅ Logs de auditoria completos
- ✅ IP e User-Agent registrados
- ✅ Cleanup automático de dados antigos

## 📝 Notas Importantes

1. **Reset após desbloqueio**: Quando admin desbloqueia, o usuário volta ao estado inicial (0 tentativas)
2. **Reset após sucesso**: Login bem-sucedido sempre limpa tentativas falhadas
3. **Janela de tempo**: 3 tentativas em 1 hora para bloqueio
4. **Auditoria**: Últimas 24h de tentativas são consultadas para análise
5. **Limpeza**: Logs > 90 dias são deletados automaticamente
6. **Expiração**: Bloqueios > 7 dias expiram automaticamente

