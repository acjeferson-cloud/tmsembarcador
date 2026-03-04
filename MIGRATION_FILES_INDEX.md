# Índice Completo - Migração para Cloud SQL

## Visão Geral

Este documento organiza todos os arquivos relacionados à migração do Supabase para Google Cloud SQL.

---

## 🎯 Comece Aqui

### Se Você É Novo
1. Leia: `DATABASE_SCHEMAS_INDEX.md`
2. Depois: `SCHEMAS_COMPARISON.md`
3. Escolha seu caminho abaixo

### Para Deploy Rápido no Cloud SQL
1. `CLOUD_SQL_QUICK_START.md` ← **Comece aqui**
2. `full_schema_cloudsql.sql` ← Aplique este schema
3. `cloudsql_data_migration_updates.sql` ← Execute os UPDATEs
4. `DATA_MIGRATION_SUMMARY.md` ← Resumo do que foi feito

### Para Migração Completa com Dados
1. `DATA_MIGRATION_GUIDE.md` ← **Guia completo passo a passo**
2. `CLOUD_SQL_MIGRATION_GUIDE.md` ← Detalhes técnicos
3. `cloudsql_data_migration_updates.sql` ← Scripts de UPDATE
4. `VERIFICATION_CHECKLIST.md` ← Validação

---

## 📁 Organização dos Arquivos

### 1️⃣ Schemas SQL (Banco de Dados)

| Arquivo | Tamanho | Plataforma | Descrição |
|---------|---------|------------|-----------|
| `full_schema.sql` | 91 KB | Supabase | Schema completo para Supabase PostgreSQL |
| `full_schema_cloudsql.sql` | 94 KB | Cloud SQL | **Schema adaptado para Google Cloud SQL** |
| `cloudsql_data_migration_updates.sql` | 18 KB | Cloud SQL | **48 comandos UPDATE para dados existentes** |

**Use:**
- `full_schema_cloudsql.sql` - Para criar estrutura no Cloud SQL
- `cloudsql_data_migration_updates.sql` - Para popular organization_id/environment_id

---

### 2️⃣ Guias de Início Rápido

| Arquivo | Tamanho | Para Quem | O Que Tem |
|---------|---------|-----------|-----------|
| `CLOUD_SQL_QUICK_START.md` | 8.1 KB | Iniciantes | Deploy em 4 passos, comandos prontos |
| `DATA_MIGRATION_SUMMARY.md` | 11 KB | Todos | Resumo executivo dos scripts de UPDATE |
| `DATABASE_SCHEMAS_INDEX.md` | - | Todos | Navegação geral de todos os schemas |

**Use:**
- Para deploy novo: `CLOUD_SQL_QUICK_START.md`
- Para entender UPDATEs: `DATA_MIGRATION_SUMMARY.md`

---

### 3️⃣ Guias Detalhados

| Arquivo | Tamanho | Foco | Conteúdo |
|---------|---------|------|----------|
| `CLOUD_SQL_MIGRATION_GUIDE.md` | 14 KB | Migração Schema | Mudanças técnicas, extensões, auth |
| `DATA_MIGRATION_GUIDE.md` | 13 KB | Migração Dados | Export/import, troubleshooting, código |
| `FULL_SCHEMA_README.md` | 11 KB | Supabase | Documentação do schema Supabase |

**Use:**
- Para migrar do Supabase: `DATA_MIGRATION_GUIDE.md`
- Para entender mudanças: `CLOUD_SQL_MIGRATION_GUIDE.md`

---

### 4️⃣ Comparações e Análises

| Arquivo | Tamanho | Tipo | O Que Compara |
|---------|---------|------|---------------|
| `SCHEMAS_COMPARISON.md` | 11 KB | Side-by-side | Supabase vs Cloud SQL (features) |
| `SUPABASE_VS_CLOUD_SQL_TECHNICAL.md` | 32 KB | Técnico | Análise profunda (performance, custo) |
| `SCHEMA_SUMMARY.md` | 7.8 KB | Referência | Todas as 70 tabelas detalhadas |

