# Painel Administrativo Global (SaaS Admin Console)

## Visão Geral

O **SaaS Admin Console** é um painel administrativo centralizado para gerenciar todo o ambiente multi-tenant do TMS Embarcador. Ele fornece controle completo sobre clientes (tenants), bases de dados, métricas, logs e operações críticas do SaaS.

## Características Principais

### 1. Dashboard de Saúde do Sistema
- Visão geral do status de todos os tenants
- Indicadores de saúde e performance
- Alertas ativos e críticos
- Métricas em tempo real

### 2. Gestão de Clientes (Tenants)
- **CRUD Completo**: Criar, editar, visualizar e excluir clientes
- **Planos**: Free, Basic, Professional, Enterprise
- **Status**: Ativo, Trial, Suspenso, Bloqueado, Inativo
- **Limites**: Controle de usuários, estabelecimentos, storage e API calls
- **Contatos**: Gerenciamento de contatos por cliente

### 3. Monitoramento e Métricas
- Uso de API por tenant
- Consumo de storage
- Usuários ativos
- Performance das bases de dados
- Alertas configuráveis

### 4. Logs de Auditoria
- Registro completo de todas as ações administrativas
- Filtros por tenant, ação, recurso e período
- Rastreamento de alterações (changelog)
- Exportação de logs

### 5. Gestão Multi-Ambiente
- **Produção**: Ambiente de produção
- **Homologação**: Ambiente de testes
- **Sandbox**: Ambiente de desenvolvimento

## Estrutura do Banco de Dados

### Tabelas Principais

#### Planos e Tenants
- `saas_plans` - Planos disponíveis
- `saas_tenants` - Clientes/empresas
- `saas_tenant_limits` - Limites por tenant
- `saas_tenant_contacts` - Contatos dos clientes

#### Ambientes e Bases
- `saas_environments` - Ambientes (Prod, Staging, Sandbox)
- `saas_databases` - Bases de dados dos tenants
- `saas_database_connections` - Status de conexão

#### Versionamento
- `saas_versions` - Versões do sistema
- `saas_tenant_versions` - Versão atual de cada tenant
- `saas_version_rollouts` - Histórico de atualizações

#### Monitoramento
- `saas_metrics` - Métricas de uso
- `saas_health_checks` - Status de saúde
- `saas_alerts` - Alertas e notificações

#### Backups
- `saas_backups` - Backups agendados
- `saas_backup_restores` - Histórico de restaurações

#### Integrações
- `saas_integrations` - Integrações disponíveis
- `saas_tenant_integrations` - Integrações por tenant

#### Auditoria
- `saas_admin_users` - Administradores globais
- `saas_admin_logs` - Logs de ações administrativas

## Acessando o Console

### Requisitos de Acesso
- Usuário com perfil `administrador`
- Permissão `admin` configurada no menu

### Como Acessar
1. Faça login com um usuário administrador
2. No menu lateral, procure por **"SaaS Admin Console"** (ícone de escudo)
3. Clique para acessar o painel

## Funcionalidades por Aba

### 📊 Dashboard
- Estatísticas gerais do SaaS
- Status de saúde do sistema
- Clientes recentes
- Alertas ativos

### 👥 Clientes (Tenants)
- Lista completa de clientes
- Criar novo cliente
- Editar informações do cliente
- Alterar plano e status
- Excluir cliente

### 💾 Bases de Dados
_(Em desenvolvimento)_
- Listar todas as bases
- Status de conexão
- Provisionamento automático
- Migração de dados

### 📈 Métricas
_(Em desenvolvimento)_
- Uso de API por tenant
- Consumo de storage
- Performance
- Gráficos e tendências

### 📝 Logs de Auditoria
- Histórico completo de ações
- Filtros por ação, recurso e período
- Visualização de alterações
- Exportação de logs

### ⚠️ Alertas
_(Em desenvolvimento)_
- Alertas críticos
- Notificações do sistema
- Configuração de alertas

### ⚙️ Configurações
_(Em desenvolvimento)_
- Configurações globais do SaaS
- Integrações
- Backups
- Versionamento

## Planos Disponíveis

### Free
- **Preço**: Gratuito
- **Usuários**: 2
- **Estabelecimentos**: 1
- **Storage**: 1 GB
- **API Calls/Mês**: 1.000

### Basic
- **Preço**: R$ 99,90/mês
- **Usuários**: 5
- **Estabelecimentos**: 3
- **Storage**: 10 GB
- **API Calls/Mês**: 10.000

### Professional
- **Preço**: R$ 299,90/mês
- **Usuários**: 20
- **Estabelecimentos**: 10
- **Storage**: 50 GB
- **API Calls/Mês**: 50.000

### Enterprise
- **Preço**: R$ 999,90/mês
- **Recursos**: Ilimitados
- **SLA**: Garantido
- **Suporte**: 24/7

## Segurança

### Row Level Security (RLS)
Todas as tabelas possuem RLS habilitado com políticas restritivas:
- Apenas usuários com `perfil = 'administrador'` têm acesso
- Logs de auditoria registram todas as ações
- Dados sensíveis são protegidos

### Auditoria
Todas as operações administrativas são registradas:
- Criação, edição e exclusão de tenants
- Alterações de configurações
- Acesso a dados sensíveis
- Exportação de informações

## API e Serviços

### Serviços TypeScript

#### saasTenantsService
```typescript
- getPlans() // Lista planos disponíveis
- getTenants() // Lista todos os tenants
- createTenant() // Cria novo tenant
- updateTenant() // Atualiza tenant
- deleteTenant() // Exclui tenant
- getTenantLimits() // Busca limites do tenant
- updateTenantLimit() // Atualiza limite
```

#### saasMetricsService
```typescript
- getMetrics() // Busca métricas
- getMetricsSummary() // Resumo de métricas
- getHealthChecks() // Status de saúde
- getAlerts() // Lista alertas
- createAlert() // Cria alerta
- updateAlertStatus() // Atualiza status do alerta
```

#### saasAdminLogsService
```typescript
- getLogs() // Busca logs com filtros
- createLog() // Cria novo log
- logAction() // Registra ação administrativa
```

## Dados de Demonstração

Um tenant de demonstração foi criado para testes:
- **Código**: DEMO001
- **Empresa**: Empresa Demonstração LTDA
- **Plano**: Professional
- **Status**: Ativo

## Próximas Funcionalidades

### Em Desenvolvimento
- [ ] Gestão completa de bases de dados
- [ ] Provisionamento automático
- [ ] Sistema de backups
- [ ] Versionamento e rollout
- [ ] Métricas avançadas com gráficos
- [ ] Sistema de alertas configurável
- [ ] Integrações por tenant
- [ ] Gestão de múltiplos ambientes

### Planejadas
- [ ] Dashboard de billing
- [ ] Relatórios de uso
- [ ] API pública para integrações
- [ ] Webhooks para eventos
- [ ] Sistema de notificações
- [ ] Automação de tarefas

## Suporte

Para dúvidas ou problemas relacionados ao SaaS Admin Console:
1. Verifique os logs de auditoria
2. Consulte a documentação
3. Entre em contato com o administrador do sistema

---

**Versão**: 1.0.0
**Data**: Dezembro 2025
**Status**: Em Produção
