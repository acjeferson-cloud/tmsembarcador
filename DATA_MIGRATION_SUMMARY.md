# Data Migration to Cloud SQL - Summary

## Quick Overview

Scripts de UPDATE gerados com sucesso para migração de dados do Supabase para o Google Cloud SQL, incluindo configuração multi-tenant.

## Arquivos Criados

1. **`cloudsql_data_migration_updates.sql`** (517 linhas)
   - 48 comandos UPDATE
   - Atualiza 47 tabelas com dados
   - Adiciona organization_id e environment_id em ~1,859 registros

2. **`DATA_MIGRATION_GUIDE.md`** (Guia completo)
   - Passo a passo da migração
   - Troubleshooting
   - Exemplos de código
   - Checklist de validação

## Estatísticas dos Dados

### Tabelas com Registros (47 tabelas)

| Tabela | Registros | Seção |
|--------|-----------|-------|
| `zip_code_ranges` | 369 | Geografia |
| `invoices_nfe` | 235 | Notas Fiscais |
| `countries` | 196 | Geografia |
| `ctes_complete` | 192 | CT-e |
| `orders` | 102 | Pedidos |
| `freight_rate_details` | 88 | Tabelas de Frete |
| `freight_quotes_history` | 70 | Cotações |
| `nps_pesquisas_cliente` | 69 | NPS |
| `occurrences` | 68 | Ocorrências |
| `rejection_reasons` | 46 | Motivos de Rejeição |
| `business_partner_contacts` | 46 | Contatos |
| `cities` | 40 | Geografia |
| Outras 35 tabelas | 278 | Diversos |
| **TOTAL** | **~1,859** | **47 tabelas** |

### Distribuição por Categoria

```
Geografia................. 656 registros (5 tabelas)
Notas Fiscais............ 235 registros (1 tabela)
CT-e..................... 192 registros (1 tabela)
Pedidos.................. 210 registros (5 tabelas)
Tabelas de Frete......... 113 registros (4 tabelas)
NPS...................... 94 registros (3 tabelas)
Transportadoras.......... 126 registros (3 tabelas)
Parceiros de Negócio..... 74 registros (3 tabelas)
Outros................... 159 registros (22 tabelas)
```

## O Que os Scripts Fazem

### Para Cada Tabela com Dados

Os scripts executam UPDATEs para adicionar:

```sql
UPDATE nome_da_tabela
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',  -- Organização "Demonstração"
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'    -- Ambiente "Produção"
WHERE organization_id IS NULL OR environment_id IS NULL;
```

### IDs Padrão Utilizados

**Organização Principal:**
- Nome: "Demonstração"
- ID: `8b007dd0-0db6-4288-a1c1-7b05ffb7b32e`
- Slug: `00000001`

**Ambiente Principal:**
- Nome: "Produção"
- ID: `abe69012-4449-4946-977e-46af45790a43`
- Slug: `production`

### Outras Organizações Disponíveis

1. **Segundo cliente** (`00000003`)
   - ID: `ac730ac4-2f10-4fb6-acc3-8325cb51ebc6`

2. **Quimidrol** (`00000002`)
   - ID: `4ca4fdaa-5f55-48be-9195-3bc14413cb06`

## Como Executar

### Passo 1: Prepare o Cloud SQL

```bash
# Se ainda não criou a instância
gcloud sql instances create tms-production \
  --database-version=POSTGRES_15 \
  --tier=db-custom-4-16384 \
  --region=us-central1

# Crie o banco
gcloud sql databases create tms --instance=tms-production
```

### Passo 2: Aplique o Schema

```bash
# Obtenha o IP
CLOUD_SQL_IP=$(gcloud sql instances describe tms-production \
  --format="value(ipAddresses[0].ipAddress)")

# Aplique o schema Cloud SQL
psql -h $CLOUD_SQL_IP -U postgres -d tms \
  -f full_schema_cloudsql.sql
```

### Passo 3: Importe os Dados

```bash
# Primeiro, exporte do Supabase
pg_dump -h db.xxxxx.supabase.co \
  -U postgres \
  -d postgres \
  --data-only \
  --column-inserts \
  -f supabase_data.sql

# Depois importe no Cloud SQL
psql -h $CLOUD_SQL_IP -U postgres -d tms \
  -f supabase_data.sql
```

### Passo 4: Execute os UPDATEs

```bash
# Aplique os updates para adicionar organization_id e environment_id
psql -h $CLOUD_SQL_IP -U postgres -d tms \
  -f cloudsql_data_migration_updates.sql
```

