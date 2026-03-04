# Credenciais de Acesso - TMS Embarcador

## Dados de Acesso - Demonstração

### Organização Demo
- **Código:** `DEMO001`
- **Nome:** Empresa Demonstração
- **CNPJ:** 00.000.000/0001-00
- **Status:** Ativo

### Ambiente Produção
- **Código:** `PROD`
- **Nome:** Produção
- **Tipo:** producao
- **Status:** Ativo

### Usuário Administrador
- **Email:** `admin@demo.com`
- **Senha:** `Demo@123`
- **Tipo:** admin
- **Status:** Ativo

### Estabelecimento Padrão
- **Código:** `0001`
- **Nome Fantasia:** Matriz Demonstração
- **Razão Social:** Empresa Demonstração LTDA
- **CNPJ:** 00.000.000/0001-00
- **Tipo:** Matriz
- **Status:** Ativo

---

## Como Fazer Login

### 1. Via Função SQL

```sql
-- Validar credenciais
SELECT * FROM validate_user_credentials('admin@demo.com', 'Demo@123');

-- Retorno esperado:
-- user_id | organization_id | environment_id | nome | tipo | bloqueado
-- --------|-----------------|----------------|------|------|----------
-- <uuid>  | <uuid>          | <uuid>         | Administrador Demo | admin | false
```

