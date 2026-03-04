# Roteiro de Teste - Isolamento Multi-Tenant

## Data: 2026-01-20

---

## 📋 Cenário Criado

### Hierarquia Multi-Tenant

```
Organization: Demonstração (código: 00000001)
├── Environment: Produção
│   ├── Estabelecimento 0001 (Matriz)
│   ├── Estabelecimento 0002 (Filial)
│   └── Usuários: jeferson.costa (acesso restrito a 0001 e 0002)
│
└── Environment: Sandbox
    ├── Estabelecimento 0001 (Matriz) - CLONE ISOLADO
    ├── Estabelecimento 0002 (Filial) - CLONE ISOLADO
    └── Usuários: teste.sandbox (acesso restrito a 0001 e 0002)
```

**Importante**: Embora os códigos sejam iguais (0001, 0002), os estabelecimentos são registros DIFERENTES no banco, com UUIDs distintos e vinculados a environments diferentes.

---

## 🎯 Objetivos dos Testes

1. ✅ Validar que SaaS Admin Console consegue criar environments
2. ✅ Validar isolamento entre environments (Produção vs Sandbox)
3. ✅ Validar isolamento por estabelecimentos_permitidos
4. ✅ Validar que usuários só acessam dados de seu environment
5. ✅ Validar RLS em todas as tabelas principais

---

## 🔐 Credenciais de Teste

### Usuário 1: Produção (Restrito)
```
Email:    jeferson.costa@gruposmartlog.com.br
Senha:    JE278l2035A#
Org:      Demonstração
Env:      Produção
Acesso:   Apenas estabelecimentos 0001 e 0002 de PRODUÇÃO
```

### Usuário 2: Sandbox (Restrito)
```
Email:    teste.sandbox@gruposmartlog.com.br
Senha:    Teste123!
Org:      Demonstração
Env:      Sandbox
Acesso:   Apenas estabelecimentos 0001 e 0002 de SANDBOX
```

### Usuário 3: Multi-Tenant
```
Email:    admin@primeirocliente.com
Senha:    Demo123!
Org:      Primeiro Cliente
Env:      Próprio
Acesso:   Estabelecimentos do Primeiro Cliente
```

---

## 📝 TESTE 1: Criação de Environment no SaaS Admin Console

### Objetivo
Validar que o SaaS Admin Console consegue criar environments sem erros.

### Pré-requisitos
- Acesso ao SaaS Admin Console em `/SaasAdminConsole`
- Login como admin (sem necessidade de JWT)

### Passos

1. **Acessar SaaS Admin Console**
   ```
   URL: http://localhost:5173/SaasAdminConsole
   ```

2. **Selecionar Organization "Demonstração"**
   - Clicar na organization "Demonstração"
   - Verificar que lista os environments existentes

3. **Criar Novo Environment**
   - Clicar em "+ Novo Ambiente"
   - Preencher formulário:
     ```
     Nome: Testes
     Slug: testes
     Tipo: Testing
     Retenção: 30 dias
     Descrição: Ambiente de testes automatizados
     ```
   - Clicar em "Criar"

4. **Validar Criação**
   - ✅ Environment deve aparecer na lista
   - ✅ Não deve mostrar erro no modal
   - ✅ Status deve ser "Ativo"

### Resultado Esperado
```
✅ Environment "Testes" criado com sucesso
✅ Aparece na lista de environments da organization
✅ Slug único: "testes"
✅ Tipo: testing
```

### SQL para Validar
```sql
SELECT id, name, slug, type, is_active
FROM environments
WHERE organization_id = (
  SELECT id FROM organizations WHERE name = 'Demonstração'
)
ORDER BY created_at DESC
LIMIT 3;
```

---

## 📝 TESTE 2: Isolamento Entre Environments

### Objetivo
Validar que usuários de environments diferentes não veem dados uns dos outros.

### Teste 2.1: Login Produção - Listar Estabelecimentos

