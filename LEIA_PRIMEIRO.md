# 🎯 LEIA PRIMEIRO - Migração para Cloud SQL

## TL;DR

Você tem **scripts prontos** para migrar seu banco de dados do Supabase para Google Cloud SQL, incluindo UPDATEs para 47 tabelas com ~1,859 registros.

---

## 📦 O Que Foi Criado

### 3 Arquivos SQL
1. **`full_schema_cloudsql.sql`** (94 KB)
   - Schema completo para Cloud SQL
   - 70 tabelas, 73 índices, 30 políticas RLS
   
2. **`cloudsql_data_migration_updates.sql`** (18 KB) ⭐
   - 48 comandos UPDATE
   - Adiciona organization_id e environment_id
   - Atualiza ~1,859 registros em 47 tabelas

3. **`full_schema.sql`** (91 KB)
   - Schema original do Supabase (referência)

### 14 Documentos
- 📘 `MIGRATION_FILES_INDEX.md` - Índice completo
- 🚀 `CLOUD_SQL_QUICK_START.md` - Deploy em 4 passos
- 📊 `DATA_MIGRATION_SUMMARY.md` - Resumo dos UPDATEs
- 📖 `DATA_MIGRATION_GUIDE.md` - Guia passo a passo completo
- 🔄 `CLOUD_SQL_MIGRATION_GUIDE.md` - Mudanças técnicas
- ⚖️ `SCHEMAS_COMPARISON.md` - Supabase vs Cloud SQL
- Mais 8 documentos de referência

---

## 🚀 Como Começar (3 Caminhos)

### Caminho 1: Deploy Novo (Sem Dados)
```bash
# Tempo: 20 minutos
1. Leia: CLOUD_SQL_QUICK_START.md
2. Execute: full_schema_cloudsql.sql
3. Pronto!
```

### Caminho 2: Migração com Dados ⭐ MAIS COMUM
```bash
# Tempo: 1-2 horas
1. Leia: DATA_MIGRATION_GUIDE.md
2. Backup Supabase
3. Execute: full_schema_cloudsql.sql (estrutura)
4. Importe dados do Supabase
5. Execute: cloudsql_data_migration_updates.sql ⭐
6. Valide tudo
```

### Caminho 3: Comparar Plataformas
```bash
# Tempo: 30 minutos
1. Leia: SCHEMAS_COMPARISON.md
2. Decida: Supabase ou Cloud SQL?
3. Siga caminho apropriado
```

---

## ⚡ Comandos Essenciais

### Criar Cloud SQL
```bash
gcloud sql instances create tms-prod \
  --database-version=POSTGRES_15 \
  --tier=db-custom-4-16384 \
  --region=us-central1

gcloud sql databases create tms --instance=tms-prod
```

### Aplicar Schema
```bash
CLOUD_SQL_IP=$(gcloud sql instances describe tms-prod \
  --format="value(ipAddresses[0].ipAddress)")

psql -h $CLOUD_SQL_IP -U postgres -d tms \
  -f full_schema_cloudsql.sql
```

### Migrar Dados + Executar UPDATEs
```bash
# 1. Exportar do Supabase
pg_dump -h db.xxxxx.supabase.co -U postgres \
  --data-only --column-inserts -f supabase_data.sql

# 2. Importar no Cloud SQL
psql -h $CLOUD_SQL_IP -U postgres -d tms \
  -f supabase_data.sql

# 3. ⭐ Executar UPDATEs (IMPORTANTE!)
psql -h $CLOUD_SQL_IP -U postgres -d tms \
  -f cloudsql_data_migration_updates.sql
```

### Verificar
```bash
psql -h $CLOUD_SQL_IP -U postgres -d tms -c "
SELECT COUNT(*) as total_tabelas
FROM information_schema.tables
WHERE table_schema = 'public';
-- Deve retornar: 70

SELECT
  COUNT(*) as total_registros,
  COUNT(*) FILTER (WHERE organization_id IS NOT NULL) as com_org_id
FROM orders;
-- com_org_id deve ser igual a total_registros
"
```

