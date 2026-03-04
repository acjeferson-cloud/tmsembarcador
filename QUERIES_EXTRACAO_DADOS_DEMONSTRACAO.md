# Queries para Extração Completa de Dados - Organização Demonstração

Este documento contém todas as queries SQL necessárias para extrair os dados restantes da organização "Demonstração" do Supabase.

## Informações Gerais

- **Organização:** Demonstração
- **ID:** `8b007dd0-0db6-4288-a1c1-7b05ffb7b32e`
- **Ambientes:** Produção (abe69012-4449-4946-977e-46af45790a43) + Sandbox (ab23dd7f-42a4-4e55-b340-45433f842337)
- **Arquivo Base:** `cloudsql_complete_migration_demonstracao.sql`

## Status Atual

✅ **Já incluído no arquivo:**
- saas_plans (4 registros)
- organizations (1 registro)
- environments (2 registros)
- users (13 registros)

⏳ **Pendente de extração:**
- establishments (4 registros)
- business_partners (14 registros)
- carriers (12 registros)
- orders (102 registros)
- invoices (12 registros)
- invoices_nfe (235 registros)
- ctes_complete (192 registros)
- occurrences (68 registros)
- reverse_logistics (30 registros)
- freight_rates (11 registros)
- rejection_reasons (46 registros)
- holidays (24 registros)

---

## 1. Establishments (4 registros)

```sql
SELECT
  id, codigo, nome, cnpj, inscricao_estadual, inscricao_municipal,
  endereco, numero, complemento, bairro, cidade, estado, cep, pais,
  telefone, email, responsavel, ativo, tipo, matriz,
  organization_id, environment_id, created_at, updated_at
FROM establishments
WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e'
ORDER BY created_at;
```

**Formato INSERT esperado:**
```sql
INSERT INTO establishments (id, codigo, nome, cnpj, ...) VALUES
('uuid', 'codigo', 'nome', 'cnpj', ...),
('uuid', 'codigo', 'nome', 'cnpj', ...);
```

---

## 2. Business Partners (14 registros)

```sql
SELECT
  id, codigo, razao_social, nome_fantasia, cnpj_cpf, inscricao_estadual,
  tipo, categoria, ativo, endereco, numero, complemento, bairro,
  cidade, estado, cep, pais, telefone, celular, email, contato,
  observacoes, limite_credito, prazo_pagamento,
  organization_id, environment_id, created_at, updated_at
FROM business_partners
WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e'
ORDER BY created_at;
```

---

## 3. Carriers (12 registros)

```sql
SELECT
  id, codigo, razao_social, nome_fantasia, cnpj, inscricao_estadual,
  ativo, tipo_transporte, modalidade, endereco, numero, complemento,
  bairro, cidade, estado, cep, telefone, email, contato,
  prazo_coleta_dias, prazo_entrega_dias, observacoes,
  organization_id, environment_id, created_at, updated_at
FROM carriers
WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e'
ORDER BY created_at;
```

**NOTA:** Carriers pode conter campos JSONB grandes. Se houver erros, extraia em partes menores.

---

## 4. Rejection Reasons (46 registros)

```sql
SELECT
  id, codigo, descricao, tipo, ativo, requer_justificativa,
  organization_id, environment_id, created_at, updated_at
FROM rejection_reasons
WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e'
ORDER BY codigo;
```

---

## 5. Freight Rates (11 registros)

```sql
SELECT
  id, codigo, nome, transportadora_id, tipo_frete, modal,
  vigencia_inicio, vigencia_fim, ativo, observacoes,
  organization_id, environment_id, created_at, updated_at
FROM freight_rates
WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e'
ORDER BY created_at;
```

---

## 6. Holidays (24 registros)

```sql
SELECT
  id, nome, data, tipo, recorrente, ativo,
  organization_id, environment_id, created_at, updated_at
FROM holidays
WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e'
ORDER BY data;
```

---

## 7. Occurrences (68 registros)

```sql
SELECT
  id, codigo, descricao, tipo, categoria, ativo, cor, icone,
  requer_foto, requer_assinatura, requer_justificativa,
  organization_id, environment_id, created_at, updated_at
FROM occurrences
WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e'
ORDER BY codigo;
```

**DICA:** Extraia em lotes de 20 registros se necessário:
```sql
-- Lote 1 (registros 1-20)
SELECT * FROM occurrences
WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e'
ORDER BY created_at
LIMIT 20 OFFSET 0;

-- Lote 2 (registros 21-40)
SELECT * FROM occurrences
WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e'
ORDER BY created_at
LIMIT 20 OFFSET 20;

-- Lote 3 (registros 41-60)
SELECT * FROM occurrences
WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e'
ORDER BY created_at
LIMIT 20 OFFSET 40;

-- Lote 4 (registros 61-68)
SELECT * FROM occurrences
WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e'
ORDER BY created_at
LIMIT 20 OFFSET 60;
```

---

## 8. Orders (102 registros)

```sql
SELECT
  id, numero_pedido, cliente_id, transportadora_id, estabelecimento_id,
  data_pedido, data_previsao_entrega, data_entrega, status, valor_total,
  peso_total, volume_total, observacoes,
  organization_id, environment_id, created_at, updated_at
FROM orders
WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e'
ORDER BY created_at;
```

