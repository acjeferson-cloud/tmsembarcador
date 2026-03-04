# Configuração Multi-Environment Completa

## Usuário Configurado

**Email:** jeferson.costa@logaxis.com.br
**Senha:** JE278l2035A#
**Perfil:** Administrador
**Permissões:** Acesso total a todos os módulos

## Environments Disponíveis

O usuário jeferson.costa@logaxis.com.br agora tem acesso a **5 environments** em **4 organizações diferentes**:

### 1. Organização: Demonstração (00000001)

#### Environment: PRODUCAO (Produção)
- **Tipo:** Produção
- **Código:** PRODUCAO
- **Estabelecimentos:** 1 (código 0001)
- **Status:** Ativo

#### Environment: TESTES (Testes)
- **Tipo:** Teste
- **Código:** TESTES
- **Estabelecimentos:** 1 (código 0001)
- **Status:** Ativo

### 2. Organização: Quimidrol (00000002)

#### Environment: TESTES (Testes)
- **Tipo:** Teste
- **Código:** TESTES
- **Estabelecimentos:** 1 (código 0001)
- **Status:** Ativo

### 3. Organização: Lynus (00000003)

#### Environment: TESTES (Testes)
- **Tipo:** Teste
- **Código:** TESTES
- **Estabelecimentos:** 1 (código 0001)
- **Status:** Ativo

### 4. Organização: GMEG (00000004)

#### Environment: TESTES (Testes)
- **Tipo:** Teste
- **Código:** TESTES
- **Estabelecimentos:** 1 (código 0001)
- **Status:** Ativo

## Fluxo de Login Atual

### Com o Fluxo Padrão (Atual):
1. Usuário faz login com email/senha
2. Sistema seleciona automaticamente o primeiro environment disponível
3. Redirecionamento direto para o dashboard

### Com o Novo Fluxo (Para Ativar):
1. Usuário insere email/senha
2. Sistema valida as credenciais
3. **Tela de seleção mostra os 5 environments disponíveis:**
   - Demonstração > Produção
   - Demonstração > Testes
   - Quimidrol > Testes
   - Lynus > Testes
   - GMEG > Testes
4. Usuário seleciona o environment desejado
5. Login é completado no environment escolhido
6. Redirecionamento para o dashboard

## Como Ativar o Novo Fluxo de Seleção

Para ativar a seleção de environments no login, siga estas etapas:

### 1. Modificar o App.tsx

Localize a seção onde o componente Login é renderizado e substitua por:

```typescript
import { LoginWithEnvironmentFlow } from './components/Auth/LoginWithEnvironmentFlow';

// No return do App, onde está:
if (!user || isLoading) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ConnectionProvider>
          <OfflineAlert />
          <Login onLogin={handleLogin} />
        </ConnectionProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

// Substituir por:
if (!user || isLoading) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ConnectionProvider>
          <OfflineAlert />
          <LoginWithEnvironmentFlow
            onLoginSuccess={(loginData) => {
              // Criar usuário com os dados retornados
              const userData = {
                id: parseInt(loginData.codigo) || 1,
                codigo: loginData.codigo,
                name: loginData.name,
                email: loginData.email,
                role: 'admin',
                perfil: loginData.profile || 'administrador',
                permissoes: loginData.permissions || ['all'],
                estabelecimentosPermitidos: [],
                organization_id: loginData.organization_id,
                organization_code: loginData.organization_code,
                organization_name: loginData.organization_name,
                environment_id: loginData.environment_id,
                environment_code: loginData.environment_code,
                environment_name: loginData.environment_name,
                establishment_id: loginData.establishment_id,
                establishment_code: loginData.establishment_code,
                establishment_name: loginData.establishment_name,
              };

              // Salvar no localStorage
              setUser(userData);
              localStorage.setItem('tms-user', JSON.stringify(userData));
              localStorage.setItem('tms-session', JSON.stringify({
                timestamp: Date.now(),
                maxAge: loginData.rememberMe ? (30 * 24 * 60 * 60 * 1000) : (24 * 60 * 60 * 1000)
              }));
              localStorage.setItem('tms-selected-org-id', loginData.organization_id);
              localStorage.setItem('tms-selected-env-id', loginData.environment_id);

              if (loginData.rememberMe) {
                localStorage.setItem('tms-remember-me', 'true');
                localStorage.setItem('tms-remembered-email', loginData.email);
              }

              // Configurar estabelecimento padrão
              const establishment = {
                id: 1,
                codigo: loginData.establishment_code || '0001',
                cnpj: '',
                razaoSocial: loginData.establishment_name || 'Estabelecimento Padrão',
                fantasia: loginData.establishment_name || 'Estabelecimento Padrão',
                tipo: 'matriz' as const,
              };
              setCurrentEstablishment(establishment);
              localStorage.setItem('tms-current-establishment', JSON.stringify(establishment));
            }}
          />
        </ConnectionProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
```