### 2. Via Aplicação TypeScript

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const supabase = createClient<Database>(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function login(email: string, senha: string) {
  // 1. Verificar se está bloqueado
  const { data: bloqueado } = await supabase.rpc('check_user_blocked', {
    p_email: email
  });

  if (bloqueado) {
    throw new Error('Usuário bloqueado. Entre em contato com o administrador.');
  }

  // 2. Validar credenciais
  const { data: usuarios, error } = await supabase.rpc('validate_user_credentials', {
    p_email: email,
    p_senha: senha
  });

  if (error || !usuarios || usuarios.length === 0) {
    // Incrementar tentativas falhas
    await supabase.rpc('increment_login_attempts', {
      p_email: email
    });
    throw new Error('Email ou senha inválidos');
  }

  const usuario = usuarios[0];

  // 3. Resetar tentativas e atualizar último login
  await supabase.rpc('reset_login_attempts', {
    p_email: email,
    p_ip: '192.168.1.1' // IP do cliente
  });

  // 4. Buscar organizações e ambientes
  const { data: orgsEnvs } = await supabase.rpc('get_user_organizations_environments', {
    p_email: email
  });

  // 5. Buscar estabelecimentos
  const { data: estabelecimentos } = await supabase.rpc('get_user_establishments', {
    p_user_id: usuario.user_id,
    p_organization_id: usuario.organization_id,
    p_environment_id: usuario.environment_id
  });

  return {
    usuario,
    organizacoes: orgsEnvs,
    estabelecimentos
  };
}

// Usar
const resultado = await login('admin@demo.com', 'Demo@123');
console.log('Login bem-sucedido!', resultado);
```

### 3. Fluxo Completo de Login

```typescript
interface LoginResponse {
  success: boolean;
  user?: {
    id: string;
    nome: string;
    email: string;
    tipo: string;
  };
  organization?: {
    id: string;
    codigo: string;
    nome: string;
  };
  environment?: {
    id: string;
    codigo: string;
    nome: string;
  };
  establishments?: Array<{
    id: string;
    codigo: string;
    nome_fantasia: string;
    is_default: boolean;
  }>;
  error?: string;
}

async function loginCompleto(
  email: string,
  senha: string
): Promise<LoginResponse> {
  try {
    // 1. Verificar bloqueio
    const { data: bloqueado } = await supabase.rpc('check_user_blocked', {
      p_email: email
    });

    if (bloqueado) {
      return {
        success: false,
        error: 'Usuário bloqueado. Entre em contato com o administrador.'
      };
    }

    // 2. Validar credenciais
    const { data: usuarios, error } = await supabase.rpc('validate_user_credentials', {
      p_email: email,
      p_senha: senha
    });

    if (error || !usuarios || usuarios.length === 0) {
      // Incrementar tentativas
      await supabase.rpc('increment_login_attempts', { p_email: email });

      return {
        success: false,
        error: 'Email ou senha inválidos'
      };
    }

    const usuario = usuarios[0];

    // 3. Resetar tentativas
    await supabase.rpc('reset_login_attempts', {
      p_email: email,
      p_ip: window.location.hostname
    });

    // 4. Buscar organização
    const { data: org } = await supabase
      .from('saas_organizations')
      .select('id, codigo, nome')
      .eq('id', usuario.organization_id)
      .single();

    // 5. Buscar ambiente
    const { data: env } = await supabase
      .from('saas_environments')
      .select('id, codigo, nome')
      .eq('id', usuario.environment_id)
      .single();

    // 6. Buscar estabelecimentos
    const { data: estabelecimentos } = await supabase.rpc('get_user_establishments', {
      p_user_id: usuario.user_id,
      p_organization_id: usuario.organization_id,
      p_environment_id: usuario.environment_id
    });

    return {
      success: true,
      user: {
        id: usuario.user_id,
        nome: usuario.nome,
        email: email,
        tipo: usuario.tipo
      },
      organization: org || undefined,
      environment: env || undefined,
      establishments: estabelecimentos || []
    };

  } catch (error) {
    console.error('Erro no login:', error);
    return {
      success: false,
      error: 'Erro ao fazer login. Tente novamente.'
    };
  }
}

// Exemplo de uso
const resultado = await loginCompleto('admin@demo.com', 'Demo@123');

if (resultado.success) {
  console.log('Usuário:', resultado.user);
  console.log('Organização:', resultado.organization);
  console.log('Ambiente:', resultado.environment);
  console.log('Estabelecimentos:', resultado.establishments);

  // Salvar no localStorage ou context
  localStorage.setItem('user', JSON.stringify(resultado.user));
  localStorage.setItem('organization', JSON.stringify(resultado.organization));
  localStorage.setItem('environment', JSON.stringify(resultado.environment));
} else {
  console.error('Erro:', resultado.error);
}
```

---

## Criando Novos Usuários

### Via SQL

```sql
-- 1. Inserir usuário
INSERT INTO users (
  organization_id,
  environment_id,
  email,
  senha_hash,
  nome,
  tipo,
  ativo
) VALUES (
  (SELECT id FROM saas_organizations WHERE codigo = 'DEMO001'),
  (SELECT id FROM saas_environments WHERE codigo = 'PROD'
   AND organization_id = (SELECT id FROM saas_organizations WHERE codigo = 'DEMO001')),
  'usuario@demo.com',
  encode(digest('Senha@123', 'sha256'), 'hex'),
  'Novo Usuário',
  'user',
  true
);

-- 2. Associar ao estabelecimento
INSERT INTO user_establishments (user_id, establishment_id, is_default)
SELECT
  (SELECT id FROM users WHERE email = 'usuario@demo.com'),
  (SELECT id FROM establishments WHERE codigo = '0001'
   AND organization_id = (SELECT id FROM saas_organizations WHERE codigo = 'DEMO001')),
  true;
```

### Via TypeScript

```typescript
async function criarUsuario(
  email: string,
  senha: string,
  nome: string,
  tipo: 'admin' | 'user' | 'viewer',
  organizationId: string,
  environmentId: string,
  establishmentId: string
) {
  // 1. Hash da senha (SHA-256)
  const encoder = new TextEncoder();
  const data = encoder.encode(senha);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const senha_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // 2. Inserir usuário
  const { data: usuario, error: errorUsuario } = await supabase
    .from('users')
    .insert({
      organization_id: organizationId,
      environment_id: environmentId,
      email,
      senha_hash,
      nome,
      tipo,
      ativo: true
    })
    .select()
    .single();

  if (errorUsuario) {
    throw new Error(`Erro ao criar usuário: ${errorUsuario.message}`);
  }

  // 3. Associar ao estabelecimento
  const { error: errorEstabelecimento } = await supabase
    .from('user_establishments')
    .insert({
      user_id: usuario.id,
      establishment_id: establishmentId,
      is_default: true
    });

  if (errorEstabelecimento) {
    throw new Error(`Erro ao associar estabelecimento: ${errorEstabelecimento.message}`);
  }

  return usuario;
}

// Exemplo de uso
const novoUsuario = await criarUsuario(
  'operador@demo.com',
  'Senha@123',
  'João Operador',
  'user',
  '<organization_id>',
  '<environment_id>',
  '<establishment_id>'
);
```

---

## Criando Nova Organização

### Via SQL

```sql
-- 1. Criar organização
INSERT INTO saas_organizations (codigo, nome, cnpj, status, plan_id)
VALUES (
  'ORG001',
  'Minha Empresa',
  '12.345.678/0001-00',
  'ativo',
  (SELECT id FROM saas_plans WHERE nome = 'Demonstração')
);

-- 2. Criar ambiente produção
INSERT INTO saas_environments (organization_id, codigo, nome, tipo, status)
VALUES (
  (SELECT id FROM saas_organizations WHERE codigo = 'ORG001'),
  'PROD',
  'Produção',
  'producao',
  'ativo'
);

-- 3. Criar estabelecimento 0001
INSERT INTO establishments (
  organization_id,
  environment_id,
  codigo,
  nome_fantasia,
  razao_social,
  cnpj,
  tipo,
  ativo
) VALUES (
  (SELECT id FROM saas_organizations WHERE codigo = 'ORG001'),
  (SELECT id FROM saas_environments WHERE codigo = 'PROD'
   AND organization_id = (SELECT id FROM saas_organizations WHERE codigo = 'ORG001')),
  '0001',
  'Matriz',
  'Minha Empresa LTDA',
  '12.345.678/0001-00',
  'matriz',
  true
);

-- 4. Criar usuário admin
INSERT INTO users (
  organization_id,
  environment_id,
  email,
  senha_hash,
  nome,
  tipo,
  ativo
) VALUES (
  (SELECT id FROM saas_organizations WHERE codigo = 'ORG001'),
  (SELECT id FROM saas_environments WHERE codigo = 'PROD'
   AND organization_id = (SELECT id FROM saas_organizations WHERE codigo = 'ORG001')),
  'admin@minhaempresa.com',
  encode(digest('Admin@123', 'sha256'), 'hex'),
  'Administrador',
  'admin',
  true
);

-- 5. Associar usuário ao estabelecimento
INSERT INTO user_establishments (user_id, establishment_id, is_default)
SELECT
  (SELECT id FROM users WHERE email = 'admin@minhaempresa.com'),
  (SELECT id FROM establishments WHERE codigo = '0001'
   AND organization_id = (SELECT id FROM saas_organizations WHERE codigo = 'ORG001')),
  true;
```

---

## Segurança

### Criptografia de Senha

As senhas são criptografadas usando **SHA-256**:

```typescript
// Cliente TypeScript
const encoder = new TextEncoder();
const data = encoder.encode(senha);
const hashBuffer = await crypto.subtle.digest('SHA-256', data);
const hashArray = Array.from(new Uint8Array(hashBuffer));
const senha_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
```

```sql
-- Servidor PostgreSQL
encode(digest('senha', 'sha256'), 'hex')
```

### Bloqueio de Conta

- Após **5 tentativas falhas**, a conta é bloqueada automaticamente
- Para desbloquear, atualizar manualmente:

```sql
UPDATE users
SET bloqueado = false, tentativas_login = 0
WHERE email = 'usuario@example.com';
```

### Alteração de Senha

```sql
UPDATE users
SET senha_hash = encode(digest('NovaSenha@123', 'sha256'), 'hex'),
    updated_at = now()
WHERE email = 'usuario@example.com';
```

---

## Variáveis de Ambiente

Crie um arquivo `.env.local` com:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

---

## Troubleshooting

### Erro: "Usuário bloqueado"
**Solução:** Desbloquear via SQL:
```sql
UPDATE users SET bloqueado = false, tentativas_login = 0
WHERE email = 'usuario@example.com';
```

### Erro: "Email ou senha inválidos"
**Possíveis causas:**
1. Email ou senha incorretos
2. Usuário inativo (`ativo = false`)
3. Senha não criptografada corretamente

**Verificar:**
```sql
SELECT email, ativo, bloqueado, tentativas_login
FROM users
WHERE email = 'usuario@example.com';
```

### Erro: "RLS policy violation"
**Causa:** Políticas RLS bloqueando acesso
**Solução:** Verificar se o contexto de sessão está configurado corretamente

---

## Próximos Passos

1. Fazer login com `admin@demo.com` / `Demo@123`
2. Explorar o sistema
3. Criar novos usuários, transportadoras, clientes
4. Cadastrar tabelas de frete
5. Criar pedidos e agendar coletas

---

**IMPORTANTE:**
- Altere a senha padrão em produção
- Configure as variáveis de ambiente corretamente
- Mantenha as chaves de API seguras
- Faça backups regulares do banco de dados

---

**Data:** 2026-02-20
**Versão:** 1.0.0