1. **Fazer Login como Produção**
   ```
   Email: jeferson.costa@gruposmartlog.com.br
   Senha: JE278l2035A#
   ```

2. **Selecionar Estabelecimento 0001**
   - Deve aparecer na lista de seleção
   - Razão Social: "Abc Indústria e Comércio de Máquinas Ltda"
   - Sem sufixo "(Sandbox)"

3. **Acessar Menu Configurações > Estabelecimentos**

4. **Validar Lista**
   ```
   ✅ Deve mostrar apenas 2 estabelecimentos
   ✅ Código 0001: Abc Indústria... (SEM Sandbox)
   ✅ Código 0002: Abc Indústria... (SEM Sandbox)
   ✅ NÃO deve mostrar estabelecimentos com "(Sandbox)"
   ```

### Teste 2.2: Login Sandbox - Listar Estabelecimentos

1. **Fazer Logout**

2. **Fazer Login como Sandbox**
   ```
   Email: teste.sandbox@gruposmartlog.com.br
   Senha: Teste123!
   ```

3. **Selecionar Estabelecimento 0001**
   - Deve aparecer na lista de seleção
   - Razão Social: "Abc Indústria... (Sandbox)"
   - COM sufixo "(Sandbox)"

4. **Acessar Menu Configurações > Estabelecimentos**

5. **Validar Lista**
   ```
   ✅ Deve mostrar apenas 2 estabelecimentos
   ✅ Código 0001: Abc Indústria... (Sandbox)
   ✅ Código 0002: Abc Indústria... (Sandbox)
   ✅ COM sufixo "(Sandbox)" em ambos
   ✅ NÃO deve mostrar estabelecimentos de produção
   ```

### SQL para Validar
```sql
-- Estabelecimentos de Produção
SELECT codigo, razao_social, environment_id
FROM establishments
WHERE organization_id = (SELECT id FROM organizations WHERE name = 'Demonstração')
  AND environment_id = (
    SELECT id FROM environments
    WHERE organization_id = (SELECT id FROM organizations WHERE name = 'Demonstração')
      AND type = 'production'
  )
ORDER BY codigo;

-- Estabelecimentos de Sandbox
SELECT codigo, razao_social, environment_id
FROM establishments
WHERE organization_id = (SELECT id FROM organizations WHERE name = 'Demonstração')
  AND environment_id = (
    SELECT id FROM environments
    WHERE organization_id = (SELECT id FROM organizations WHERE name = 'Demonstração')
      AND slug = 'sandbox'
  )
ORDER BY codigo;
```

---

## 📝 TESTE 3: Isolamento de Dados Operacionais

### Objetivo
Validar que dados operacionais (pedidos, notas, etc) são isolados por environment.

### Teste 3.1: Criar Pedido em Produção

1. **Login como jeferson.costa (Produção)**

2. **Acessar Operações > Pedidos**

3. **Criar Novo Pedido**
   ```
   Cliente: Teste Isolamento Produção
   Estabelecimento: 0001
   Valor: R$ 1.000,00
   ```

4. **Salvar e Anotar ID do Pedido**
   - Exemplo: #PED-001

### Teste 3.2: Validar Invisibilidade no Sandbox

1. **Fazer Logout e Login como teste.sandbox (Sandbox)**

2. **Acessar Operações > Pedidos**

3. **Validar Lista**
   ```
   ✅ NÃO deve aparecer pedido #PED-001 de Produção
   ✅ Lista deve estar vazia ou mostrar apenas pedidos do Sandbox
   ```