---

## 📊 O Que os Scripts Fazem

### `full_schema_cloudsql.sql`
Cria toda a estrutura do banco:
- ✅ 70 tabelas (orders, invoices, carriers, etc.)
- ✅ 73 índices para performance
- ✅ 30 políticas RLS para segurança multi-tenant
- ✅ 3 sequences para IDs
- ✅ 19 triggers para automação
- ✅ 5 funções auxiliares

### `cloudsql_data_migration_updates.sql` ⭐
Atualiza dados existentes com:
- ✅ organization_id (qual organização/empresa)
- ✅ environment_id (produção/staging/sandbox)

**Por que é necessário?**
Cloud SQL não tem auth integrado como Supabase. Precisamos popular manualmente os campos de multi-tenancy.

**Quais tabelas são atualizadas?**
47 tabelas com dados:
- 369 registros em `zip_code_ranges`
- 235 registros em `invoices_nfe`
- 192 registros em `ctes_complete`
- 102 registros em `orders`
- E mais 43 tabelas...

**Total: ~1,859 registros atualizados**

---

## 🎯 Tabelas Mais Importantes

| Tabela | Registros | O Que É |
|--------|-----------|---------|
| `zip_code_ranges` | 369 | Faixas de CEP |
| `invoices_nfe` | 235 | Notas Fiscais Eletrônicas |
| `ctes_complete` | 192 | CT-e (Conhecimento Transporte) |
| `orders` | 102 | Pedidos |
| `freight_rate_details` | 88 | Detalhes de Tabelas de Frete |
| `freight_quotes_history` | 70 | Histórico de Cotações |
| `nps_pesquisas_cliente` | 69 | Pesquisas NPS |
| `occurrences` | 68 | Ocorrências |

**Todas serão atualizadas com organization_id e environment_id**

---

## 🔑 IDs Padrão Usados

Os scripts usam estes valores por padrão:

**Organização:** Demonstração
- ID: `8b007dd0-0db6-4288-a1c1-7b05ffb7b32e`
- Slug: `00000001`

**Ambiente:** Produção
- ID: `abe69012-4449-4946-977e-46af45790a43`
- Slug: `production`

**Se precisar mudar:**
Edite o arquivo `cloudsql_data_migration_updates.sql` e substitua os UUIDs.

---

## ⚠️ Importante Antes de Executar

### 1. Faça Backup!
```bash
# Backup do Supabase
pg_dump -h db.xxxxx.supabase.co -U postgres \
  -d postgres -f backup_supabase_$(date +%Y%m%d).sql
```

### 2. Teste em Staging Primeiro
Não execute direto em produção. Crie um ambiente de teste.

### 3. Revise os IDs
Confirme se os UUIDs de organização e ambiente estão corretos.

### 4. Reserve Tempo
Migração completa: 1-2 horas (mais validação e testes)

---

## 📖 Documentação Completa

### Leitura Essencial
1. **`MIGRATION_FILES_INDEX.md`** - Índice de TUDO
2. **`DATA_MIGRATION_SUMMARY.md`** - Resumo dos UPDATEs
3. **`DATA_MIGRATION_GUIDE.md`** - Guia completo

### Leitura Recomendada
4. **`CLOUD_SQL_QUICK_START.md`** - Deploy rápido
5. **`SCHEMAS_COMPARISON.md`** - Comparação plataformas
6. **`VERIFICATION_CHECKLIST.md`** - Checklist validação

### Leitura Avançada
7. **`CLOUD_SQL_MIGRATION_GUIDE.md`** - Detalhes técnicos
8. **`SUPABASE_VS_CLOUD_SQL_TECHNICAL.md`** - Análise profunda
9. **`SCHEMA_SUMMARY.md`** - Todas as 70 tabelas

---

## ✅ Checklist Rápido