### Passo 5: Valide

```sql
-- Conecte ao Cloud SQL
psql -h $CLOUD_SQL_IP -U postgres -d tms

-- Verifique se os updates funcionaram
SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE organization_id IS NOT NULL) as com_org_id,
  COUNT(*) FILTER (WHERE organization_id IS NULL) as sem_org_id
FROM orders;

-- Deve mostrar:
-- total | com_org_id | sem_org_id
--  102  |    102     |     0
```

## Tabelas Atualizadas por Seção

### 1. Configuração (4 tabelas)
- ✅ saas_plans (4 registros)
- ✅ saas_admins (1 registro)
- ✅ saas_admin_users (1 registro)
- ✅ organization_settings (3 registros)

### 2. Geografia (5 tabelas)
- ✅ countries (196 registros)
- ✅ states (27 registros)
- ✅ cities (40 registros)
- ✅ zip_code_ranges (369 registros)
- ✅ holidays (24 registros)

### 3. Gestão de Usuários (4 tabelas)
- ✅ establishments (7 registros)
- ✅ users (15 registros)
- ✅ licenses (1 registro)
- ✅ license_logs (21 registros)

### 4. Parceiros de Negócio (3 tabelas)
- ✅ business_partners (14 registros)
- ✅ business_partner_addresses (14 registros)
- ✅ business_partner_contacts (46 registros)

### 5. Transportadoras (3 tabelas)
- ✅ carriers (12 registros)
- ✅ occurrences (68 registros)
- ✅ rejection_reasons (46 registros)

### 6. Tabelas de Frete (4 tabelas)
- ✅ freight_rate_tables (5 registros)
- ✅ freight_rates (11 registros)
- ✅ freight_rate_details (88 registros)
- ✅ freight_rate_cities (9 registros)

### 7. Pedidos (5 tabelas)
- ✅ orders (102 registros)
- ✅ order_items (19 registros)
- ✅ order_delivery_status (8 registros)
- ✅ pickups (11 registros)
- ✅ freight_quotes_history (70 registros)

### 8. Notas e Faturas (3 tabelas)
- ✅ invoices (12 registros)
- ✅ invoices_nfe (235 registros)
- ✅ bills (11 registros)

### 9. CT-e (1 tabela)
- ✅ ctes_complete (192 registros)

### 10. Logística Reversa (1 tabela)
- ✅ reverse_logistics (30 registros)

### 11. Sistema NPS (3 tabelas)
- ✅ nps_config (1 registro)
- ✅ nps_pesquisas_cliente (69 registros)
- ✅ nps_avaliacoes_internas (24 registros)

### 12. Chaves API (1 tabela)
- ✅ api_keys_config (6 registros)

### 13. Configurações de Integração (5 tabelas)
- ✅ email_outgoing_config (1 registro)
- ✅ google_maps_config (4 registros)
- ✅ openai_config (4 registros)
- ✅ whatsapp_config (3 registros)
- ✅ whatsapp_templates (7 registros)

### 14. Auditoria e Logs (2 tabelas)
- ✅ change_logs (20 registros)
- ✅ xml_auto_import_logs (11 registros)

### 15. Inovação e Feedback (2 tabelas)
- ✅ innovations (6 registros)
- ✅ user_innovations (6 registros)

### 16. Deploy Tracking (1 tabela)
- ✅ deploy_projects (1 registro)

## Personalização dos Scripts

### Se Precisar Usar Outra Organização

Edite o arquivo `cloudsql_data_migration_updates.sql` e substitua:

```sql
-- Substituir este ID:
'8b007dd0-0db6-4288-a1c1-7b05ffb7b32e'

-- Por um destes:
'ac730ac4-2f10-4fb6-acc3-8325cb51ebc6'  -- Segundo cliente
'4ca4fdaa-5f55-48be-9195-3bc14413cb06'  -- Quimidrol
```

### Se Precisar Distribuir Dados Entre Organizações

Exemplo: Separar pedidos por CNPJ do estabelecimento

```sql
-- Primeiro, execute o update padrão
\i cloudsql_data_migration_updates.sql

-- Depois, reatribua pedidos específicos
UPDATE orders o
SET organization_id = '4ca4fdaa-5f55-48be-9195-3bc14413cb06',
    environment_id = '07f23b7e-471d-4968-a5fe-fd388e739780'
FROM establishments e
WHERE o.establishment_id = e.id
  AND e.cnpj = '12345678000190';  -- CNPJ específico
```

## Verificações Importantes

### Após Executar os UPDATEs

