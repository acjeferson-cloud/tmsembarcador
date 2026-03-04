# TMS Embarcador - Database Documentation

## Visão Geral

Este documento descreve a estrutura completa do banco de dados do sistema TMS Embarcador Smart Log, um sistema de gestão de transporte multi-tenant construído sobre o Supabase PostgreSQL.

## Arquivos Gerados

### 1. Script SQL Completo
**Arquivo:** `database/tmsembarcador_complete.sql`

Este arquivo contém todo o schema do banco de dados, incluindo:
- Definição de todas as tabelas
- Índices para otimização de performance
- Políticas RLS (Row Level Security) para segurança
- Triggers e funções
- Dados iniciais para demonstração

### 2. Tipos TypeScript
**Arquivo:** `src/types/database.types.ts`

Arquivo TypeScript com todas as interfaces e tipos do banco de dados, incluindo:
- Tipos para cada tabela
- Tipos Insert (para criação)
- Tipos Update (para atualização)
- Tipos de retorno de funções

## Estrutura do Banco de Dados

### 1. Estrutura Base Multi-Tenant

#### saas_plans
Planos de assinatura disponíveis no sistema.

**Campos principais:**
- `nome` - Nome do plano
- `valor_mensal` - Valor da mensalidade
- `max_users` - Máximo de usuários permitidos
- `max_establishments` - Máximo de estabelecimentos
- `features` - Features do plano (JSONB)

#### saas_organizations
Organizações (empresas clientes) que usam o sistema.

**Campos principais:**
- `codigo` - Código único da organização
- `nome` - Nome da empresa
- `cnpj` - CNPJ da empresa
- `status` - Status (ativo, inativo, suspenso, cancelado)
- `plan_id` - Referência ao plano contratado

#### saas_environments
Ambientes dentro de cada organização (produção, homologação, teste).

**Campos principais:**
- `organization_id` - Referência à organização
- `codigo` - Código do ambiente (ex: PROD, HOMOL)
- `tipo` - Tipo do ambiente
- `status` - Status do ambiente

#### saas_admins
Administradores do sistema SaaS (super admins).

**Campos principais:**
- `email` - Email do admin
- `senha_hash` - Senha criptografada (SHA-256)
- `nome` - Nome do administrador

### 2. Usuários e Estabelecimentos

#### users
Usuários do sistema dentro de cada organização/ambiente.

**Campos principais:**
- `organization_id` - Organização do usuário
- `environment_id` - Ambiente do usuário
- `email` - Email (único)
- `senha_hash` - Senha criptografada (SHA-256)
- `tipo` - Tipo (admin, user, viewer, saas_admin)
- `bloqueado` - Indica se está bloqueado
- `tentativas_login` - Contador de tentativas falhas

**Segurança:**
- Bloqueio automático após 5 tentativas falhas
- Funções para validação de credenciais
- Tracking de último login e IP

#### establishments
Estabelecimentos/filiais dentro de cada organização.

**Campos principais:**
- `organization_id` - Organização
- `environment_id` - Ambiente
- `codigo` - Código único (ex: 0001, 0002)
- `tipo` - Tipo (matriz, filial)
- `cnpj` - CNPJ do estabelecimento

**Nota:** Cada novo ambiente cria automaticamente o estabelecimento 0001.

#### user_establishments
Relação entre usuários e estabelecimentos (N:N).

**Campos principais:**
- `user_id` - Usuário
- `establishment_id` - Estabelecimento
- `is_default` - Se é o estabelecimento padrão

### 3. Cadastros Básicos

#### carriers
Transportadoras cadastradas.

**Campos principais:**
- `codigo` - Código da transportadora
- `nome_fantasia` - Nome fantasia
- `cnpj` - CNPJ
- `prazo_coleta` - Prazo padrão de coleta (dias)
- `prazo_entrega` - Prazo padrão de entrega (dias)
- `nps_interno` - NPS interno da transportadora