### Pré-Requisitos
- [ ] Conta Google Cloud ativa
- [ ] gcloud CLI instalado
- [ ] psql instalado
- [ ] Backup do Supabase feito
- [ ] Tempo reservado (1-2 horas)

### Durante Migração
- [ ] Cloud SQL instance criada
- [ ] Schema aplicado (`full_schema_cloudsql.sql`)
- [ ] Dados importados
- [ ] UPDATEs executados (`cloudsql_data_migration_updates.sql`) ⭐
- [ ] Verificações passaram

### Pós-Migração
- [ ] RLS testado
- [ ] Aplicação testada
- [ ] Performance OK
- [ ] Backup criado
- [ ] Documentação atualizada

---

## 🆘 Problemas Comuns

### Problema: UPDATEs não funcionaram
**Solução:** Verifique se as colunas existem
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name IN ('organization_id', 'environment_id');
```

### Problema: Queries retornam 0 registros
**Solução:** Configure variáveis de sessão (RLS)
```sql
SET LOCAL app.organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e';
SET LOCAL app.environment_id = 'abe69012-4449-4946-977e-46af45790a43';
SELECT * FROM orders; -- Agora deve retornar dados
```

### Problema: Performance lenta
**Solução:** Rebuild statistics
```sql
ANALYZE;
REINDEX DATABASE tms;
```

**Mais troubleshooting:** Veja `DATA_MIGRATION_GUIDE.md` seção "Troubleshooting"

---

## 💰 Custo Estimado Cloud SQL

### Desenvolvimento/Staging
- Tier: db-custom-2-8192 (2 vCPU, 8 GB)
- **~$100/mês**

### Produção (Médio)
- Tier: db-custom-4-16384 (4 vCPU, 16 GB)
- High Availability: Sim
- **~$350/mês**

### Produção (Grande)
- Tier: db-custom-8-32768 (8 vCPU, 32 GB)
- High Availability: Sim
- Read Replicas: 2
- **~$1,200/mês**

---

## 🎓 Próximos Passos

### Depois da Migração

1. **Atualizar Aplicação**
   - Mudar connection string
   - Adicionar session context (RLS)
   - Testar autenticação

2. **Configurar Monitoring**
   - Cloud Monitoring
   - Alertas
   - Dashboards

3. **Otimizar Performance**
   - Ajustar flags do PostgreSQL
   - Connection pooling (PgBouncer)
   - Índices adicionais se necessário

4. **Documentar**
   - Connection strings
   - Credenciais (no Secret Manager)
   - Procedimentos de backup/restore

---

## 📞 Suporte

**Dúvidas sobre:**
- Estrutura do banco → `SCHEMA_SUMMARY.md`
- Comandos de migração → `DATA_MIGRATION_GUIDE.md`
- Comparação plataformas → `SCHEMAS_COMPARISON.md`
- Deploy rápido → `CLOUD_SQL_QUICK_START.md`
- Índice completo → `MIGRATION_FILES_INDEX.md`

---

## 🎉 Você Está Pronto!

**Arquivos Principais:**
1. ⭐ `cloudsql_data_migration_updates.sql` - EXECUTE ESTE
2. ⭐ `full_schema_cloudsql.sql` - APLIQUE ESTE PRIMEIRO
3. ⭐ `DATA_MIGRATION_GUIDE.md` - LEIA ESTE

**Comando Único (após preparar tudo):**
```bash
# Aplicar schema + dados + updates
psql -h $CLOUD_SQL_IP -U postgres -d tms \
  -f full_schema_cloudsql.sql \
  -f supabase_data.sql \
  -f cloudsql_data_migration_updates.sql
```

**Tempo total:** 1-2 horas
**Status:** ✅ Pronto para Produção
**Gerado em:** 2026-02-17

---

**👉 COMECE AGORA:** Leia `DATA_MIGRATION_GUIDE.md` ou `CLOUD_SQL_QUICK_START.md`