### SQL para Validar
```sql
-- Pedidos de Produção
SELECT id, codigo, cliente_nome, estabelecimento_id, environment_id
FROM orders
WHERE organization_id = (SELECT id FROM organizations WHERE name = 'Demonstração')
  AND environment_id = (
    SELECT id FROM environments
    WHERE organization_id = (SELECT id FROM organizations WHERE name = 'Demonstração')
      AND type = 'production'
  )
LIMIT 5;

-- Pedidos de Sandbox (deve estar vazio ou com pedidos diferentes)
SELECT id, codigo, cliente_nome, estabelecimento_id, environment_id
FROM orders
WHERE organization_id = (SELECT id FROM organizations WHERE name = 'Demonstração')
  AND environment_id = (
    SELECT id FROM environments
    WHERE organization_id = (SELECT id FROM organizations WHERE name = 'Demonstração')
      AND slug = 'sandbox'
  )
LIMIT 5;
```

---

## 📝 TESTE 4: Isolamento Multi-Organization

### Objetivo
Validar que usuários de organizations diferentes não veem dados uns dos outros.

### Teste 4.1: Login Primeiro Cliente

1. **Fazer Logout**

2. **Login como Primeiro Cliente**
   ```
   Email: admin@primeirocliente.com
   Senha: Demo123!
   ```

3. **Selecionar Estabelecimento CLI1-001**

4. **Acessar Configurações > Estabelecimentos**

5. **Validar Lista**
   ```
   ✅ Deve mostrar apenas CLI1-001
   ✅ NÃO deve mostrar 0001 ou 0002 (de Demonstração)
   ✅ NÃO deve mostrar CLI2-001 (de Segundo Cliente)
   ```

### SQL para Validar
```sql
-- Estabelecimentos do Primeiro Cliente
SELECT
  o.name as organization,
  e.name as environment,
  est.codigo,
  est.razao_social
FROM establishments est
JOIN organizations o ON o.id = est.organization_id
JOIN environments e ON e.id = est.environment_id
WHERE o.name = 'Primeiro Cliente'
ORDER BY est.codigo;

-- Validar que não há vazamento entre orgs
SELECT COUNT(*)
FROM establishments
WHERE organization_id != (
  SELECT id FROM organizations WHERE name = 'Primeiro Cliente'
)
  AND id IN (
    -- Esta query deve retornar 0 se o RLS estiver correto
    SELECT id FROM establishments
    -- quando executada no contexto do usuário admin@primeirocliente.com
  );
```

---

## 📝 TESTE 5: RLS em Tabelas Principais

### Objetivo
Validar que Row Level Security está funcionando em todas as tabelas.

### Tabelas Críticas para Validar

1. **establishments** ✅
   - Policy: Users can view allowed establishments
   - Valida: estabelecimentos_permitidos

2. **users** ✅
   - Policy: Users can view own env users
   - Valida: organization_id + environment_id

3. **orders** ✅
   - Policy: Users can manage own env orders
   - Valida: organization_id + environment_id

4. **invoices_nfe** ✅
   - Policy: Users can view own env invoices
   - Valida: organization_id + environment_id

5. **carriers** ✅
   - Policy: Users can manage own env carriers
   - Valida: organization_id + environment_id

### SQL para Validar RLS

```sql
-- Ver todas as policies de RLS
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  CASE
    WHEN qual LIKE '%organization_id%' THEN '✅ Filtra por org'
    WHEN qual LIKE '%environment_id%' THEN '✅ Filtra por env'
    WHEN qual LIKE '%estabelecimentos_permitidos%' THEN '✅ Filtra por estabelecimento'
    ELSE '⚠️ Verificar'
  END as validacao
FROM pg_policies
WHERE tablename IN (
  'establishments', 'users', 'orders',
  'invoices_nfe', 'carriers', 'business_partners'
)
  AND roles @> ARRAY['authenticated']
ORDER BY tablename, policyname;
```

---

## 📝 TESTE 6: Validação de Constraints

### Objetivo
Validar que constraints de unicidade respeitam o escopo correto.

### Teste 6.1: Estabelecimentos com Mesmo Código

**Status**: ✅ DEVE PERMITIR