#### business_partners
Parceiros de negócio (clientes/fornecedores).

**Campos principais:**
- `codigo` - Código do parceiro
- `tipo` - Tipo (cliente, fornecedor, ambos)
- `tipo_pessoa` - Tipo (fisica, juridica)
- `razao_social` - Razão social
- `limite_credito` - Limite de crédito

#### rejection_reasons
Motivos de rejeição (coletas, entregas, etc).

**Campos principais:**
- `codigo` - Código do motivo
- `descricao` - Descrição
- `tipo` - Tipo (fatura, cte, coleta, entrega, geral)
- `requer_foto` - Se exige foto
- `requer_assinatura` - Se exige assinatura

#### occurrences
Ocorrências de transporte.

**Campos principais:**
- `codigo` - Código da ocorrência
- `descricao` - Descrição
- `tipo` - Tipo (coleta, transporte, entrega, geral)
- `impacta_prazo` - Se impacta o prazo
- `dias_impacto` - Dias de impacto no prazo

### 4. Operações

#### orders
Pedidos/ordens de transporte.

**Campos principais:**
- `numero_pedido` - Número do pedido
- `tipo` - Tipo (entrada, saida, transferencia)
- `status` - Status (pendente, processando, coletado, em_transito, entregue, cancelado)
- `business_partner_id` - Parceiro de negócio
- `carrier_id` - Transportadora
- Campos de origem e destino completos
- Valores (mercadoria, frete, seguro, total)
- Pesos e volumes
- `codigo_rastreio` - Código de rastreamento

#### invoices
Notas fiscais eletrônicas (NFe).

**Campos principais:**
- `numero` - Número da nota
- `serie` - Série da nota
- `chave_acesso` - Chave de acesso (44 dígitos)
- `tipo` - Tipo (entrada, saida)
- `modelo` - Modelo (55, 65, etc)
- `order_id` - Pedido relacionado
- Dados do emitente e destinatário
- Valores fiscais (ICMS, IPI, PIS, COFINS)
- `xml_content` - Conteúdo do XML
- `xml_processado` - Se já foi processado

#### ctes
Conhecimentos de transporte eletrônico.

**Campos principais:**
- `numero` - Número do CTe
- `serie` - Série
- `chave_acesso` - Chave de acesso
- `invoice_id` - Nota fiscal relacionada
- `carrier_id` - Transportadora
- `status` - Status (pendente, autorizado, cancelado, denegado, rejeitado)
- `divergencia_valores` - Se há divergência de valores
- `valor_divergencia` - Valor da divergência
- `xml_content` - XML do CTe

#### pickups
Coletas agendadas.

**Campos principais:**
- `numero_coleta` - Número da coleta
- `carrier_id` - Transportadora
- `protocolo_transportadora` - Protocolo da transportadora
- `data_agendada` - Data agendada
- `hora_inicio` / `hora_fim` - Janela de coleta
- `status` - Status (solicitada, agendada, em_coleta, coletada, cancelada, rejeitada)
- Dados do endereço de coleta
- Dados do contato
- `comprovante_foto` - Foto do comprovante
- `comprovante_assinatura` - Assinatura digital

#### pickup_invoices
Relação entre coletas e notas fiscais (N:N).

### 5. Tabelas de Frete e Cálculo

#### freight_rates
Tabelas de frete cadastradas.

**Campos principais:**
- `codigo` - Código da tabela
- `nome` - Nome da tabela
- `carrier_id` - Transportadora
- `tipo` - Tipo (peso, valor, volume, misto)
- `data_inicio` / `data_fim` - Vigência
- `peso_minimo` / `peso_maximo` - Limites
- `cubagem_fator` - Fator de cubagem (padrão 300)
- Alíquotas (ICMS, pedágio, GRIS, TDE)

#### freight_rate_values
Valores das tabelas de frete.

**Campos principais:**
- `freight_rate_id` - Tabela de frete
- Faixas de peso ou valor
- `valor_fixo` - Valor fixo
- `valor_kg` - Valor por kg
- `valor_percentual` - Valor percentual
- `prazo_dias` - Prazo em dias