**Use:**
- Para decidir plataforma: `SCHEMAS_COMPARISON.md`
- Para análise técnica: `SUPABASE_VS_CLOUD_SQL_TECHNICAL.md`

---

### 5️⃣ Validação e Verificação

| Arquivo | Tamanho | Propósito |
|---------|---------|-----------|
| `VERIFICATION_CHECKLIST.md` | 5.9 KB | Checklist pré/pós migração |
| `SCHEMA_VALIDATION.md` | 6.9 KB | Validação do schema |
| `SCHEMA_FILES_INDEX.md` | 7.2 KB | Índice de arquivos schema |

**Use:**
- Antes de migrar: `VERIFICATION_CHECKLIST.md`
- Para validar schema: `SCHEMA_VALIDATION.md`

---

### 6️⃣ Deploy e Infraestrutura

| Arquivo | Tamanho | Plataforma |
|---------|---------|------------|
| `DEPLOY_GOOGLE_CLOUD.md` | 5.6 KB | Google Cloud |

**Use:**
- Para configurar GCP: `DEPLOY_GOOGLE_CLOUD.md`

---

## 🗺️ Fluxos de Trabalho

### Fluxo 1: Deploy Novo no Cloud SQL (Sem Dados Existentes)

```
1. CLOUD_SQL_QUICK_START.md
   ↓
2. Criar instância Cloud SQL
   ↓
3. Aplicar: full_schema_cloudsql.sql
   ↓
4. VERIFICATION_CHECKLIST.md
   ↓
5. ✅ Pronto!
```

**Tempo:** 20-30 minutos

---

### Fluxo 2: Migrar Dados do Supabase para Cloud SQL

```
1. DATA_MIGRATION_GUIDE.md (leia completo)
   ↓
2. Backup Supabase
   ↓
3. Criar Cloud SQL + aplicar full_schema_cloudsql.sql
   ↓
4. Exportar dados do Supabase
   ↓
5. Importar dados no Cloud SQL
   ↓
6. Executar: cloudsql_data_migration_updates.sql
   ↓
7. DATA_MIGRATION_SUMMARY.md (verificar)
   ↓
8. VERIFICATION_CHECKLIST.md
   ↓
9. ✅ Migração completa!
```

**Tempo:** 1-2 horas

---

### Fluxo 3: Comparar Plataformas (Decisão Técnica)

```
1. SCHEMAS_COMPARISON.md
   ↓
2. SUPABASE_VS_CLOUD_SQL_TECHNICAL.md
   ↓
3. Avaliar custos, features, equipe
   ↓
4. Decisão: Supabase ou Cloud SQL?
   ↓
   Supabase → FULL_SCHEMA_README.md
   Cloud SQL → CLOUD_SQL_QUICK_START.md
```

**Tempo:** 30-60 minutos de leitura

---

## 📊 Estatísticas dos Scripts

### Schema Cloud SQL (`full_schema_cloudsql.sql`)
- **Linhas:** 2,180
- **Tamanho:** 94 KB
- **Tabelas:** 70
- **Índices:** 73
- **Sequences:** 3
- **Triggers:** 19
- **Funções:** 5
- **Políticas RLS:** 30

### Scripts de UPDATE (`cloudsql_data_migration_updates.sql`)
- **Linhas:** 517
- **Tamanho:** 18 KB
- **Comandos UPDATE:** 48
- **Tabelas Afetadas:** 47
- **Registros Atualizados:** ~1,859

### Distribuição dos Updates
```
Geografia................ 656 registros (5 tabelas)
Notas Fiscais........... 235 registros (1 tabela)
CT-e.................... 192 registros (1 tabela)
Pedidos................. 210 registros (5 tabelas)
Tabelas de Frete........ 113 registros (4 tabelas)
NPS..................... 94 registros (3 tabelas)
Transportadoras......... 126 registros (3 tabelas)
Parceiros............... 74 registros (3 tabelas)
Outros.................. 159 registros (22 tabelas)
```

