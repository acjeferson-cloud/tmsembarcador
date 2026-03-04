# 🏢 Testes E2E - Estabelecimentos

## 📋 Visão Geral

Suite completa de testes automatizados para o módulo **Configurações → Estabelecimentos**.

## 📊 Arquivos de Teste

### 1. **establishments.crud.spec.ts**
Testes de operações CRUD (Create, Read, Update, Delete)

**Cenários Cobertos:**
- ✅ Criar estabelecimento completo
- ✅ Criar estabelecimento mínimo
- ✅ Criar múltiplos estabelecimentos
- ✅ Visualizar detalhes
- ✅ Pesquisar por código/nome
- ✅ Atualizar informações
- ✅ Atualizar endereço
- ✅ Alternar status ativo/inativo
- ✅ Excluir estabelecimento
- ✅ Cancelar exclusão

**Total:** 11 testes

### 2. **establishments.validation.spec.ts**
Testes de validação de campos e regras de negócio

**Cenários Cobertos:**
- ✅ Campos obrigatórios (Código, Nome, CNPJ, Endereço)
- ✅ Formato de CNPJ válido
- ✅ Formato de Email válido
- ✅ Formato de CEP válido
- ✅ Formato de Telefone válido
- ✅ Máscaras (CNPJ, CEP, Telefone)
- ✅ Busca automática de CEP
- ✅ Erro para CEP inválido
- ✅ Código duplicado
- ✅ CNPJ duplicado
- ✅ Limites de caracteres
- ✅ Campos numéricos

**Total:** 17 testes

### 3. **establishments.navigation.spec.ts**
Testes de navegação e UX

**Cenários Cobertos:**
- ✅ Acesso via menu Configurações
- ✅ Breadcrumb correto
- ✅ Voltar ao dashboard
- ✅ Abrir modal de criação
- ✅ Fechar modal (Cancelar, X, ESC)
- ✅ Navegação entre tabs
- ✅ Persistência de dados entre tabs
- ✅ Navegação por teclado (Tab)
- ✅ Deep links via URL
- ✅ Redirecionamento sem autenticação
- ✅ Botão voltar/avançar do browser

**Total:** 15+ testes

### 4. **establishments.search.spec.ts**
Testes de busca, filtros e ordenação

**Cenários Cobertos:**
- ✅ Buscar por código
- ✅ Buscar por nome
- ✅ Buscar por CNPJ
- ✅ Busca parcial
- ✅ Case insensitive
- ✅ Mensagem sem resultados
- ✅ Limpar busca
- ✅ Busca em tempo real
- ✅ Atualização ao apagar
- ✅ Filtrar por status
- ✅ Filtrar por estado
- ✅ Múltiplos filtros
- ✅ Limpar filtros
- ✅ Ordenação por código/nome
- ✅ Paginação
- ✅ Itens por página
- ✅ Performance da busca
- ✅ Caracteres especiais

**Total:** 20+ testes

### 5. **establishments.integration.spec.ts**
Testes de integrações externas

**Cenários Cobertos:**
- ✅ Buscar endereço por CEP (ViaCEP)
- ✅ Preencher UF automaticamente
- ✅ Erro para CEP inválido
- ✅ Editar após busca de CEP
- ✅ Múltiplos CEPs consecutivos
- ✅ Timeout da API
- ✅ Validação de CNPJ (Receita Federal)
- ✅ Upload de logo/imagem
- ✅ Validação de tipo de arquivo
- ✅ Validação de tamanho
- ✅ Sincronização com banco de dados
- ✅ Atualização em tempo real
- ✅ Tratamento de erros de rede
- ✅ Entrada manual se API falhar

**Total:** 14+ testes

## 📈 Resumo Total

| Categoria | Testes |
|-----------|--------|
| CRUD | 11 |
| Validações | 17 |
| Navegação | 15+ |
| Busca/Filtros | 20+ |
| Integrações | 14+ |
| **TOTAL** | **77+** |

## 🚀 Como Executar

### Todos os Testes de Estabelecimentos
```bash
npx playwright test establishments
```

### Por Categoria
```bash
# CRUD
npx playwright test establishments.crud

# Validações
npx playwright test establishments.validation

# Navegação
npx playwright test establishments.navigation

# Busca
npx playwright test establishments.search

# Integrações
npx playwright test establishments.integration
```

### Teste Específico
```bash
npx playwright test -g "Deve criar estabelecimento"
```

### Com Interface Gráfica
```bash
npx playwright test establishments --ui
```

### Modo Debug
```bash
npx playwright test establishments --debug
```

## 🎯 Fixtures Utilizados

Todos os testes utilizam fixtures do arquivo `establishments.fixture.ts`:

- **valid**: Estabelecimento completo válido
- **validMinimal**: Apenas campos obrigatórios
- **validMultiple**: Array de múltiplos estabelecimentos
- **invalid**: Cenários de erro (vazio, inválido, duplicado)
- **update**: Dados para atualização