#### freight_rate_cities
Cidades atendidas e exceções.

**Campos principais:**
- `freight_rate_id` - Tabela de frete
- Origem (cidade, estado, CEP)
- Destino (cidade, estado, CEP)
- `valor_adicional` - Valor adicional
- `percentual_adicional` - Percentual adicional
- `prazo_adicional` - Dias adicionais

#### additional_fees
Taxas adicionais.

**Campos principais:**
- `nome` - Nome da taxa
- `codigo` - Código
- `tipo` - Tipo (fixo, percentual, por_kg, por_volume)
- `valor` / `percentual` - Valores
- `aplica_automaticamente` - Se aplica automaticamente
- `obrigatorio` - Se é obrigatória

#### restricted_items
Itens restritos para transporte.

**Campos principais:**
- `descricao` - Descrição do item
- `codigo_ncm` - Código NCM
- `tipo_restricao` - Tipo (proibido, condicional, taxa_adicional)
- `valor_taxa_adicional` - Taxa adicional se aplicável

#### freight_quotes
Cotações de frete realizadas.

**Campos principais:**
- `numero_cotacao` - Número da cotação
- Origem e destino
- Peso, valor, volumes
- `resultados` - Resultados (JSONB)
- `melhor_opcao_id` - Melhor opção encontrada
- `status` - Status (processando, concluida, erro)

### 6. Configurações e Integrações

#### whatsapp_config
Configuração da integração WhatsApp.

**Campos principais:**
- `api_url` - URL da API
- `api_key` - Chave da API
- `phone_number` - Número de telefone
- Controles de saldo e consumo

#### whatsapp_transactions
Log de transações WhatsApp.

**Campos principais:**
- `tipo` - Tipo (mensagem, midia, template)
- `destinatario` - Destinatário
- `status` - Status
- `custo` - Custo da transação

#### openai_config
Configuração da integração OpenAI.

**Campos principais:**
- `api_key` - Chave da API
- `modelo` - Modelo (gpt-4, gpt-3.5-turbo, etc)
- `temperatura` - Temperatura (0-1)
- `max_tokens` - Máximo de tokens
- Controles de saldo e consumo

#### openai_transactions
Log de transações OpenAI.

**Campos principais:**
- `tipo` - Tipo (completion, chat, embedding, analise)
- `prompt` - Prompt enviado
- `resposta` - Resposta recebida
- Contadores de tokens
- `custo` - Custo da transação

#### google_maps_config
Configuração Google Maps API.

**Campos principais:**
- `api_key` - Chave da API
- Controles de saldo e consumo

#### google_maps_transactions
Log de transações Google Maps.

**Campos principais:**
- `tipo` - Tipo (geocoding, distance, directions, places)
- `origem` / `destino` - Origem e destino
- `resultado` - Resultado (JSONB)
- `custo` - Custo da transação

#### nps_config
Configuração de pesquisas NPS.

**Campos principais:**
- `enviar_automaticamente` - Envio automático
- `dias_apos_entrega` - Dias após entrega para enviar
- `pergunta_principal` - Pergunta principal
- `pergunta_complementar` - Pergunta complementar
- Templates de email e WhatsApp

#### nps_surveys
Pesquisas NPS enviadas.

**Campos principais:**
- `order_id` - Pedido relacionado
- `carrier_id` - Transportadora avaliada
- `nota` - Nota (0-10)
- `comentario` - Comentário
- `tipo_cliente` - Tipo (detrator, neutro, promotor)
- `status` - Status (enviada, respondida, expirada)

#### nps_responses
Respostas detalhadas das pesquisas NPS.

**Campos principais:**
- `nps_survey_id` - Pesquisa relacionada
- `pergunta` - Pergunta
- `resposta` - Resposta

#### email_outgoing_config
Configuração de email SMTP.

