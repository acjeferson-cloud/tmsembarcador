# Logs Detalhados para Debug de Estabelecimentos

## Logs Adicionados

Foram adicionados logs extremamente detalhados em **TODAS** as etapas do fluxo de carregamento de estabelecimentos para identificar exatamente onde está o problema.

### 📍 Locais com Logs

#### 1. `getUserOrganization()` - Helper Function
**Arquivo:** `/src/services/establishmentsService.ts`

**Logs adicionados:**
- 🔍 Início da função
- 🔍 Verificação do localStorage (tms-user existe ou não)
- 🔍 Parse do JSON do usuário
- 🔍 Email extraído
- 🔍 Início da busca no banco
- 🔍 Resultado da query (encontrado/erro)
- 🔍 organization_id e environment_id retornados
- ✅ Valores finais retornados

**Exemplo de saída esperada:**
```
🔍 [getUserOrganization] INÍCIO
🔍 [getUserOrganization] localStorage tms-user: EXISTE
🔍 [getUserOrganization] userData parseado: {email: "jeferson.costa@gruposmartlog.com.br", nome: "Jeferson Alves da Costa", hasEmail: true}
🔍 [getUserOrganization] Buscando usuário no banco com email: jeferson.costa@gruposmartlog.com.br
🔍 [getUserOrganization] Resultado da query: {encontrado: true, error: undefined, organization_id: "8b007dd0-0db6-4288-a1c1-7b05ffb7b32e", environment_id: "abe69012-4449-4946-977e-46af45790a43"}
✅ [getUserOrganization] Retornando: {organizationId: "8b007dd0-0db6-4288-a1c1-7b05ffb7b32e", environmentId: "abe69012-4449-4946-977e-46af45790a43"}
```

#### 2. `establishmentsService.getAll()` - Busca de Estabelecimentos
**Arquivo:** `/src/services/establishmentsService.ts`

**Logs adicionados:**
- 🏢 Início do método
- 🏢 Resultado de getUserOrganization()
- 🏢 Filtros aplicados na query
- 🏢 Resultado da query (sucesso/erro/contagem)
- 🏢 Lista de estabelecimentos encontrados (com id, codigo, razao_social)
- ⚠️ Aviso se nenhum estabelecimento foi encontrado
- ✅ Quantidade final retornada

**Exemplo de saída esperada:**
```
🏢 [establishmentsService.getAll] INÍCIO
🏢 [establishmentsService.getAll] getUserOrganization retornou: {organizationId: "8b007dd0-0db6-4288-a1c1-7b05ffb7b32e", environmentId: "abe69012-4449-4946-977e-46af45790a43"}
🏢 [establishmentsService.getAll] Iniciando busca com filtros: {organizationId: "8b007dd0-0db6-4288-a1c1-7b05ffb7b32e", environmentId: "abe69012-4449-4946-977e-46af45790a43", table: "establishments"}
🏢 [establishmentsService.getAll] Resultado da query: {success: true, error: undefined, rowCount: 2, hasData: true}
✅ [establishmentsService.getAll] Estabelecimentos encontrados: [{id: "1d717f91-f80c-4d60-bc1b-594aa653624a", codigo: "0001", razao_social: "Abc Indústria..."}, {...}]
✅ [establishmentsService.getAll] FIM - Retornando 2 estabelecimentos
```

#### 3. `loadEstablishments()` - Componente Establishments
**Arquivo:** `/src/components/Establishments/Establishments.tsx`

**Logs adicionados:**
- 🏗️ Início da função
- 🏗️ Verificação do localStorage
- 🏗️ Email do usuário
- 🏗️ Busca de estabelecimentos_permitidos
- 🏗️ Chamada ao service
- 🏗️ Resultado do service (contagem + items)
- 🏗️ Filtro por IDs permitidos (antes/depois)
- 🏗️ Estabelecimentos finais após filtro
- ✅ Quantidade definida no estado
- 🏗️ Fim da função

**Exemplo de saída esperada:**
```
🏗️ [Establishments.loadEstablishments] INÍCIO
🏗️ [Establishments.loadEstablishments] localStorage tms-user: EXISTE
🏗️ [Establishments.loadEstablishments] Email do usuário: jeferson.costa@gruposmartlog.com.br
🏗️ [Establishments.loadEstablishments] Buscando estabelecimentos_permitidos...
🏗️ [Establishments.loadEstablishments] userRecord: {encontrado: true, error: undefined, estabelecimentos_permitidos: ["1d717f91-f80c-4d60-bc1b-594aa653624a", "4d40c285-ea42-40c3-95b0-d47e57a58d4e"]}
🏗️ [Establishments.loadEstablishments] Chamando establishmentsService.getAll()...
🏗️ [Establishments.loadEstablishments] establishmentsService.getAll() retornou: {count: 2, items: [{codigo: "0001", razao_social: "Abc..."}, {...}]}
🏗️ [Establishments.loadEstablishments] Filtrando por IDs permitidos: ["1d717f91-f80c-4d60-bc1b-594aa653624a", "4d40c285-ea42-40c3-95b0-d47e57a58d4e"]
🏗️ [Establishments.loadEstablishments] Após filtro: {antes: 2, depois: 2, filtrados: [{id: "1d717f91-f80c-4d60-bc1b-594aa653624a", codigo: "0001", ...}, {...}]}
✅ [Establishments.loadEstablishments] Definindo estado com 2 estabelecimentos
🏗️ [Establishments.loadEstablishments] FIM
```