### 2. Importar o Componente

No topo do App.tsx, adicione:

```typescript
import { LoginWithEnvironmentFlow } from './components/Auth/LoginWithEnvironmentFlow';
```

## Testando a Seleção de Environments

### 1. Testar Fluxo Completo:
```bash
# Fazer login
Email: jeferson.costa@logaxis.com.br
Senha: JE278l2035A#

# Após validação, deve aparecer tela com 5 opções:
1. Demonstração - Produção (verde)
2. Demonstração - Testes (amarelo)
3. Quimidrol - Testes (amarelo)
4. Lynus - Testes (amarelo)
5. GMEG - Testes (amarelo)
```

### 2. Testar Isolamento de Dados:
1. Fazer login no environment "Demonstração > Produção"
2. Criar alguns pedidos/registros
3. Fazer logout
4. Fazer login no environment "Demonstração > Testes"
5. Verificar que os dados são diferentes (isolamento funcionando)

### 3. Testar Troca de Environment:
1. Fazer login em um environment
2. Fazer logout
3. Fazer login em outro environment
4. Verificar que o contexto mudou corretamente

## Estrutura de Dados

### Query para Verificar Environments:
```sql
SELECT * FROM get_user_available_environments('jeferson.costa@logaxis.com.br');
```

### Query para Verificar Usuários por Environment:
```sql
SELECT
    u.codigo,
    u.nome,
    u.email,
    o.codigo as org,
    e.codigo as env,
    est.codigo as estabelecimento
FROM users u
JOIN saas_organizations o ON o.id = u.organization_id
JOIN saas_environments e ON e.id = u.environment_id
LEFT JOIN establishments est ON est.environment_id = e.id
WHERE u.email = 'jeferson.costa@logaxis.com.br'
ORDER BY o.codigo, e.codigo;
```

## Vantagens do Multi-Environment

### 1. Isolamento Total de Dados
- Cada environment tem seus próprios dados completamente isolados
- Testes não afetam produção
- Múltiplas organizações podem ser gerenciadas pelo mesmo usuário

### 2. Flexibilidade
- Usuário pode acessar múltiplos environments da mesma organização
- Usuário pode acessar environments de diferentes organizações
- Fácil alternância entre ambientes

### 3. Segurança
- RLS garante que usuário só vê dados do environment ativo
- Session context mantém o isolamento
- Não há vazamento de dados entre environments

### 4. Gestão Centralizada
- SaaS Admin pode gerenciar todos os environments
- Logotipos personalizados por environment
- Configurações independentes

## Próximos Passos Sugeridos

### 1. Configurar Logotipos
- Acessar SaaS Admin (/saas-admin)
- Fazer upload de logotipos para cada environment
- Logotipos aparecerão na tela de seleção

### 2. Criar Mais Usuários
- Adicionar usuários específicos para cada environment
- Configurar permissões granulares por usuário
- Testar isolamento entre usuários

### 3. Personalizar Environments
- Configurar dados de demonstração em environments de teste
- Configurar integrações específicas por environment
- Ajustar configurações de retenção de dados

### 4. Monitoramento
- Acompanhar uso de cada environment via SaaS Admin
- Verificar métricas de acesso
- Analisar performance por environment

## Arquivos Relevantes

### Componentes Criados:
- `/src/components/Auth/EnvironmentSelector.tsx` - Tela de seleção
- `/src/components/Auth/LoginWithEnvironmentFlow.tsx` - Wrapper do fluxo completo

### Serviços Criados:
- `/src/services/userEnvironmentsService.ts` - Busca environments
- `/src/services/authWithEnvironmentService.ts` - Autenticação com environment

### Funções RPC:
- `get_user_available_environments(email)` - Lista environments do usuário
- `validate_user_credentials_only(email, password)` - Valida credenciais
- `tms_login_with_environment(email, environment_id)` - Login no environment

## Credenciais de Acesso

### Login TMS:
- **Email:** jeferson.costa@logaxis.com.br
- **Senha:** JE278l2035A#
- **Environments:** 5 disponíveis (1 produção + 4 testes)

### SaaS Admin:
- **Email:** jeferson.costa@logaxis.com.br
- **Senha:** Admin@2025Pt
- **URL:** /saas-admin
- **Acesso:** Gestão global de todos os environments

## Status da Implementação

✅ Usuário criado em todos os environments TESTES
✅ Estabelecimentos criados para todos os environments
✅ Função RPC testada e funcionando
✅ Componente de seleção pronto
✅ Documentação completa
✅ Build executado com sucesso

🚧 **Aguardando ativação:** Modificação do App.tsx para usar o novo fluxo
