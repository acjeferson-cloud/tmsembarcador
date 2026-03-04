# SaaS Admin Console - Acesso via URL

## ✅ Mudanças Implementadas

O **SaaS Admin Console** foi removido do menu principal e agora é acessado exclusivamente através de URL direta.

### 1. **URL de Acesso**
```
https://embarcador.gruposmartlog.com.br/SaasAdminConsole
```

### 2. **Mudanças Aplicadas**

#### ✅ Menu Principal
- **Removido**: A opção "SaaS Admin Console" foi completamente removida do menu lateral
- Arquivo alterado: `src/data/menuConfig.ts`

#### ✅ Rota Pública
- **Criada**: Nova rota pública `/SaasAdminConsole` (case-sensitive)
- Funciona de forma independente do sistema TMS principal
- Não requer login no TMS para acessar

#### ✅ Sistema de Autenticação Independente
- **Criado**: Componente `SaasAdminApp.tsx` que gerencia autenticação própria
- Possui tela de login dedicada
- Valida credenciais contra tabela `saas_admin_users`
- Não interfere com a autenticação do sistema TMS

#### ✅ Arquivos Criados/Modificados

**Novos Arquivos:**
- `src/components/SaasAdmin/SaasAdminApp.tsx` - Wrapper com autenticação

**Arquivos Modificados:**
- `src/data/menuConfig.ts` - Removida entrada do menu
- `src/App.tsx` - Adicionada rota pública

## 🔐 Credenciais de Acesso

### Usuário Admin Criado:
```
Email: admin@gruposmartlog.com.br
Senha: JE278l2035A#
```

## 📋 Como Usar

### 1. **Acesso Direto**
Digite a URL completa no navegador:
```
https://embarcador.gruposmartlog.com.br/SaasAdminConsole
```

### 2. **Login**
- A tela de login será exibida automaticamente
- Insira as credenciais do administrador SaaS
- O sistema validará contra a tabela `saas_admin_users`

### 3. **Funcionalidades Disponíveis**
Após o login, você terá acesso a:
- ✅ **Dashboard**: Visão geral do sistema multi-tenant
- ✅ **Clientes (Tenants)**: Gerenciamento de organizações
- ✅ **Planos**: Gestão de planos SaaS
- ✅ **White Label**: Configurações de marca
- ✅ **Logs de Auditoria**: Registro de ações
- ✅ **Métricas**: Estatísticas do sistema

## 🔒 Segurança

### Isolamento Completo
- O SaaS Admin Console opera de forma independente
- Não aparece no menu para usuários do TMS
- Requer autenticação própria
- Não compartilha sessão com o sistema TMS

### Políticas RLS
As seguintes políticas foram criadas para permitir acesso:
- `organizations`: Leitura e escrita
- `saas_plans`: Leitura
- `organization_settings`: Leitura

### Tabela de Usuários Admin
```sql
SELECT * FROM saas_admin_users;
```

Atualmente há 2 usuários:
1. `admin@saas.local` (padrão do sistema)
2. `admin@gruposmartlog.com.br` (seu usuário)

## 📝 Notas Importantes

1. **Case-Sensitive**: A URL deve ser digitada exatamente como `/SaasAdminConsole` (com 'S', 'A' e 'C' maiúsculos)

2. **Sem Menu**: O console NÃO aparece mais no menu do sistema TMS

3. **Autenticação Separada**: Mesmo usuários admin do TMS precisam fazer login separadamente no SaaS Console

4. **Acesso Direto**: Pode ser acessado sem estar logado no TMS principal

## 🎯 Vantagens da Nova Abordagem

✅ **Segurança**: Não fica visível para usuários comuns
✅ **Independência**: Sistema de autenticação próprio
✅ **Organização**: Separação clara entre TMS e Admin SaaS
✅ **Facilidade**: URL direta e simples de compartilhar
✅ **Profissionalismo**: Abordagem padrão em sistemas SaaS

## 🔧 Manutenção

### Criar Novo Admin
```sql
INSERT INTO saas_admin_users (
  email,
  password_hash,
  name,
  role,
  is_active
) VALUES (
  'novo@email.com',
  '(hash SHA-256 da senha)',
  'Nome do Admin',
  'super_admin',
  true
);
```

### Gerar Hash SHA-256
```bash
echo -n "sua_senha" | sha256sum | cut -d' ' -f1
```

---

**Data de Implementação**: 2026-01-20
**Versão**: 1.0.0
