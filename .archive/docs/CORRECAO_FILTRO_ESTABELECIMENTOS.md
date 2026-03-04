# Correção: Filtro de Estabelecimentos por Organization + Environment

## Problema Identificado

O admin global estava vendo TODOS os 6 estabelecimentos do sistema, independente da organization/environment selecionada.

**Comportamento Incorreto:**
- Admin seleciona "Demonstração + Produção"
- Sistema mostra TODOS os 6 estabelecimentos (incluindo de outras orgs)

## Solução Implementada

A função `get_user_establishments` foi corrigida para **SEMPRE** filtrar por organization_id e environment_id.

**Comportamento Correto:**
- Admin seleciona "Demonstração + Produção"
- Sistema mostra APENAS os 2 estabelecimentos dessa organização e ambiente

## O que foi Modificado

### Migration: `fix_get_user_establishments_filter_by_orgenv`

**Antes:**
```sql
IF v_is_global_admin THEN
  RETURN QUERY
  SELECT * FROM establishments -- SEM FILTRO! ❌
  ORDER BY e.codigo;
END IF;
```

**Depois:**
```sql
IF v_is_global_admin THEN
  RETURN QUERY
  SELECT * FROM establishments e
  WHERE e.organization_id = p_organization_id -- COM FILTRO! ✅
    AND e.environment_id = p_environment_id
  ORDER BY e.codigo;
END IF;
```

## Testes Realizados

### Teste 1: Demonstração + Produção
```sql
SELECT codigo, razao_social
FROM get_user_establishments(
  'admin@gruposmartlog.com.br',
  '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e', -- Demonstração
  'abe69012-4449-4946-977e-46af45790a43'  -- Produção
);

-- Resultado: 2 estabelecimentos ✅
-- 0001 | Abc Indústria e Comércio de Máquinas Ltda
-- 0002 | Abc Indústria e Comércio de Máquinas Ltda
```

### Teste 2: Quimidrol + Produção
```sql
SELECT codigo, razao_social
FROM get_user_establishments(
  'admin@gruposmartlog.com.br',
  '4ca4fdaa-5f55-48be-9195-3bc14413cb06', -- Quimidrol
  '07f23b7e-471d-4968-a5fe-fd388e739780'  -- Produção
);

-- Resultado: 1 estabelecimento ✅
-- CLI1-001 | Primeiro Cliente Ltda
```

### Teste 3: Demonstração + Sandbox
```sql
SELECT codigo, razao_social
FROM get_user_establishments(
  'admin@gruposmartlog.com.br',
  '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e', -- Demonstração
  'ab23dd7f-42a4-4e55-b340-45433f842337'  -- Sandbox
);

-- Resultado: 2 estabelecimentos ✅
-- 0001 | Abc Indústria e Comércio de Máquinas Ltda (Sandbox)
-- 0002 | Abc Indústria e Comércio de Máquinas Ltda (Sandbox)
```

## Distribuição de Estabelecimentos

### Total no Sistema: 6 estabelecimentos

| Organization | Environment | Estabelecimentos | Códigos |
|-------------|-------------|------------------|---------|
| Demonstração | Produção | 2 | 0001, 0002 |
| Demonstração | Sandbox | 2 | 0001, 0002 |
| Quimidrol | Produção | 1 | CLI1-001 |
| Quimidrol | Homologação | 0 | - |
| Segundo cliente | Produção | 1 | CLI2-001 |

## Vantagem do Admin Global

O admin global pode:
1. **Selecionar QUALQUER organization/environment** (não está limitado a apenas uma)
2. **Ver estabelecimentos de qualquer org/env** (mas apenas os da selecionada)
3. **Trocar de org/env a qualquer momento** (usuários normais não podem)

**Exemplo de uso:**
1. Admin faz login
2. Seleciona "Demonstração + Produção" → Vê 2 estabelecimentos
3. Trabalha com dados dessa org/env
4. Precisa acessar Quimidrol
5. Troca para "Quimidrol + Produção" → Vê 1 estabelecimento
6. Trabalha com dados dessa org/env

## Comparação: Admin Global vs Usuário Normal

### Seletor de Organization/Environment

**Admin Global:**
- Vê lista com 3 organizations e 5 environments
- Pode selecionar qualquer combinação
- Pode trocar depois

**Usuário Normal:**
- Vê apenas 1 organization e 1 environment (o seu)
- Não pode selecionar outros
- Não pode trocar

### Seletor de Estabelecimentos

**Admin Global:**
- Vê todos estabelecimentos da org/env selecionada
- Não vê estabelecimentos de outras org/env

**Usuário Normal:**
- Vê apenas estabelecimentos permitidos (campo `estabelecimentos_permitidos`)
- Se campo vazio, vê todos da sua org/env

### Acesso aos Dados

**Admin Global:**
- Vê pedidos, notas, CTes, etc da org/env selecionada
- RLS policies permitem via `is_global_admin_user()`

**Usuário Normal:**
- Vê apenas dados da sua org/env
- RLS policies filtram automaticamente

## Build

Build realizado com sucesso:
```
✓ built in 1m 48s
```

## Arquivos Modificados

1. `supabase/migrations/fix_get_user_establishments_filter_by_orgenv.sql`
2. `FLUXO_LOGIN_ORGANIZATION_ENVIRONMENT.md` (atualizado)
3. `CORRECAO_FILTRO_ESTABELECIMENTOS.md` (este arquivo)

## Status

✅ **CORRIGIDO**

Agora o sistema funciona corretamente:
- Admin global pode acessar qualquer org/env
- Estabelecimentos são filtrados pela org/env selecionada
- Isolamento de dados funciona corretamente
