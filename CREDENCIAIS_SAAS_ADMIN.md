# Credenciais do SaaS Admin Console

## Acesso ao Painel Administrativo

### URL de Acesso
```
/SaasAdminConsole
```

### Credenciais Corretas

**Email:** `admin@demo.com`
**Senha:** `admin123`

## Verificação do Hash

A senha é armazenada como hash SHA-256 no banco de dados:

```sql
SELECT email, senha_hash
FROM saas_admins
WHERE email = 'admin@demo.com';
```

Resultado esperado:
- **Email:** admin@demo.com
- **Hash SHA-256:** 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9

## Teste Direto da Função RPC

Para verificar se a função de login está funcionando:

```sql
SELECT public.saas_admin_login(
  'admin@demo.com',
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'
);
```

Resultado esperado:
```json
{
  "success": true,
  "admin_id": "c003f2bf-6606-44be-8c25-f5150e5fab86",
  "email": "admin@demo.com",
  "name": "Admin Demo",
  "is_saas_admin": true
}
```

## Troubleshooting

### Problema: "Senha incorreta"

**Verifique os logs no console do navegador:**

1. Abra o DevTools (F12)
2. Vá para a aba "Console"
3. Tente fazer login novamente
4. Procure por:
   - `Login attempt:` - mostra o email e hash gerado
   - `Login result:` - mostra a resposta da função RPC
   - Mensagens de erro detalhadas

### Verificações importantes:

**1. Email correto:**
```
✅ admin@demo.com
❌ admin@saas.local (este NÃO está no banco)
```

**2. Senha correta:**
```
✅ admin123
```

**3. Hash SHA-256 gerado:**
O hash deve ser exatamente:
```
240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
```

**4. Conta ativa:**
```sql
SELECT email, ativo
FROM saas_admins
WHERE email = 'admin@demo.com';
```
O campo `ativo` deve ser `true`.

## Fluxo de Login

1. Usuário digita email e senha
2. Frontend gera hash SHA-256 da senha
3. Chama `tenantAuthService.loginSaasAdmin(email, passwordHash)`
4. Service chama RPC `saas_admin_login`
5. Função valida:
   - Se o admin existe
   - Se está ativo
   - Se o hash confere
6. Retorna sucesso ou erro

## Logs de Debug Adicionados

O componente `SaasAdminLogin` agora possui logs detalhados:

```javascript
console.log('Login attempt:', { email, passwordHash });
console.log('Login result:', result);
```

Isso permite ver exatamente:
- Qual email está sendo usado
- Qual hash está sendo gerado
- Qual resposta está vindo do backend

## Como Criar Novos Admins

```sql
-- Gerar hash SHA-256 da senha
-- Exemplo: senha "novasenha123"
-- Hash: (usar ferramenta online ou comando shell)

INSERT INTO saas_admins (
  email,
  nome,
  senha_hash,
  ativo
) VALUES (
  'novo@admin.com',
  'Novo Admin',
  'hash_sha256_da_senha',
  true
);
```

### Gerando hash via shell:
```bash
echo -n "suasenha" | sha256sum | awk '{print $1}'
```

### Gerando hash via JavaScript (console do navegador):
```javascript
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Usar:
await hashPassword('suasenha');
```

## Estrutura da Tabela saas_admins

```sql
CREATE TABLE saas_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  senha_hash TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Permissões RLS

A tabela `saas_admins` possui RLS habilitado, mas a função `saas_admin_login` usa `SECURITY DEFINER`, permitindo que usuários anônimos (não autenticados) possam chamar a função de login.

Após o login bem-sucedido, o sistema armazena os dados do admin no localStorage:
```javascript
localStorage.setItem('saas_admin_session', JSON.stringify({
  admin_id: result.admin_id,
  email: result.email,
  name: result.name,
  is_saas_admin: true
}));
```

## Importante

1. **Nunca exponha senhas em texto puro** - sempre use hash SHA-256
2. **Mantenha as credenciais seguras** - não compartilhe em repositórios públicos
3. **Use HTTPS em produção** - nunca envie credenciais via HTTP
4. **Implemente rate limiting** - previna ataques de força bruta
5. **Monitore tentativas de login** - registre falhas e sucessos

## Próximos Passos de Segurança

1. Adicionar rate limiting nas tentativas de login
2. Implementar 2FA (autenticação de dois fatores)
3. Adicionar logs de auditoria de todas as ações no admin console
4. Implementar rotação periódica de senhas
5. Adicionar alertas de login suspeito
