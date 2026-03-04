# Auto-Criação de Estabelecimento 0001 para Environments

## Objetivo

Garantir que TODO environment tenha pelo menos um estabelecimento cadastrado, permitindo que o admin global possa acessar qualquer environment criado.

## Problema Anterior

- Environment "Quimidrol Homologação" estava sem estabelecimentos
- Admin global não conseguia acessar esse environment (não aparecia no seletor)
- Novos environments criados não tinham estabelecimentos automaticamente

## Solução Implementada

### 1. Corrigir Environments Vazios

Criado estabelecimento "0001" para o environment que estava vazio:

| Organization | Environment | Estabelecimento Criado |
|-------------|-------------|------------------------|
| Quimidrol | Homologação | 0001 - Estabelecimento Padrão |

**Dados do Estabelecimento Padrão:**
- Código: `0001`
- CNPJ: `00.000.000/0001-00` (temporário)
- IE: `ISENTO`
- Razão Social: `[Nome da Org] - Estabelecimento Padrão`
- Fantasia: `[Nome da Org] - Padrão`
- Endereço: `Endereço Temporário`
- CEP: `00000-000`
- Cidade/Estado: `São Paulo/SP`
- Tipo: `matriz`
- Tracking Prefix: `TMP`

### 2. Trigger Automático

Criado trigger que automaticamente cria estabelecimento "0001" quando um novo environment é criado.

**Função:** `create_default_establishment_for_environment()`
**Trigger:** `trigger_create_default_establishment`

**Como funciona:**
1. Usuário/Sistema cria novo environment
2. Trigger dispara APÓS inserção
3. Busca nome da organização
4. Cria estabelecimento 0001 automaticamente
5. Estabelecimento fica disponível imediatamente

**Teste Realizado:**
```sql
-- Criado environment "Teste Trigger"
INSERT INTO environments (name, slug, type, organization_id)
VALUES ('Teste Trigger', 'teste-trigger', 'sandbox', 'xxx');

-- Verificado: Estabelecimento 0001 criado automaticamente ✅
-- Após teste, environment removido
```

### 3. Acesso Admin Global

O admin global (`admin@gruposmartlog.com.br`) tem acesso implícito a TODOS os estabelecimentos através da função `get_user_establishments`.

**Como funciona:**
- Admin global é detectado por email + perfil
- Retorna TODOS estabelecimentos da org/env selecionada
- Não precisa configurar `estabelecimentos_permitidos` manualmente

## Estado Final do Sistema

### Total de Environments: 5

| Organization | Environment | Tipo | Estabelecimentos | Códigos |
|-------------|-------------|------|------------------|---------|
| Demonstração | Produção | production | 2 | 0001, 0002 |
| Demonstração | Sandbox | sandbox | 2 | 0001, 0002 |
| Quimidrol | Produção | production | 1 | CLI1-001 |
| Quimidrol | Homologação | staging | 1 | **0001** ✅ |
| Segundo cliente | Produção | production | 1 | CLI2-001 |

**Total:** 5 environments, 7 estabelecimentos, **0 environments sem estabelecimentos** ✅

## Fluxo de Criação de Novo Environment

### Via Interface (futuro)
1. Admin cria novo environment
2. Trigger cria estabelecimento 0001 automaticamente
3. Admin pode editar dados do estabelecimento depois
4. Admin pode criar estabelecimentos adicionais (0002, 0003, etc)

### Via SQL (atual)
```sql
INSERT INTO environments (name, slug, type, organization_id)
VALUES ('Novo Environment', 'novo-env', 'production', 'org-id');

-- Estabelecimento 0001 criado automaticamente pelo trigger
```

## Benefícios

### 1. Consistência
- TODOS os environments têm pelo menos um estabelecimento
- Não existe environment órfão

### 2. Acesso Admin Global
- Admin pode selecionar QUALQUER environment
- Sempre vê pelo menos o estabelecimento 0001
- Pode trabalhar imediatamente

### 3. Automação
- Não precisa criar estabelecimento manualmente
- Processo transparente
- Menos erros humanos

### 4. Flexibilidade
- Dados do estabelecimento 0001 são temporários
- Podem ser editados depois
- Novos estabelecimentos podem ser adicionados

## Testes de Acesso do Admin Global

### Teste 1: Demonstração + Produção
```sql
SELECT codigo FROM get_user_establishments(
  'admin@gruposmartlog.com.br',
  'demonstracao-id',
  'producao-id'
);
-- Resultado: 0001, 0002 ✅
```

### Teste 2: Quimidrol + Homologação (recém corrigido)
```sql
SELECT codigo FROM get_user_establishments(
  'admin@gruposmartlog.com.br',
  'quimidrol-id',
  'homologacao-id'
);
-- Resultado: 0001 ✅
```

### Teste 3: Segundo Cliente + Produção
```sql
SELECT codigo FROM get_user_establishments(
  'admin@gruposmartlog.com.br',
  'segundo-cliente-id',
  'producao-id'
);
-- Resultado: CLI2-001 ✅
```

## Arquivos Modificados

### Migration
- `supabase/migrations/auto_create_establishment_0001_for_environments.sql`

### Funções Criadas
- `create_default_establishment_for_environment()` - Cria estabelecimento padrão

### Triggers Criados
- `trigger_create_default_establishment` - Dispara após inserção em environments

### Documentação
- `AUTO_CRIACAO_ESTABELECIMENTO_0001.md` (este arquivo)

## Build

Build realizado com sucesso:
```
✓ built in 1m 38s
```

## Próximos Passos (Opcional)

1. **Interface de Edição:** Permitir editar dados do estabelecimento 0001 via interface
2. **Validação:** Impedir exclusão do último estabelecimento de um environment
3. **Notificação:** Avisar admin quando estabelecimento padrão for criado
4. **Dados Reais:** Pré-preencher com dados reais da organização (se disponível)

## Status

✅ **IMPLEMENTADO E TESTADO**

- Environments vazios corrigidos
- Trigger funcionando perfeitamente
- Admin global tem acesso total
- Sistema pronto para produção