## Como Usar os Logs

### 1. Atualizar a Aplicação
```bash
# Força refresh sem cache
Ctrl + Shift + R (ou Cmd + Shift + R no Mac)
```

### 2. Abrir Console do Navegador
```
F12 ou Ctrl + Shift + I
Ir na aba "Console"
```

### 3. Limpar Console
```
Clicar no ícone 🚫 (Clear console)
```

### 4. Fazer Login
```
Email: jeferson.costa@gruposmartlog.com.br
Senha: [sua senha]
```

### 5. Navegar para Estabelecimentos
```
Menu > Configurações > Estabelecimentos
```

### 6. Analisar os Logs

Você verá uma sequência de logs começando com:
- 🔍 Logs de autenticação
- 🏗️ Logs do componente
- 🏢 Logs do service

## Possíveis Problemas e Como Identificar

### ❌ Problema 1: localStorage vazio
**Log esperado:**
```
❌ [getUserOrganization] Usuário não autenticado - localStorage vazio
```
**Causa:** Sessão expirou ou usuário não está logado
**Solução:** Fazer login novamente

### ❌ Problema 2: Email não encontrado no localStorage
**Log esperado:**
```
❌ [getUserOrganization] Email não encontrado no userData
```
**Causa:** Estrutura do localStorage diferente do esperado
**Solução:** Verificar estrutura do `tms-user` no localStorage

### ❌ Problema 3: Usuário não encontrado no banco
**Log esperado:**
```
❌ [getUserOrganization] Perfil do usuário não encontrado no banco
```
**Causa:** Email no localStorage não existe na tabela users
**Solução:** Verificar se o usuário existe no banco de dados

### ❌ Problema 4: organization_id ou environment_id NULL
**Log esperado:**
```
🔍 [getUserOrganization] Resultado da query: {encontrado: true, error: undefined, organization_id: null, environment_id: null}
```
**Causa:** Colunas não preenchidas na tabela users
**Solução:** Atualizar registro do usuário no banco

### ❌ Problema 5: Query retorna array vazio
**Log esperado:**
```
⚠️ [establishmentsService.getAll] Nenhum estabelecimento encontrado
```
**Causa:** Nenhum estabelecimento na tabela com o organization_id e environment_id
**Solução:** Verificar dados na tabela establishments

### ❌ Problema 6: Filtro por IDs remove tudo
**Log esperado:**
```
🏗️ [Establishments.loadEstablishments] Após filtro: {antes: 2, depois: 0, ...}
```
**Causa:** IDs em estabelecimentos_permitidos não correspondem aos IDs dos estabelecimentos
**Solução:** Verificar se os IDs estão corretos

## Códigos de Emoji Usados

- 🔍 = Investigação/Debug
- 🏗️ = Componente/Interface
- 🏢 = Service/Negócio
- ✅ = Sucesso
- ❌ = Erro
- ⚠️ = Aviso

## Próximos Passos

1. **Atualizar a página** (Ctrl+Shift+R)
2. **Abrir console** (F12)
3. **Limpar console** (ícone 🚫)
4. **Fazer login**
5. **Navegar para Estabelecimentos**
6. **Copiar TODOS os logs do console** (clicar direito > Save as...)
7. **Compartilhar os logs** para análise

## Estrutura de Dados Esperada

### localStorage: tms-user
```json
{
  "email": "jeferson.costa@gruposmartlog.com.br",
  "nome": "Jeferson Alves da Costa",
  "id": "2de2abd0-5ea1-47d4-ad49-46177861aecc",
  ...
}
```

### Tabela: users
```sql
SELECT
  email,
  organization_id,
  environment_id,
  estabelecimentos_permitidos
FROM users
WHERE email = 'jeferson.costa@gruposmartlog.com.br';

-- Resultado esperado:
-- organization_id: 8b007dd0-0db6-4288-a1c1-7b05ffb7b32e
-- environment_id: abe69012-4449-4946-977e-46af45790a43
-- estabelecimentos_permitidos: ["1d717f91-f80c-4d60-bc1b-594aa653624a", "4d40c285-ea42-40c3-95b0-d47e57a58d4e"]
```

### Tabela: establishments
```sql
SELECT
  id,
  codigo,
  razao_social,
  organization_id,
  environment_id
FROM establishments
WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e'
  AND environment_id = 'abe69012-4449-4946-977e-46af45790a43';

-- Resultado esperado: 2 registros
```

---

**Com estes logs detalhados, será possível identificar EXATAMENTE onde o fluxo está falhando!**
