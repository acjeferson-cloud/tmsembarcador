# Guia de Integração: OrganizationSelector para Super Admin

## Objetivo

Permitir que o usuário `admin@gruposmartlog.com.br` selecione dinamicamente qual organização e ambiente deseja acessar ao fazer login.

---

## Arquivos Criados

### 1. `/src/utils/tenantContext.ts`
Helper centralizado para gerenciar contexto multi-tenant.

### 2. `/src/components/Auth/OrganizationSelector.tsx`
Modal de seleção de organização e ambiente.

---

## Modificações Necessárias

### 1. Modificar `/src/hooks/useAuth.ts`

#### 1.1 Adicionar Estados

Adicionar após os estados existentes:

```typescript
const [showOrganizationSelector, setShowOrganizationSelector] = useState(false);
const [tempUserData, setTempUserData] = useState<any>(null);
```

#### 1.2 Modificar Função `login`

Localizar a função `login` e modificar após validação bem-sucedida:

```typescript
// Após a linha: const dbUserData = result.user_data;

// Verificar se é super admin
if (dbUserData.email === 'admin@gruposmartlog.com.br') {
  // Salvar dados temporários
  setTempUserData(dbUserData);

  // Mostrar modal de seleção
  setShowOrganizationSelector(true);

  // Não continuar o fluxo ainda
  return;
}

// Continuar fluxo normal para usuários regulares...
```

#### 1.3 Adicionar Função de Callback

Adicionar nova função no hook:

```typescript
const handleOrganizationSelected = async (organizationId: string, environmentId: string | null) => {
  try {
    if (!tempUserData) {
      throw new Error('Dados temporários não encontrados');
    }

    // Configurar contexto com organização/ambiente selecionados
    await TenantContextHelper.switchContext(
      organizationId,
      environmentId,
      tempUserData.email
    );

    // Criar objeto de usuário
    const userData: User & { supabaseUser?: SupabaseUser } = {
      id: tempUserData.id,
      name: tempUserData.nome,
      email: tempUserData.email,
      role: 'admin',
      foto_perfil_url: tempUserData.foto_perfil,
      perfil: tempUserData.perfil,
      permissoes: tempUserData.permissoes || ['all'],
      estabelecimentosPermitidos: [],
      supabaseUser: undefined
    };

    setUser(userData);
    localStorage.setItem('tms-user', JSON.stringify(userData));
    localStorage.setItem('tms-session', JSON.stringify({
      timestamp: Date.now(),
      email: userData.email
    }));

    // Buscar estabelecimentos com o contexto selecionado
    const { data: dbEstablishments } = await supabase
      .rpc('get_user_establishments', {
        p_user_email: tempUserData.email,
        p_organization_id: organizationId,
        p_environment_id: environmentId
      });

    if (dbEstablishments && dbEstablishments.length > 0) {
      const allowedEstablishments = dbEstablishments.map((est: any) => ({
        id: parseInt(est.codigo) || 1,
        codigo: est.codigo,
        cnpj: est.cnpj,
        inscricaoEstadual: est.inscricao_estadual,
        razaoSocial: est.razao_social,
        fantasia: est.fantasia || '',
        endereco: est.endereco,
        bairro: est.bairro,
        cep: est.cep,
        cidade: est.cidade,
        estado: est.estado,
        tipo: est.tipo,
        trackingPrefix: est.tracking_prefix,
        organizationId: est.organization_id,
        environmentId: est.environment_id
      }));

      setAvailableEstablishments(allowedEstablishments);

      if (allowedEstablishments.length === 1) {
        const establishment = allowedEstablishments[0];
        setCurrentEstablishment(establishment);
        localStorage.setItem('tms-current-establishment', JSON.stringify(establishment));
        setShowEstablishmentSelector(false);
      } else {
        setShowEstablishmentSelector(true);
      }
    }

    // Fechar modal de organização
    setShowOrganizationSelector(false);
    setTempUserData(null);

  } catch (error) {
    console.error('Erro ao selecionar organização:', error);
    throw error;
  }
};
```

#### 1.4 Exportar Novos Estados/Funções

No return do hook, adicionar:

```typescript
return {
  // ... estados existentes
  showOrganizationSelector,
  handleOrganizationSelected,
  // ... outros retornos
};
```

---

### 2. Modificar `/src/App.tsx`

#### 2.1 Importar OrganizationSelector

Adicionar no topo:

```typescript
import { OrganizationSelector } from './components/Auth/OrganizationSelector';
```

#### 2.2 Desestruturar Novos Estados

Modificar o useAuth:

```typescript
const {
  user,
  login,
  currentEstablishment,
  showEstablishmentSelector,
  selectEstablishment,
  getUserEstablishmentsFromDB,
  availableEstablishments,
  isLoading,
  showOrganizationSelector,  // NOVO
  handleOrganizationSelected  // NOVO
} = useAuth();
```