```sql
-- 1. Verificar se todas as tabelas foram atualizadas
SELECT
  t.tablename,
  COUNT(*) FILTER (WHERE organization_id IS NULL) as sem_org,
  COUNT(*) as total
FROM pg_tables t
CROSS JOIN LATERAL (
  EXECUTE format('SELECT organization_id FROM %I.%I',
    t.schemaname, t.tablename)
) data
WHERE t.schemaname = 'public'
  AND EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_name = t.tablename
      AND c.column_name = 'organization_id'
  )
GROUP BY t.tablename
HAVING COUNT(*) FILTER (WHERE organization_id IS NULL) > 0;

-- Deve retornar 0 linhas (sem tabelas com NULL)

-- 2. Contar registros por organização
SELECT
  o.name as organizacao,
  COUNT(DISTINCT ord.id) as pedidos,
  COUNT(DISTINCT nfe.id) as notas_fiscais,
  COUNT(DISTINCT cte.id) as ctes
FROM organizations o
LEFT JOIN orders ord ON ord.organization_id = o.id
LEFT JOIN invoices_nfe nfe ON nfe.organization_id = o.id
LEFT JOIN ctes_complete cte ON cte.organization_id = o.id
GROUP BY o.id, o.name
ORDER BY pedidos DESC;
```

## Impacto no Sistema

### RLS (Row Level Security)

Após os updates, as políticas RLS garantirão:

1. **Isolamento de Dados**: Cada organização vê apenas seus próprios dados
2. **Segurança Multi-tenant**: Impossível acessar dados de outra organização
3. **Ambientes Separados**: Produção, staging, sandbox isolados

### Queries no Código

Seu código precisará definir o contexto antes de cada query:

```javascript
// Antes de cada query
await client.query(`
  SET LOCAL app.organization_id = '${organizationId}';
  SET LOCAL app.environment_id = '${environmentId}';
`);

// Agora queries retornam apenas dados da organização/ambiente
const orders = await client.query('SELECT * FROM orders');
```

## Tempo Estimado de Execução

| Etapa | Tempo Estimado |
|-------|---------------|
| Export do Supabase | 5-10 minutos |
| Aplicar Schema Cloud SQL | 2-5 minutos |
| Importar Dados | 10-30 minutos |
| **Executar UPDATEs** | **5-10 minutos** |
| Validação | 5-10 minutos |
| **TOTAL** | **30-65 minutos** |

## Rollback

Se algo der errado:

```bash
# Opção 1: Restaurar do backup
gcloud sql backups restore BACKUP_ID --instance=tms-production

# Opção 2: Reverter os UPDATEs (se ainda estiver na mesma transação)
ROLLBACK;

# Opção 3: Resetar organization_id/environment_id
UPDATE orders SET organization_id = NULL, environment_id = NULL;
-- (Repetir para todas as tabelas)
```

## Checklist de Execução

### Antes de Executar
- [ ] Backup do banco Supabase criado
- [ ] Instância Cloud SQL criada
- [ ] Schema aplicado no Cloud SQL
- [ ] Dados importados para Cloud SQL
- [ ] IDs de organização/ambiente revisados
- [ ] Scripts de UPDATE revisados

### Durante Execução
- [ ] Conectado ao Cloud SQL
- [ ] Arquivo `cloudsql_data_migration_updates.sql` localizado
- [ ] Execução do script iniciada
- [ ] Monitoramento de erros ativo

### Após Execução
- [ ] Verificações de NULL executadas
- [ ] Contagem por organização conferida
- [ ] RLS testado
- [ ] Aplicação testada
- [ ] Performance verificada
- [ ] Backup pós-migração criado

## Arquivos de Referência

- `cloudsql_data_migration_updates.sql` - Script com 48 UPDATEs
- `DATA_MIGRATION_GUIDE.md` - Guia completo
- `full_schema_cloudsql.sql` - Schema Cloud SQL
- `CLOUD_SQL_QUICK_START.md` - Início rápido
- `CLOUD_SQL_MIGRATION_GUIDE.md` - Migração detalhada

## Suporte

Em caso de problemas:
1. Consulte `DATA_MIGRATION_GUIDE.md` seção "Troubleshooting"
2. Verifique logs do Cloud SQL
3. Revise políticas RLS
4. Teste com RLS desabilitado (temporariamente)

---

**Total de UPDATEs:** 48 comandos
**Total de Tabelas:** 47 tabelas
**Total de Registros:** ~1,859 registros
**Status:** ✅ Pronto para Execução no Cloud SQL
**Gerado em:** 2026-02-17
