# Quick Start - TMS Embarcador

## 🚀 Início Rápido em 5 Minutos

### 1️⃣ Verificar Banco de Dados

O banco já está criado no Supabase! Verifique executando:

```sql
SELECT COUNT(*) as total_tabelas
FROM information_schema.tables
WHERE table_schema = 'public';

-- Deve retornar: 47 tabelas
```

### 2️⃣ Testar Login

```sql
SELECT * FROM validate_user_credentials('admin@demo.com', 'Demo@123');
```

**Resultado esperado:**
```
user_id | organization_id | environment_id | nome | tipo | bloqueado
<uuid>  | <uuid>          | <uuid>         | Administrador Demo | admin | false
```

### 3️⃣ Testar Dados Iniciais

```sql
-- Organização
SELECT codigo, nome FROM saas_organizations WHERE codigo = 'DEMO001';
-- DEMO001 | Empresa Demonstração

-- Ambiente
SELECT codigo, nome FROM saas_environments WHERE codigo = 'PROD';
-- PROD | Produção

-- Estabelecimento
SELECT codigo, nome_fantasia FROM establishments WHERE codigo = '0001';
-- 0001 | Matriz Demonstração
```

---

## 📋 Checklist de Validação

- [ ] 47 tabelas criadas
- [ ] Login funciona com admin@demo.com
- [ ] RLS habilitado em todas as tabelas
- [ ] Dados iniciais inseridos
- [ ] Funções de autenticação funcionando

---

## 🔐 Credenciais Demo

```
Email: admin@demo.com
Senha: Demo@123
```

---

## 📁 Arquivos Criados

1. **database/tmsembarcador_complete.sql** - Script SQL completo
2. **src/types/database.types.ts** - Tipos TypeScript
3. **database/README.md** - Documentação completa
4. **database/CREDENCIAIS_ACESSO.md** - Guia de acesso
5. **database/RESUMO_EXECUCAO.md** - Resumo da execução
6. **database/QUICK_START.md** - Este arquivo

---

## 🎯 Próximos Passos

### Opção 1: Testar no SQL Editor
1. Acesse o Supabase SQL Editor
2. Execute: `SELECT * FROM validate_user_credentials('admin@demo.com', 'Demo@123');`
3. Explore as tabelas criadas

### Opção 2: Integrar com Frontend
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// src/services/authService.ts
import { supabase } from '@/lib/supabase';

export async function login(email: string, senha: string) {
  const { data } = await supabase.rpc('validate_user_credentials', {
    p_email: email,
    p_senha: senha
  });

  if (data && data.length > 0) {
    await supabase.rpc('reset_login_attempts', { p_email: email });
    return { success: true, user: data[0] };
  }

  await supabase.rpc('increment_login_attempts', { p_email: email });
  return { success: false, error: 'Credenciais inválidas' };
}
```

### Opção 3: Criar Novos Dados
```sql
-- Criar transportadora
INSERT INTO carriers (
  organization_id,
  environment_id,
  codigo,
  nome_fantasia,
  cnpj,
  ativo
) VALUES (
  (SELECT id FROM saas_organizations WHERE codigo = 'DEMO001'),
  (SELECT id FROM saas_environments WHERE codigo = 'PROD'
   AND organization_id = (SELECT id FROM saas_organizations WHERE codigo = 'DEMO001')),
  'TRANSP001',
  'Transportadora ABC',
  '11.222.333/0001-00',
  true
);

-- Criar cliente
INSERT INTO business_partners (
  organization_id,
  environment_id,
  codigo,
  tipo,
  razao_social,
  cpf_cnpj,
  ativo
) VALUES (
  (SELECT id FROM saas_organizations WHERE codigo = 'DEMO001'),
  (SELECT id FROM saas_environments WHERE codigo = 'PROD'
   AND organization_id = (SELECT id FROM saas_organizations WHERE codigo = 'DEMO001')),
  'CLI001',
  'cliente',
  'Cliente XYZ Ltda',
  '22.333.444/0001-00',
  true
);
```

---

## 🆘 Troubleshooting

### Problema: "RLS policy violation"
**Solução:** As políticas RLS estão configuradas. Use as funções fornecidas ou contexto correto.

### Problema: "Senha inválida"
**Solução:** Certifique-se de usar SHA-256:
```sql
encode(digest('senha', 'sha256'), 'hex')
```

### Problema: "Tabelas não encontradas"
**Solução:** Execute o script completo:
```bash
# No Supabase SQL Editor, cole o conteúdo de:
database/tmsembarcador_complete.sql
```

---

## 📊 Estrutura Multi-Tenant

```
Organization (DEMO001)
  └── Environment (PROD)
      ├── User (admin@demo.com)
      └── Establishment (0001)
          ├── Carriers
          ├── Business Partners
          ├── Orders
          ├── Invoices
          └── ...
```

---

## 🎓 Exemplos Práticos

### Exemplo 1: Login Completo
```typescript
const resultado = await supabase.rpc('validate_user_credentials', {
  p_email: 'admin@demo.com',
  p_senha: 'Demo@123'
});

console.log('Login:', resultado);
```

### Exemplo 2: Listar Transportadoras
```typescript
const { data: transportadoras } = await supabase
  .from('carriers')
  .select('*')
  .eq('organization_id', organizationId)
  .eq('environment_id', environmentId)
  .eq('ativo', true);
```

### Exemplo 3: Criar Pedido
```typescript
const { data: pedido } = await supabase
  .from('orders')
  .insert({
    organization_id: orgId,
    environment_id: envId,
    establishment_id: estabId,
    numero_pedido: 'PED-0001',
    tipo: 'saida',
    status: 'pendente',
    data_pedido: new Date().toISOString().split('T')[0]
  })
  .select()
  .single();
```

---

## ✅ Validação Final

Execute este script para validar tudo:

```sql
-- 1. Contar tabelas
SELECT COUNT(*) as tabelas FROM information_schema.tables WHERE table_schema = 'public';
-- Esperado: 47

-- 2. Testar login
SELECT COUNT(*) as login_ok FROM validate_user_credentials('admin@demo.com', 'Demo@123');
-- Esperado: 1

-- 3. Verificar RLS
SELECT COUNT(*) as tabelas_com_rls
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;
-- Esperado: 47

-- 4. Verificar índices
SELECT COUNT(*) as indices FROM pg_indexes WHERE schemaname = 'public';
-- Esperado: 89+

-- 5. Verificar funções
SELECT COUNT(*) as funcoes FROM pg_proc WHERE pronamespace = 'public'::regnamespace;
-- Esperado: 6+

-- Se todos os testes passaram: ✅ Sistema pronto para uso!
```

---

## 🎉 Sucesso!

Se você chegou até aqui e todos os testes passaram, seu banco de dados está **100% funcional**!

### O Que Você Tem Agora:
✅ 47 tabelas criadas e configuradas
✅ Sistema multi-tenant completo
✅ Segurança RLS implementada
✅ Funções de autenticação prontas
✅ Dados demo para testes
✅ Tipos TypeScript gerados
✅ Documentação completa

### Próximos Passos:
1. Integrar com seu frontend
2. Implementar telas de CRUD
3. Adicionar mais dados demo
4. Configurar integrações (WhatsApp, OpenAI, Maps)

---

**Boa sorte! 🚀**

Para mais detalhes, consulte:
- `database/README.md` - Documentação completa
- `database/CREDENCIAIS_ACESSO.md` - Como usar
- `database/RESUMO_EXECUCAO.md` - Resumo completo