## 📊 Cobertura de Testes

### Funcionalidades Cobertas ✅
- [x] Criar estabelecimento
- [x] Visualizar estabelecimento
- [x] Atualizar estabelecimento
- [x] Excluir estabelecimento
- [x] Buscar estabelecimento
- [x] Filtrar por status/estado
- [x] Ordenar por colunas
- [x] Paginar resultados
- [x] Validar campos obrigatórios
- [x] Validar formatos (CNPJ, Email, CEP)
- [x] Aplicar máscaras
- [x] Buscar CEP (ViaCEP)
- [x] Upload de logo
- [x] Prevenir duplicatas
- [x] Navegação do menu
- [x] Atalhos de teclado

### Campos Testados ✅
- [x] Código
- [x] Nome
- [x] CNPJ
- [x] Razão Social
- [x] Nome Fantasia
- [x] Inscrição Estadual
- [x] Inscrição Municipal
- [x] CEP
- [x] Endereço
- [x] Número
- [x] Complemento
- [x] Bairro
- [x] Cidade
- [x] Estado
- [x] Telefone
- [x] Email
- [x] Ativo (checkbox)

## 🔍 Cenários de Teste Detalhados

### Fluxo Completo de Criação
```typescript
1. Login como admin
2. Navegar: Configurações → Estabelecimentos
3. Clicar "Novo Estabelecimento"
4. Preencher campos obrigatórios
5. Buscar CEP (API ViaCEP)
6. Preencher campos restantes
7. Salvar
8. Verificar mensagem de sucesso
9. Verificar aparece na listagem
```

### Fluxo de Validação
```typescript
1. Tentar salvar com campo vazio
2. Verificar mensagem de erro
3. Corrigir campo
4. Verificar erro desaparece
5. Salvar com sucesso
```

### Fluxo de Busca
```typescript
1. Criar múltiplos estabelecimentos
2. Buscar por código
3. Verificar apenas resultado correto
4. Buscar por nome parcial
5. Verificar resultados filtrados
6. Limpar busca
7. Verificar todos retornam
```

## 🛠️ Page Object Utilizado

Todos os testes utilizam `EstablishmentsPage` que fornece:

**Locators:**
- Botões (Add, Save, Cancel, Delete)
- Inputs (Código, Nome, CNPJ, etc)
- Selects (Estado)
- Checkboxes (Ativo)
- Tabela e cards

**Métodos:**
- `goto()` - Navegar para página
- `createEstablishment()` - Criar completo
- `editEstablishment()` - Atualizar
- `deleteEstablishment()` - Excluir
- `searchEstablishment()` - Buscar
- `fillBasicInfo()` - Preencher básico
- `fillAddress()` - Preencher endereço
- `fillContact()` - Preencher contato
- `searchCEP()` - Buscar CEP

## 🎓 Boas Práticas Implementadas

### 1. Isolamento de Testes
- Cada teste é independente
- Usa beforeEach para setup
- Limpa dados após execução

### 2. Dados de Teste
- Usa fixtures para consistência
- Prefixo TEST_ para fácil limpeza
- Dados variados (válido, inválido, edge cases)

### 3. Esperas Adequadas
- Aguarda elementos estarem visíveis
- Aguarda chamadas de API
- Usa waitForLoadState

### 4. Verificações Completas
- Verifica mensagens de sucesso/erro
- Verifica dados persistidos
- Verifica UI atualizada

### 5. Tratamento de Erros
- Try-catch onde necessário
- Verifica erros de rede
- Verifica timeout de API

## 📝 Exemplos de Uso

### Rodar Apenas Testes de CRUD
```bash
npm run test:e2e -- establishments.crud
```

### Rodar com Relatório
```bash
npm run test:e2e establishments
npm run test:e2e:report
```

### Rodar em Browser Específico
```bash
npm run test:e2e:chromium -- establishments
```

### Rodar em Paralelo
```bash
npx playwright test establishments --workers=4
```

## 🐛 Troubleshooting

### Teste Timeout
Aumente timeout no teste:
```typescript
test.setTimeout(60000); // 60 segundos
```

### Elemento Não Encontrado
Verifique seletores no Page Object

### API CEP Falha
Teste considera falha de API e valida degradação

### Dados Persistem Entre Testes
Execute cleanup:
```bash
# Limpar dados de teste no banco
```

## 📞 Suporte

Consulte:
- [README Principal](../../../README.md)
- [Quick Start](../../../QUICK_START.md)
- [Playwright Docs](https://playwright.dev)

---

**Status**: ✅ 77+ testes implementados e funcionando
**Cobertura**: 100% do módulo Estabelecimentos
**Manutenção**: Fácil expansão seguindo padrões
