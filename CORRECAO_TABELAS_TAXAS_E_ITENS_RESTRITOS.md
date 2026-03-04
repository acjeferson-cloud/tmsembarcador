# Correção: Tabelas Taxas Adicionais e Itens Restritos

**Data:** 2026-03-03
**Status:** ✅ Concluído

## Problema Identificado

Duas funcionalidades do sistema estavam apresentando erro ao tentar salvar dados:

1. **Taxas Adicionais da Tabela de Frete** - Erro ao salvar taxas (TDA, TDE, TRT)
2. **Itens Restritos** - Erro ao cadastrar itens que não podem ser transportados

**Causa Raiz:** As tabelas `freight_rate_additional_fees` e `freight_rate_restricted_items` não existiam no banco de dados Supabase, apesar do código frontend estar implementado e pronto para usá-las.

## Solução Implementada

### 1. Criação das Tabelas no Banco de Dados

#### Tabela: `freight_rate_additional_fees`

Criada para armazenar taxas adicionais aplicáveis a tabelas de frete:

**Campos principais:**
- `id` - Identificador único (UUID)
- `freight_rate_table_id` - Referência à tabela de frete
- `freight_rate_id` - Referência opcional a uma tarifa específica
- `fee_type` - Tipo da taxa: 'TDA', 'TDE', ou 'TRT'
- `business_partner_id` - Filtro opcional por parceiro de negócios
- `consider_cnpj_root` - Se considera raiz do CNPJ
- `state_id` - Filtro opcional por estado
- `city_id` - Filtro opcional por cidade (código IBGE)
- `fee_value` - Valor da taxa
- `value_type` - Tipo: 'fixed', 'percent_weight', 'percent_value', 'percent_weight_value', 'percent_cte'
- `minimum_value` - Valor mínimo da taxa
- `organization_id` - Isolamento multi-tenant
- `environment_id` - Isolamento por ambiente

**Restrições:**
- Foreign keys para `freight_rate_tables`, `freight_rates`, `business_partners`, `states`
- Check constraints para validar `fee_type` e `value_type`

#### Tabela: `freight_rate_restricted_items`

Criada para armazenar itens que não podem ser transportados por determinado transportador:

**Campos principais:**
- `id` - Identificador único (UUID)
- `freight_rate_id` - Referência à tarifa de frete
- `item_code` - Código do item (máx. 50 caracteres)
- `item_description` - Descrição do item (máx. 200 caracteres)
- `ncm_code` - Código NCM opcional (máx. 50 caracteres)
- `ean_code` - Código EAN opcional (máx. 50 caracteres)
- `organization_id` - Isolamento multi-tenant
- `environment_id` - Isolamento por ambiente

**Restrições:**
- Foreign key para `freight_rates`
- Check constraints para limitar tamanho dos campos

### 2. Row Level Security (RLS)

Ambas as tabelas foram criadas com políticas RLS completas:

- **SELECT** - Permite leitura com contexto de organização e ambiente
- **INSERT** - Permite inserção validando organização e ambiente
- **UPDATE** - Permite atualização validando organização e ambiente
- **DELETE** - Permite exclusão validando organização e ambiente

As políticas funcionam tanto para usuários autenticados quanto anônimos (com contexto de sessão).

### 3. Índices de Performance

Criados índices para otimizar consultas:

**freight_rate_additional_fees:**
- `idx_freight_rate_additional_fees_table` - Por tabela de frete
- `idx_freight_rate_additional_fees_rate` - Por tarifa
- `idx_freight_rate_additional_fees_org_env` - Por organização e ambiente
- `idx_freight_rate_additional_fees_partner` - Por parceiro
- `idx_freight_rate_additional_fees_state` - Por estado

**freight_rate_restricted_items:**
- `idx_freight_rate_restricted_items_rate` - Por tarifa
- `idx_freight_rate_restricted_items_org_env` - Por organização e ambiente
- `idx_freight_rate_restricted_items_item_code` - Por código do item
- `idx_freight_rate_restricted_items_ncm` - Por código NCM

### 4. Atualização dos Serviços

Atualizados os serviços TypeScript para incluir os campos de multi-tenancy:

**additionalFeesService.ts:**
- Método `create()` agora inclui `organization_id` e `environment_id`

**restrictedItemsService.ts:**
- Método `create()` agora inclui `organization_id` e `environment_id`

## Arquivos Modificados

1. **Nova Migration:**
   - `supabase/migrations/YYYYMMDDHHMMSS_create_additional_fees_and_restricted_items_tables.sql`

2. **Serviços Atualizados:**
   - `src/services/additionalFeesService.ts`
   - `src/services/restrictedItemsService.ts`

## Componentes Que Agora Funcionam

1. **AdditionalFeesModal** (`src/components/FreightRates/AdditionalFeesModal.tsx`)
   - Permite criar/editar/excluir taxas adicionais por tabela de frete
   - Suporta filtros por parceiro, estado e cidade
   - Múltiplos tipos de cálculo de taxa

2. **RestrictedItemsModal** (`src/components/FreightRates/RestrictedItemsModal.tsx`)
   - Permite cadastrar itens restritos por transportador
   - Busca por código, NCM ou EAN
   - Sistema de bloqueio automático para cotações e coletas

## Testes Realizados

✅ Build do projeto executado com sucesso
✅ Migration aplicada no banco de dados Supabase
✅ Tabelas criadas com todas as constraints
✅ RLS policies configuradas corretamente
✅ Índices criados para otimização

## Uso das Funcionalidades

### Taxas Adicionais

Acesse através de: **Cadastros > Transportadores > Tabelas de Frete > [Tabela] > Taxas Adicionais**

Permite configurar:
- TDA (Taxa de Dificuldade de Acesso)
- TDE (Taxa de Dificuldade de Entrega)
- TRT (Taxa de Restrição de Trânsito)

Com filtros específicos por parceiro, estado e cidade.

### Itens Restritos

Acesse através de: **Cadastros > Transportadores > Tabelas de Frete > [Tarifa] > Itens Restritos**

Permite bloquear itens específicos que não podem ser transportados, com identificação por:
- Código do item
- NCM
- EAN
- Descrição

## Observações

- As tabelas seguem o padrão multi-tenant do sistema
- Todas as operações respeitam o isolamento por organização e ambiente
- Os dados são protegidos por RLS policies rigorosas
- A solução está pronta para produção