**Campos principais:**
- `smtp_host` - Host SMTP
- `smtp_port` - Porta SMTP
- `smtp_user` - Usuário
- `smtp_password` - Senha
- `from_email` / `from_name` - Remetente

### 7. Dados Auxiliares

#### countries
Países.

**Campos principais:**
- `codigo` - Código (BR, US, etc)
- `nome` - Nome
- `sigla_iso2` / `sigla_iso3` - Siglas ISO
- `codigo_telefone` - DDI

#### states
Estados/Províncias.

**Campos principais:**
- `country_id` - País
- `codigo` - Código
- `nome` - Nome
- `sigla` - Sigla (SP, RJ, etc)
- `regiao` - Região (Sudeste, Sul, etc)

#### cities
Cidades.

**Campos principais:**
- `state_id` - Estado
- `codigo_ibge` - Código IBGE
- `nome` - Nome
- `latitude` / `longitude` - Coordenadas
- `populacao` - População
- `area_km2` - Área em km²

#### holidays
Feriados.

**Campos principais:**
- `nome` - Nome do feriado
- `data` - Data
- `tipo` - Tipo (nacional, estadual, municipal, opcional)
- `country_id` / `state_id` / `city_id` - Localização
- `recorrente` - Se repete anualmente

#### change_logs
Histórico de mudanças do sistema.

**Campos principais:**
- `versao` - Versão
- `data_lancamento` - Data de lançamento
- `tipo` - Tipo (feature, bugfix, improvement, breaking)
- `titulo` - Título
- `descricao` - Descrição
- `impacto` - Impacto (baixo, medio, alto, critico)
- `publicado` - Se está publicado

#### api_keys
Chaves de API para integrações.

**Campos principais:**
- `nome` - Nome da chave
- `chave` - Chave (única)
- `prefixo` - Prefixo da chave
- `tipo` - Tipo (api, webhook, integracao)
- `permissoes` - Permissões (JSONB)
- `expira_em` - Data de expiração
- `ip_whitelist` - IPs permitidos (JSONB)

#### licenses
Licenças das organizações.

**Campos principais:**
- `organization_id` - Organização
- `tipo` - Tipo (trial, basic, professional, enterprise, custom)
- `data_inicio` / `data_fim` - Vigência
- `max_users` - Máximo de usuários
- `max_establishments` - Máximo de estabelecimentos
- `max_orders_month` - Máximo de pedidos por mês
- `features` - Features (JSONB)

#### white_label_config
Configuração de marca branca.

**Campos principais:**
- `organization_id` - Organização
- `nome_aplicacao` - Nome da aplicação
- `logo_url` - URL do logo
- `favicon_url` - URL do favicon
- Cores (primária, secundária, destaque)
- `dominio_customizado` - Domínio customizado
- Dados de contato

## Segurança

### Row Level Security (RLS)

Todas as tabelas possuem RLS habilitado com políticas específicas:

1. **Dados Públicos (para login)**
   - `saas_organizations`
   - `saas_environments`
   - `users`
   - `establishments`

2. **Dados Geográficos (públicos)**
   - `countries`
   - `states`
   - `cities`

3. **Dados Multi-Tenant**
   - Todas as demais tabelas têm isolamento por `organization_id` e `environment_id`
   - Políticas impedem acesso cruzado entre organizações

### Funções de Segurança

#### validate_user_credentials
Valida email e senha do usuário.
```sql
SELECT * FROM validate_user_credentials('email@example.com', 'senha');
```

#### check_user_blocked
Verifica se usuário está bloqueado.
```sql
SELECT check_user_blocked('email@example.com');
```

#### increment_login_attempts
Incrementa tentativas de login falhas.
```sql
SELECT increment_login_attempts('email@example.com');
```

#### reset_login_attempts
Reseta tentativas após login bem-sucedido.
```sql
SELECT reset_login_attempts('email@example.com', '192.168.1.1');
```