---

## 🎯 Casos de Uso Específicos

### Caso 1: "Quero fazer deploy rápido no Cloud SQL"
```
1. CLOUD_SQL_QUICK_START.md
2. full_schema_cloudsql.sql
3. Done!
```

### Caso 2: "Tenho dados no Supabase e quero migrar"
```
1. DATA_MIGRATION_GUIDE.md
2. Backup + Export
3. full_schema_cloudsql.sql
4. Import
5. cloudsql_data_migration_updates.sql
6. Verify
```

### Caso 3: "Não sei qual plataforma escolher"
```
1. SCHEMAS_COMPARISON.md
2. SUPABASE_VS_CLOUD_SQL_TECHNICAL.md
3. Decidir
```

### Caso 4: "Preciso entender as diferenças técnicas"
```
1. CLOUD_SQL_MIGRATION_GUIDE.md
2. SCHEMA_SUMMARY.md
3. SUPABASE_VS_CLOUD_SQL_TECHNICAL.md
```

### Caso 5: "Quero validar a migração"
```
1. VERIFICATION_CHECKLIST.md
2. DATA_MIGRATION_SUMMARY.md (queries de verificação)
3. SCHEMA_VALIDATION.md
```

---

## 🔍 Como Encontrar Informações

### Procurando por...

**Comandos prontos para executar?**
→ `CLOUD_SQL_QUICK_START.md`

**Scripts SQL de UPDATE?**
→ `cloudsql_data_migration_updates.sql`

**Passo a passo de migração?**
→ `DATA_MIGRATION_GUIDE.md`

**Comparação de custos?**
→ `SCHEMAS_COMPARISON.md` ou `SUPABASE_VS_CLOUD_SQL_TECHNICAL.md`

**Lista de todas as tabelas?**
→ `SCHEMA_SUMMARY.md`

**Troubleshooting?**
→ `DATA_MIGRATION_GUIDE.md` (seção Troubleshooting)

**Como configurar RLS?**
→ `CLOUD_SQL_MIGRATION_GUIDE.md` (seção Row Level Security)

**Exemplos de código?**
→ `DATA_MIGRATION_GUIDE.md` (seção Application Code Updates)

**Checklist de validação?**
→ `VERIFICATION_CHECKLIST.md`

---

## 📦 Resumo dos Arquivos por Categoria

### Schemas (3 arquivos)
- `full_schema.sql`
- `full_schema_cloudsql.sql` ⭐
- `cloudsql_data_migration_updates.sql` ⭐

### Guias Rápidos (3 arquivos)
- `CLOUD_SQL_QUICK_START.md` ⭐
- `DATA_MIGRATION_SUMMARY.md` ⭐
- `DATABASE_SCHEMAS_INDEX.md`

### Guias Detalhados (3 arquivos)
- `CLOUD_SQL_MIGRATION_GUIDE.md`
- `DATA_MIGRATION_GUIDE.md` ⭐
- `FULL_SCHEMA_README.md`

### Comparações (3 arquivos)
- `SCHEMAS_COMPARISON.md` ⭐
- `SUPABASE_VS_CLOUD_SQL_TECHNICAL.md`
- `SCHEMA_SUMMARY.md`

### Validação (3 arquivos)
- `VERIFICATION_CHECKLIST.md`
- `SCHEMA_VALIDATION.md`
- `SCHEMA_FILES_INDEX.md`

### Deploy (1 arquivo)
- `DEPLOY_GOOGLE_CLOUD.md`

### Índice (1 arquivo)
- `MIGRATION_FILES_INDEX.md` (este arquivo)

**Total: 17 arquivos**
⭐ = Arquivos mais importantes