**RECOMENDAÇÃO:** Extraia em lotes de 25 registros:
```sql
-- Lote 1
SELECT * FROM orders
WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e'
ORDER BY created_at
LIMIT 25 OFFSET 0;

-- Lote 2
SELECT * FROM orders
WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e'
ORDER BY created_at
LIMIT 25 OFFSET 25;

-- Lote 3
SELECT * FROM orders
WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e'
ORDER BY created_at
LIMIT 25 OFFSET 50;

-- Lote 4
SELECT * FROM orders
WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e'
ORDER BY created_at
LIMIT 25 OFFSET 75;
```

---

## 9. Invoices (12 registros)

```sql
SELECT
  id, numero, serie, chave_acesso, data_emissao, data_saida,
  valor_total, cliente_id, estabelecimento_id, status,
  organization_id, environment_id, created_at, updated_at
FROM invoices
WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e'
ORDER BY created_at;
```

---

## 10. Invoices NFe (235 registros - ATENÇÃO: Dados XML)

```sql
SELECT
  id, chave_acesso, numero, serie, data_emissao, data_saida,
  valor_total, status, xml_data, json_data,
  organization_id, environment_id, created_at, updated_at
FROM invoices_nfe
WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e'
ORDER BY created_at
LIMIT 50 OFFSET 0;
```

**IMPORTANTE:** Esta é a tabela MAIOR. Extraia em lotes de 50:
- Lote 1: OFFSET 0
- Lote 2: OFFSET 50
- Lote 3: OFFSET 100
- Lote 4: OFFSET 150
- Lote 5: OFFSET 200

**CUIDADO:** Campos `xml_data` e `json_data` contêm dados grandes. Pode ser necessário:
1. Exportar para arquivos JSON separados
2. Ou usar ferramentas de ETL (pg_dump/pg_restore)
3. Ou comprimir dados antes de inserir

---

## 11. CTEs Complete (192 registros - ATENÇÃO: Dados XML)

```sql
SELECT
  id, chave_acesso, numero, serie, data_emissao, valor_total,
  status, xml_data, json_data,
  organization_id, environment_id, created_at, updated_at
FROM ctes_complete
WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e'
ORDER BY created_at
LIMIT 50 OFFSET 0;
```

**RECOMENDAÇÃO:** Extraia em lotes de 50 registros (igual invoices_nfe).

---

## 12. Reverse Logistics (30 registros)

```sql
SELECT
  id, numero_processo, pedido_id, cliente_id, motivo, status,
  data_solicitacao, data_coleta, data_conclusao, observacoes,
  organization_id, environment_id, created_at, updated_at
FROM reverse_logistics
WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e'
ORDER BY created_at;
```

---

## Estratégia de Extração Recomendada

### Opção 1: Extração Manual (Para dados menores)

1. Execute cada query acima no Supabase SQL Editor
2. Copie os resultados em formato JSON
3. Converta para INSERT SQL usando script Python ou ferramenta online
4. Adicione ao arquivo `cloudsql_complete_migration_demonstracao.sql` na seção indicada

### Opção 2: Usar pg_dump (Recomendado para dados grandes)

```bash
# Exportar apenas dados da organização Demonstração
pg_dump \
  --host=<supabase-host> \
  --port=5432 \
  --username=postgres \
  --dbname=postgres \
  --table=establishments \
  --table=business_partners \
  --table=carriers \
  --table=orders \
  --table=invoices \
  --table=invoices_nfe \
  --table=ctes_complete \
  --where="organization_id='8b007dd0-0db6-4288-a1c1-7b05ffb7b32e'" \
  --data-only \
  --inserts \
  > dados_operacionais_demonstracao.sql
```

### Opção 3: Script Python para Conversão

Crie um script Python que:
1. Conecta no Supabase
2. Executa cada query
3. Gera INSERTs SQL formatados
4. Salva em arquivo

Exemplo básico:
```python
import os
from supabase import create_client

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

ORG_ID = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e'

# Extrair establishments
data = supabase.table('establishments')\
    .select('*')\
    .eq('organization_id', ORG_ID)\
    .execute()

# Converter para INSERT SQL
# ... (implementação)
```

---

## Ordem de Inserção Recomendada

Para evitar erros de foreign key, insira nesta ordem:

1. ✅ saas_plans (já incluído)
2. ✅ organizations (já incluído)
3. ✅ environments (já incluído)
4. ✅ users (já incluído)
5. **establishments** ← próximo
6. **rejection_reasons**
7. **holidays**
8. **business_partners**
9. **carriers**
10. **freight_rates**
11. **occurrences**
12. **orders**
13. **invoices**
14. **invoices_nfe**
15. **ctes_complete**
16. **reverse_logistics**

---

## Validação Pós-Migração

Após inserir todos os dados, execute as queries de validação incluídas no final do arquivo SQL:

```sql
SELECT
  'tabela' as tabela,
  COUNT(*) as registros_esperados,
  COUNT(*) as registros_atuais,
  CASE WHEN COUNT(*) = expected THEN 'OK' ELSE 'ERRO' END as status
FROM ...
```

---

## Suporte

Se encontrar problemas:
1. Verifique os logs de erro do PostgreSQL
2. Confirme que o schema está criado corretamente
3. Valide que não há conflitos de foreign keys
4. Para dados XML/JSON muito grandes, considere usar pg_restore ao invés de SQL text

---

**Última atualização:** 2026-02-17
