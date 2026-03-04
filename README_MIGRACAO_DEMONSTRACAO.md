# Migração Completa - Organização Demonstração

Guia completo para migrar os dados da organização "Demonstração" do Supabase para Google Cloud SQL.

## Arquivos Gerados

### 1. `cloudsql_complete_migration_demonstracao.sql`
Arquivo SQL principal contendo:
- ✅ Estrutura completa de transação
- ✅ Configurações otimizadas
- ✅ Dados base (saas_plans, organizations, environments)
- ✅ Usuários (13 registros)
- ⚠️ Seção preparada para dados operacionais (a completar)
- ✅ Queries de validação

### 2. `QUERIES_EXTRACAO_DADOS_DEMONSTRACAO.md`
Documento com todas as queries SQL necessárias para extrair:
- Establishments (4 registros)
- Business Partners (14 registros)
- Carriers (12 registros)
- Orders (102 registros)
- Invoices (12 registros)
- Invoices NFe (235 registros)
- CTEs Complete (192 registros)
- Occurrences (68 registros)
- Reverse Logistics (30 registros)
- Freight Rates (11 registros)
- Rejection Reasons (46 registros)
- Holidays (24 registros)

---

## Resumo dos Dados

| Categoria | Tabelas | Registros | Status |
|-----------|---------|-----------|--------|
| **Configuração Base** | saas_plans, organizations, environments | 7 | ✅ Incluído |
| **Usuários** | users | 13 | ✅ Incluído |
| **Cadastros** | establishments, business_partners, carriers, rejection_reasons, occurrences | 144 | ⏳ Pendente |
| **Operacional** | orders, invoices, invoices_nfe, ctes_complete, reverse_logistics | 571 | ⏳ Pendente |
| **Frete** | freight_rates, holidays | 35 | ⏳ Pendente |
| **TOTAL** | 14 tabelas | **770 registros** | **20 incluídos** |

---

## Como Usar

### Opção 1: Migração Parcial (Rápida)

Se você precisa apenas testar a estrutura e usuários:

```bash
# 1. Conecte ao Google Cloud SQL
psql -h <cloud-sql-ip> -U postgres -d <database>

# 2. Execute o arquivo SQL base
\i cloudsql_complete_migration_demonstracao.sql
```

**Resultado:**
- ✅ 4 planos SaaS
- ✅ 1 organização (Demonstração)
- ✅ 2 ambientes (Produção + Sandbox)
- ✅ 13 usuários

**Ideal para:** Testes, validação de estrutura, desenvolvimento inicial

---

### Opção 2: Migração Completa (Recomendada)

Para migrar TODOS os dados operacionais:

#### Passo 1: Extrair Dados Adicionais

Abra o arquivo `QUERIES_EXTRACAO_DADOS_DEMONSTRACAO.md` e execute cada query no Supabase SQL Editor:

```sql
-- Exemplo: Extrair establishments
SELECT * FROM establishments
WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e';
```

#### Passo 2: Converter para INSERT SQL

Para cada resultado:

1. **Opção A - Manual:** Copie os dados e formate como INSERT
2. **Opção B - Ferramenta:** Use um conversor JSON-to-SQL online
3. **Opção C - Script:** Use o script Python incluído no documento

#### Passo 3: Adicionar ao Arquivo SQL

Abra `cloudsql_complete_migration_demonstracao.sql` e adicione os INSERTs na **Seção 4** (linha 82-137):

```sql
-- =====================================================================
-- SEÇÃO 4: DADOS OPERACIONAIS (RESUMO)
-- =====================================================================

-- COLE AQUI OS INSERTS EXTRAÍDOS:

INSERT INTO establishments (id, codigo, nome, ...) VALUES
('uuid', 'cod1', 'nome1', ...),
('uuid', 'cod2', 'nome2', ...);

INSERT INTO business_partners (id, codigo, razao_social, ...) VALUES
('uuid', 'cod1', 'razão1', ...),
('uuid', 'cod2', 'razão2', ...);

-- ... continuar com as outras tabelas
```

#### Passo 4: Executar Migração Completa

```bash
# Conecte ao Cloud SQL
psql -h <cloud-sql-ip> -U postgres -d <database>

# Execute o arquivo completo
\i cloudsql_complete_migration_demonstracao.sql
```

#### Passo 5: Validar

O próprio arquivo SQL executa queries de validação ao final. Verifique a saída:

```
tabela              | registros_esperados | registros_atuais | status
--------------------+--------------------+------------------+--------
saas_plans          | 4                  | 4                | OK
organizations       | 1                  | 1                | OK
environments        | 2                  | 2                | OK
users               | 13                 | 13               | OK
establishments      | 4                  | 4                | OK
...
```

---

### Opção 3: Usar pg_dump (Para Especialistas)

Se você tem acesso direto ao banco Supabase e quer uma migração mais rápida:

```bash
# 1. Exportar dados da organização Demonstração
pg_dump \
  --host=db.supabase.co \
  --port=5432 \
  --username=postgres \
  --dbname=postgres \
  --password \
  --data-only \
  --inserts \
  --column-inserts \
  --table=organizations \
  --table=environments \
  --table=users \
  --table=establishments \
  --table=business_partners \
  --table=carriers \
  --table=orders \
  --table=invoices \
  --table=invoices_nfe \
  --table=ctes_complete \
  --where="organization_id='8b007dd0-0db6-4288-a1c1-7b05ffb7b32e'" \
  > migracao_demonstracao_completa.sql

# 2. Importar no Cloud SQL
psql -h <cloud-sql-ip> -U postgres -d <database> -f migracao_demonstracao_completa.sql
```

**Vantagens:**
- ✅ Mais rápido
- ✅ Menos propenso a erros
- ✅ Preserva formatação exata dos dados