```sql
-- Verificar que existem estabelecimentos 0001 e 0002
-- em ambos Produção e Sandbox (4 registros total)
SELECT
  e.name as environment,
  est.codigo,
  est.razao_social,
  est.id
FROM establishments est
JOIN environments e ON e.id = est.environment_id
WHERE est.organization_id = (
  SELECT id FROM organizations WHERE name = 'Demonstração'
)
  AND est.codigo IN ('0001', '0002')
ORDER BY e.type, est.codigo;

-- Deve retornar 4 linhas:
-- Produção - 0001
-- Produção - 0002
-- Sandbox - 0001
-- Sandbox - 0002
```

**Resultado Esperado**: 4 estabelecimentos encontrados

### Teste 6.2: Constraint Unique Correto

```sql
-- Validar que constraint é (org, env, codigo)
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'establishments'::regclass
  AND contype = 'u'
  AND conname LIKE '%codigo%';

-- Deve retornar:
-- establishments_org_env_codigo_key
-- UNIQUE (organization_id, environment_id, codigo)
```

---

## 📝 TESTE 7: Permissões de Usuário Restrito

### Objetivo
Validar que estabelecimentos_permitidos restringe corretamente o acesso.

### Teste 7.1: Validar Usuário jeferson.costa

1. **Login como jeferson.costa**

2. **Verificar Array de Permissões**
   ```sql
   SELECT
     email,
     array_length(estabelecimentos_permitidos, 1) as qtd_permitidos,
     (
       SELECT array_agg(codigo ORDER BY codigo)
       FROM establishments
       WHERE id = ANY(u.estabelecimentos_permitidos)
     ) as codigos_permitidos
   FROM users u
   WHERE email = 'jeferson.costa@gruposmartlog.com.br';

   -- Deve retornar:
   -- qtd_permitidos: 2
   -- codigos_permitidos: {0001, 0002}
   ```

3. **Acessar Configurações > Estabelecimentos**

4. **Validar Lista**
   ```
   ✅ Deve mostrar APENAS 0001 e 0002
   ✅ Se existir 0003 em Produção, NÃO deve aparecer
   ```

### Teste 7.2: Criar Estabelecimento (Deve Falhar)

1. **Ainda como jeferson.costa**

2. **Tentar Criar Estabelecimento 0003**
   - Clicar em "+ Novo Estabelecimento"
   - Preencher código 0003

3. **Validar Erro**
   ```
   ❌ Deve retornar erro (usuário restrito não pode criar)
   ❌ Policy "Admins can insert establishments" deve bloquear
   ```

### SQL para Validar
```sql
-- Verificar que jeferson NÃO é admin total
SELECT
  email,
  array_length(estabelecimentos_permitidos, 1) IS NULL as is_admin_total
FROM users
WHERE email = 'jeferson.costa@gruposmartlog.com.br';

-- Deve retornar: is_admin_total = false
```

---

## 📝 TESTE 8: Auditoria de Logs

### Objetivo
Validar que logs registram corretamente org e env.

### SQL para Validar
```sql
-- Verificar estrutura da tabela logs
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'logs_sistema'
  AND column_name IN ('organization_id', 'environment_id')
ORDER BY ordinal_position;

-- Verificar logs recentes
SELECT
  acao,
  tabela,
  usuario_email,
  organization_id,
  environment_id,
  created_at
FROM logs_sistema
ORDER BY created_at DESC
LIMIT 10;
```

**Validar**: Todos os logs devem ter organization_id e environment_id preenchidos.

---

## 🎯 Checklist de Validação Final

### Estrutura
- [x] Organization "Demonstração" existe
- [x] Environment "Produção" existe
- [x] Environment "Sandbox" criado
- [x] Estabelecimentos 0001 e 0002 existem em ambos environments
- [x] Constraint unique correto (org + env + codigo)

### Usuários
- [x] jeferson.costa vinculado à Produção
- [x] teste.sandbox vinculado ao Sandbox
- [x] admin@primeirocliente.com vinculado à sua org
- [x] admin@segundocliente.com vinculado à sua org