#### get_user_organizations_environments
Retorna organizações e ambientes do usuário.
```sql
SELECT * FROM get_user_organizations_environments('email@example.com');
```

#### get_user_establishments
Retorna estabelecimentos do usuário.
```sql
SELECT * FROM get_user_establishments(user_id, org_id, env_id);
```

## Dados Iniciais

O script cria automaticamente:

### Plano Demo
- Nome: "Demonstração"
- Valor: R$ 0,00
- 5 usuários
- 3 estabelecimentos

### Organização Demo
- Código: `DEMO001`
- Nome: "Empresa Demonstração"
- CNPJ: 00.000.000/0001-00

### Ambiente Produção
- Código: `PROD`
- Tipo: produção

### Usuário Admin
- Email: `admin@demo.com`
- Senha: `Demo@123`
- Tipo: admin

### Estabelecimento Matriz
- Código: `0001`
- Nome: "Matriz Demonstração"
- Tipo: matriz

### Dados Geográficos
- País: Brasil
- 9 Estados principais (SP, RJ, MG, RS, PR, SC, BA, PE, CE)

## Índices e Performance

Todos os campos chave possuem índices:
- Códigos únicos (organizações, ambientes, estabelecimentos)
- Foreign keys
- Campos de busca frequente (status, datas, etc)
- Campos de filtro (organization_id, environment_id)

## Triggers

Todas as tabelas possuem trigger `update_updated_at_column` que atualiza automaticamente o campo `updated_at` em qualquer UPDATE.

## Como Usar

### 1. Criar o Banco de Dados

Execute o script completo:
```bash
psql -U postgres -d tmsembarcador < database/tmsembarcador_complete.sql
```

Ou no Supabase SQL Editor, copie e cole o conteúdo do arquivo.

### 2. Importar os Tipos TypeScript

```typescript
import type { Database, User, Order, Invoice } from '@/types/database.types';

// Usando com Supabase Client
import { createClient } from '@supabase/supabase-js';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Query tipada
const { data: users } = await supabase
  .from('users')
  .select('*')
  .eq('ativo', true);
```

### 3. Fazer Login

```typescript
// Validar credenciais
const { data } = await supabase.rpc('validate_user_credentials', {
  p_email: 'admin@demo.com',
  p_senha: 'Demo@123'
});

if (data && data.length > 0) {
  const user = data[0];
  console.log('Login bem-sucedido:', user);

  // Resetar tentativas
  await supabase.rpc('reset_login_attempts', {
    p_email: 'admin@demo.com',
    p_ip: '192.168.1.1'
  });
}
```

### 4. Listar Organizações do Usuário

```typescript
const { data: orgsEnvs } = await supabase.rpc('get_user_organizations_environments', {
  p_email: 'admin@demo.com'
});

console.log('Organizações e Ambientes:', orgsEnvs);
```

### 5. Listar Estabelecimentos

```typescript
const { data: establishments } = await supabase.rpc('get_user_establishments', {
  p_user_id: userId,
  p_organization_id: orgId,
  p_environment_id: envId
});

console.log('Estabelecimentos:', establishments);
```

## Estrutura de Pastas Recomendada

```
project/
├── database/
│   ├── tmsembarcador_complete.sql   # Script SQL completo
│   └── README.md                     # Esta documentação
├── src/
│   ├── types/
│   │   └── database.types.ts        # Tipos TypeScript
│   └── lib/
│       └── supabase.ts              # Cliente Supabase
└── ...
```

## Manutenção

### Backup
```bash
pg_dump -U postgres tmsembarcador > backup_$(date +%Y%m%d).sql
```

### Restore
```bash
psql -U postgres -d tmsembarcador < backup_20260220.sql
```

## Suporte

Para dúvidas ou problemas:
1. Verifique esta documentação
2. Consulte os tipos TypeScript gerados
3. Revise as políticas RLS no script SQL
4. Teste as funções no SQL Editor do Supabase

---

**Última atualização:** 2026-02-20
**Versão do Schema:** 1.0.0
