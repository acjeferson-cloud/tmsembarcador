# Credenciais do SaaS Admin Console

## Acesso ao SaaS Admin Console

### URL de Acesso
Para acessar o SaaS Admin Console, adicione `/saas-admin` à URL da aplicação:
```
https://seu-dominio.com/saas-admin
```

### Credenciais Padrão

**Email:** `admin@gruposmartlog.com.br`
**Senha:** `admin123`

## Estrutura do Banco de Dados

### Tabela: saas_admins

A tabela `saas_admins` foi criada com a seguinte estrutura:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | Identificador único do admin |
| email | text | Email do admin (único) |
| name | text | Nome do admin |
| password_hash | text | Hash SHA-256 da senha |
| role | text | Papel do admin (super_admin, admin) |
| is_active | boolean | Se o admin está ativo |
| last_login_at | timestamptz | Data/hora do último login |
| created_at | timestamptz | Data/hora de criação |
| updated_at | timestamptz | Data/hora da última atualização |

### Segurança

1. **Senhas:** São armazenadas como hash SHA-256. NUNCA armazene senhas em texto plano.
2. **RLS:** Row Level Security está habilitado na tabela.
3. **Policies:** Apenas admins autenticados (is_saas_admin=true) podem acessar a tabela.

## Como Criar Novos Admins

### Via SQL

```sql
-- Gerar hash SHA-256 da senha no browser:
-- const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('sua_senha')))).map(b => b.toString(16).padStart(2, '0')).join('');

INSERT INTO saas_admins (email, name, password_hash, role, is_active)
VALUES (
  'novo.admin@email.com',
  'Nome do Admin',
  'HASH_SHA256_DA_SENHA',
  'admin',
  true
);
```

### Gerando Hash SHA-256

**No Browser Console:**
```javascript
const senha = 'sua_senha_aqui';
const encoder = new TextEncoder();
const data = encoder.encode(senha);
const hashBuffer = await crypto.subtle.digest('SHA-256', data);
const hashArray = Array.from(new Uint8Array(hashBuffer));
const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
console.log('Hash SHA-256:', hashHex);
```

**Exemplos de Hashes:**
- `admin123` → `240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9`
- `password` → `5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8`

## Fluxo de Login

1. Usuário acessa `/saas-admin`
2. Insere email e senha
3. Frontend gera hash SHA-256 da senha
4. Frontend chama `supabase.rpc('saas_admin_login', {...})`
5. Backend valida credenciais
6. Se válido, configura metadata `is_saas_admin=true` no auth.users
7. RLS policies permitem acesso aos dados

## Funcionalidades do SaaS Admin Console

Com acesso de SaaS Admin, você pode:

1. **Dashboard:** Visualizar métricas globais do SaaS
2. **Organizações:** Gerenciar organizações (tenants)
3. **Ambientes:** Criar/gerenciar environments (produção, homologação, etc)
4. **Planos:** Gerenciar planos de assinatura
5. **White Label:** Configurar branding por organização
6. **Logs:** Auditar ações no sistema
7. **Métricas:** Monitorar uso e performance

## Criando Environments

Para criar environments de homologação e produção:

1. Acesse o SaaS Admin Console
2. Vá em "Ambientes"
3. Expanda a organização desejada
4. Clique em "Novo Ambiente"
5. Preencha:
   - **Nome:** Produção (ou Homologação)
   - **Slug:** producao (ou homologacao)
   - **Tipo:** production (ou staging)
   - **Descrição:** Ambiente de produção
   - **Retenção de Dados:** 365 dias
6. Clique em "Criar"

### Tipos de Ambiente Disponíveis:

- `production` → Produção
- `staging` → Homologação
- `testing` → Testes
- `sandbox` → Sandbox
- `development` → Desenvolvimento

## Troubleshooting

### Erro: "relation 'saas_admins' does not exist"
**Solução:** A tabela foi criada. Faça refresh da página.

### Erro: "Credenciais inválidas"
**Solução:** Verifique se está usando:
- Email: `admin@gruposmartlog.com.br`
- Senha: `admin123`

### Não consegue criar environments
**Solução:** Verifique se está logado como SaaS Admin. O metadata `is_saas_admin` deve estar configurado.

## Segurança em Produção

⚠️ **IMPORTANTE:** Antes de ir para produção:

1. **Altere a senha padrão** do admin
2. **Crie novos admins** com senhas fortes
3. **Desative ou remova** o admin padrão
4. **Configure 2FA** se disponível
5. **Audite logs** regularmente
6. **Limite acesso** por IP se possível

## Suporte

Para problemas ou dúvidas:
- Verifique os logs no browser console
- Verifique os logs do Supabase
- Contate o suporte técnico