**Desvantagens:**
- ⚠️ Requer acesso direto ao banco Supabase
- ⚠️ Pode incluir dados desnecessários

---

## Ordem de Execução Recomendada

Para evitar erros de foreign key, siga esta ordem:

1. **Tabelas Globais** (sem organization_id)
   - ✅ saas_plans

2. **Estrutura Multi-tenant**
   - ✅ organizations
   - ✅ environments

3. **Usuários e Estabelecimentos**
   - ✅ users
   - ⏳ establishments

4. **Cadastros Auxiliares**
   - ⏳ rejection_reasons
   - ⏳ holidays
   - ⏳ occurrences

5. **Parceiros de Negócio**
   - ⏳ business_partners
   - ⏳ carriers

6. **Frete**
   - ⏳ freight_rates

7. **Dados Transacionais**
   - ⏳ orders
   - ⏳ invoices
   - ⏳ invoices_nfe
   - ⏳ ctes_complete
   - ⏳ reverse_logistics

---

## Problemas Comuns

### ❌ Erro: "duplicate key value violates unique constraint"

**Causa:** UUID já existe no banco de destino

**Solução:** Limpe o banco Cloud SQL antes da migração:
```sql
DELETE FROM users WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e';
DELETE FROM environments WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e';
DELETE FROM organizations WHERE id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e';
```

---

### ❌ Erro: "insert or update on table violates foreign key constraint"

**Causa:** Ordem de inserção incorreta

**Solução:** Siga a ordem recomendada acima. Insira sempre as tabelas "pai" antes das "filhas".

---

### ❌ Erro: "invalid input syntax for type json"

**Causa:** Caracteres especiais não escapados em campos JSON/XML

**Solução:** Use o formato `'...'::jsonb` para campos JSONB:
```sql
INSERT INTO table (json_field) VALUES
('{"key": "value"}'::jsonb);
```

---

### ❌ Erro: Timeout ou "out of memory"

**Causa:** Muitos dados sendo inseridos de uma vez

**Solução:** Divida os INSERTs em lotes menores (50 registros por vez):
```sql
INSERT INTO invoices_nfe (...) VALUES (...), (...), ...; -- 50 registros
INSERT INTO invoices_nfe (...) VALUES (...), (...), ...; -- próximos 50
```

---

## Validação Pós-Migração

### 1. Contagem de Registros

```sql
SELECT
  'users' as tabela,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e') as demonstracao
FROM users
UNION ALL
SELECT 'establishments', COUNT(*), COUNT(*) FILTER (WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e')
FROM establishments
UNION ALL
SELECT 'orders', COUNT(*), COUNT(*) FILTER (WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e')
FROM orders;
```

### 2. Integridade Referencial

```sql
-- Verificar se todos os users têm organization_id válido
SELECT COUNT(*) as usuarios_sem_org
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM organizations o WHERE o.id = u.organization_id
);
-- Deve retornar 0

-- Verificar se todos os users têm environment_id válido
SELECT COUNT(*) as usuarios_sem_ambiente
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM environments e WHERE e.id = u.environment_id
);
-- Deve retornar 0
```

### 3. Verificar Isolamento Multi-tenant

```sql
-- Garantir que não há vazamento entre organizações
SELECT
  o.name as organizacao,
  COUNT(u.id) as total_usuarios
FROM organizations o
LEFT JOIN users u ON u.organization_id = o.id
GROUP BY o.id, o.name
ORDER BY o.name;

-- Deve mostrar apenas "Demonstração" com 13 usuários
```

---

## Notas Importantes

### ⚠️ Senhas de Usuários

Os usuários migrados **não terão senhas válidas**. Após a migração:

1. Implemente um sistema de "primeira configuração de senha"
2. Ou envie links de redefinição de senha para todos os usuários
3. Ou defina senhas temporárias manualmente

### ⚠️ Campos JSONB e XML

Tabelas como `invoices_nfe` e `ctes_complete` contêm:
- Dados XML completos das notas fiscais
- JSONs com informações estruturadas
- Possível total de **vários MB por registro**

Se encontrar problemas de memória, considere:
1. Migrar estas tabelas separadamente
2. Usar `pg_dump` ao invés de INSERT SQL
3. Comprimir os dados antes da migração

### ⚠️ Timestamps e Timezone

Todos os timestamps estão em UTC (`+00`). Configure o timezone do Cloud SQL:

```sql
SET TIMEZONE TO 'UTC';
ALTER DATABASE seu_banco SET TIMEZONE TO 'UTC';
```

---

## Suporte e Dúvidas

### Documentação Relacionada

- `QUERIES_EXTRACAO_DADOS_DEMONSTRACAO.md` - Queries detalhadas de extração
- `cloudsql_complete_migration_demonstracao.sql` - Arquivo SQL principal
- `CLOUD_SQL_MIGRATION_GUIDE.md` - Guia geral de migração (se existir)

### Contatos

Para problemas ou dúvidas:
1. Verifique os logs do PostgreSQL: `tail -f /var/log/postgresql/postgresql.log`
2. Consulte a documentação do Google Cloud SQL
3. Revise as foreign keys no schema

---

## Checklist de Migração

Antes de executar em produção:

- [ ] Backup do banco Supabase realizado
- [ ] Schema criado no Cloud SQL
- [ ] Arquivo SQL base testado em ambiente de desenvolvimento
- [ ] Dados adicionais extraídos e formatados
- [ ] Ordem de inserção validada
- [ ] Timezone configurado corretamente
- [ ] Plano de redefinição de senhas preparado
- [ ] Queries de validação executadas
- [ ] Testes de integridade realizados
- [ ] Documentação atualizada

---

**Última atualização:** 2026-02-17
**Versão:** 1.0
**Autor:** Sistema de Migração Automatizada