---

## ⚡ Quick Commands

### Deploy Completo Cloud SQL
```bash
# 1. Criar instância
gcloud sql instances create tms-prod \
  --database-version=POSTGRES_15 \
  --tier=db-custom-4-16384 \
  --region=us-central1

# 2. Criar database
gcloud sql databases create tms --instance=tms-prod

# 3. Aplicar schema
CLOUD_SQL_IP=$(gcloud sql instances describe tms-prod \
  --format="value(ipAddresses[0].ipAddress)")
psql -h $CLOUD_SQL_IP -U postgres -d tms \
  -f full_schema_cloudsql.sql

# 4. Verificar
psql -h $CLOUD_SQL_IP -U postgres -d tms -c "\dt"
# Deve mostrar 70 tabelas
```

### Migração com Dados
```bash
# 1. Export do Supabase
pg_dump -h db.xxxxx.supabase.co -U postgres -d postgres \
  --data-only --column-inserts -f supabase_data.sql

# 2. Import no Cloud SQL
psql -h $CLOUD_SQL_IP -U postgres -d tms \
  -f supabase_data.sql

# 3. Aplicar UPDATEs
psql -h $CLOUD_SQL_IP -U postgres -d tms \
  -f cloudsql_data_migration_updates.sql

# 4. Verificar
psql -h $CLOUD_SQL_IP -U postgres -d tms \
  -c "SELECT COUNT(*) FROM orders WHERE organization_id IS NOT NULL;"
```

---

## 📞 Onde Buscar Ajuda

| Problema | Arquivo |
|----------|---------|
| Erro de conexão | `CLOUD_SQL_QUICK_START.md` → Troubleshooting |
| Dados não aparecem | `DATA_MIGRATION_GUIDE.md` → RLS Issues |
| Performance lenta | `SUPABASE_VS_CLOUD_SQL_TECHNICAL.md` → Performance |
| Custo alto | `SCHEMAS_COMPARISON.md` → Cost Comparison |
| Schema inválido | `SCHEMA_VALIDATION.md` |
| Updates falharam | `DATA_MIGRATION_SUMMARY.md` → Verificações |

---

## ✅ Checklist Final

### Antes de Começar
- [ ] Definir: Supabase ou Cloud SQL?
- [ ] Ler documentação apropriada
- [ ] Entender custos e recursos
- [ ] Preparar ambiente (GCP/Supabase)

### Para Deploy Novo
- [ ] Ler: `CLOUD_SQL_QUICK_START.md`
- [ ] Criar Cloud SQL instance
- [ ] Aplicar: `full_schema_cloudsql.sql`
- [ ] Verificar: 70 tabelas criadas
- [ ] Testar conexão

### Para Migração com Dados
- [ ] Ler: `DATA_MIGRATION_GUIDE.md`
- [ ] Backup do Supabase
- [ ] Deploy schema no Cloud SQL
- [ ] Exportar + Importar dados
- [ ] Executar: `cloudsql_data_migration_updates.sql`
- [ ] Verificar: organization_id populado
- [ ] Testar RLS
- [ ] Atualizar código da aplicação

---

## 🚀 Status dos Arquivos

| Arquivo | Status | Testado | Pronto |
|---------|--------|---------|--------|
| `full_schema_cloudsql.sql` | ✅ Pronto | ✅ Sim | ✅ Deploy |
| `cloudsql_data_migration_updates.sql` | ✅ Pronto | ✅ Sim | ✅ Execute |
| Todos os `.md` | ✅ Completo | - | ✅ Leia |

---

**Gerado em:** 2026-02-17
**Versão:** 1.0
**Status:** ✅ Documentação Completa
**Total de Arquivos:** 17 documentos + 3 scripts SQL

**Comece por:** `DATABASE_SCHEMAS_INDEX.md` ou `CLOUD_SQL_QUICK_START.md`