#### 2.3 Adicionar Modal no JSX

Antes do componente `<Login>`, adicionar:

```tsx
{showOrganizationSelector && user && (
  <OrganizationSelector
    isOpen={showOrganizationSelector}
    userEmail={user.email}
    onSelect={handleOrganizationSelected}
  />
)}
```

---

## Fluxo Completo

### Para Usuário Regular

```
1. Login com email/senha
2. Validação no backend
3. Retorna organization_id/environment_id do perfil
4. Configura contexto automaticamente
5. Carrega estabelecimentos
6. Se 1 estabelecimento → seleciona automaticamente
7. Se > 1 → mostra EstablishmentSelectionModal
```

### Para Super Admin (admin@gruposmartlog.com.br)

```
1. Login com email/senha
2. Validação no backend
3. Detecta super admin
4. Mostra OrganizationSelector
5. Admin seleciona organização + ambiente
6. Configura contexto com seleção
7. Salva seleção no localStorage
8. Carrega estabelecimentos do contexto selecionado
9. Continua fluxo normal
```

---

## Testes Recomendados

### Teste 1: Login Super Admin

```
1. Fazer login com admin@gruposmartlog.com.br
2. Verificar se OrganizationSelector aparece
3. Selecionar organização
4. Selecionar ambiente
5. Confirmar
6. Verificar se estabelecimentos são carregados
7. Verificar se pode acessar dados da organização
```

### Teste 2: Troca de Contexto

```
1. Fazer logout
2. Fazer login novamente
3. Selecionar OUTRA organização
4. Verificar se dados são da nova organização
5. Verificar se não há vazamento da organização anterior
```

### Teste 3: Usuário Regular

```
1. Fazer login com usuário normal
2. Verificar se OrganizationSelector NÃO aparece
3. Verificar se usa organization_id do perfil
4. Verificar se estabelecimentos são carregados normalmente
```

---

## Segurança

### Validações Implementadas

✅ **Organization ID vem do servidor**
- Modal apenas EXIBE opções
- Seleção é validada no backend
- Contexto configurado via RPC

✅ **Não aceita manipulation**
- Payload não aceita organization_id customizado
- localStorage usado apenas para cache
- Sempre validado com banco de dados

✅ **Logs de auditoria**
- Todas as trocas de contexto devem ser logadas
- Identificar super admin acessando diferentes orgs

---

## Melhorias Futuras

### 1. Audit Logs

Adicionar log sempre que super admin trocar de contexto:

```typescript
await supabase.from('audit_logs').insert({
  user_email: 'admin@gruposmartlog.com.br',
  action: 'switch_organization',
  old_organization_id: previousOrgId,
  new_organization_id: newOrgId,
  new_environment_id: newEnvId,
  timestamp: new Date().toISOString(),
  ip_address: null,
  user_agent: navigator.userAgent
});
```

### 2. Indicador Visual

Adicionar badge no header quando super admin está logado:

```tsx
{user?.email === 'admin@gruposmartlog.com.br' && (
  <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
    <Shield className="w-4 h-4" />
    Super Admin Mode
  </div>
)}
```

### 3. Atalho para Trocar Contexto

Adicionar botão no header para trocar contexto sem fazer logout:

```tsx
{user?.email === 'admin@gruposmartlog.com.br' && (
  <button
    onClick={() => setShowOrganizationSelector(true)}
    className="..."
  >
    <RefreshCw className="w-4 h-4" />
    Trocar Organização
  </button>
)}
```

---

## Checklist de Implementação

- [ ] Adicionar estados no useAuth
- [ ] Modificar função login
- [ ] Adicionar handleOrganizationSelected
- [ ] Exportar novos estados/funções
- [ ] Importar OrganizationSelector no App.tsx
- [ ] Adicionar modal no JSX
- [ ] Testar login super admin
- [ ] Testar troca de contexto
- [ ] Testar login usuário regular
- [ ] Verificar isolamento de dados
- [ ] Implementar audit logs (opcional)
- [ ] Adicionar indicador visual (opcional)
- [ ] Adicionar atalho de troca (opcional)

---

## Comandos para Build

```bash
# Build do projeto
npm run build

# Verificar erros de TypeScript
npx tsc --noEmit

# Testar localmente
npm run dev
```

---

## Suporte

Em caso de dúvidas:
1. Consultar RELATORIO_SEGURANCA_MULTI_TENANT.md
2. Verificar logs no console do navegador
3. Verificar logs do Supabase
4. Testar queries manualmente no Supabase Dashboard

---

**Data de Criação:** 2026-02-13
**Versão:** 1.0
**Status:** Pronto para Implementação