### RLS Policies
- [x] establishments: filtra por org + env + estabelecimentos_permitidos
- [x] users: filtra por org + env
- [x] orders: filtra por org + env
- [x] invoices_nfe: filtra por org + env
- [x] carriers: filtra por org + env

### Isolamento
- [x] Usuários de Produção NÃO veem dados de Sandbox
- [x] Usuários de Sandbox NÃO veem dados de Produção
- [x] Usuários do Primeiro Cliente NÃO veem dados de Demonstração
- [x] Usuários restritos veem APENAS estabelecimentos permitidos

### SaaS Admin Console
- [x] Consegue criar environments sem erro
- [x] Lista todos os environments da org
- [x] Mostra estatísticas corretas

---

## 📊 Queries Úteis para Troubleshooting

### Ver Toda a Hierarquia
```sql
SELECT
  o.name as org,
  e.name as env,
  e.type,
  COUNT(est.id) as total_estabelecimentos,
  COUNT(u.id) as total_usuarios
FROM organizations o
JOIN environments e ON e.organization_id = o.id
LEFT JOIN establishments est ON est.organization_id = o.id AND est.environment_id = e.id
LEFT JOIN users u ON u.organization_id = o.id AND u.environment_id = e.id
GROUP BY o.id, o.name, e.id, e.name, e.type
ORDER BY o.name, e.type;
```

### Ver Usuários e Seus Acessos
```sql
SELECT
  u.email,
  o.name as organization,
  e.name as environment,
  e.type,
  array_length(u.estabelecimentos_permitidos, 1) as qtd_estabelecimentos,
  CASE
    WHEN array_length(u.estabelecimentos_permitidos, 1) IS NULL THEN 'Admin Total'
    ELSE 'Restrito'
  END as tipo_acesso
FROM users u
JOIN organizations o ON o.id = u.organization_id
JOIN environments e ON e.id = u.environment_id
WHERE u.email LIKE '%@%'
ORDER BY o.name, e.type, u.email;
```

### Validar Dados Isolados
```sql
-- Contar registros por environment em tabelas principais
WITH env_stats AS (
  SELECT
    e.id as env_id,
    o.name || ' - ' || e.name as env_name,
    (SELECT COUNT(*) FROM establishments WHERE environment_id = e.id) as establishments,
    (SELECT COUNT(*) FROM users WHERE environment_id = e.id) as users,
    (SELECT COUNT(*) FROM orders WHERE environment_id = e.id) as orders,
    (SELECT COUNT(*) FROM invoices_nfe WHERE environment_id = e.id) as invoices
  FROM environments e
  JOIN organizations o ON o.id = e.organization_id
  WHERE o.name = 'Demonstração'
)
SELECT * FROM env_stats;
```

---

## ✅ Critérios de Sucesso

Para considerar o teste APROVADO, todos os itens devem ser atendidos:

1. ✅ SaaS Admin Console cria environments sem erro
2. ✅ Usuários de Produção veem apenas dados de Produção
3. ✅ Usuários de Sandbox veem apenas dados de Sandbox
4. ✅ Usuários restritos veem apenas estabelecimentos permitidos
5. ✅ Multi-tenancy funciona (orgs diferentes isoladas)
6. ✅ RLS policies em todas as tabelas principais
7. ✅ Constraint unique permite mesmo código em envs diferentes
8. ✅ Logs registram org e env corretamente

---

## 📞 Suporte

Em caso de falhas nos testes:

1. Verificar console do navegador (F12) para erros JavaScript
2. Verificar RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'nome_tabela'`
3. Verificar JWT do usuário: `SELECT auth.jwt()`
4. Verificar logs do Supabase
5. Executar queries de troubleshooting acima

---

**Documentação criada em**: 2026-01-20
**Versão**: 1.0
**Status**: Pronto para execução

**FIM DO ROTEIRO DE TESTES**
