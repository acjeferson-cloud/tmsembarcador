# TMS - Automação de Testes E2E com Playwright

## 📋 Índice
- [Visão Geral](#visão-geral)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Instalação](#instalação)
- [Executando os Testes](#executando-os-testes)
- [Escrevendo Novos Testes](#escrevendo-novos-testes)
- [Boas Práticas](#boas-práticas)
- [Relatórios](#relatórios)

## 🎯 Visão Geral

Este projeto contém a suite completa de testes automatizados E2E para o TMS (Transportation Management System) utilizando **Playwright** como framework principal.

### Cobertura Atual

**Módulo Configurações:**
- ✅ Estabelecimentos (CRUD + Validações)
- ✅ Usuários (CRUD + Validações)
- ✅ Países (CRUD + Validações)
- ✅ Estados (CRUD + Validações)

### Tipos de Testes

1. **CRUD Operations** - Criar, Ler, Atualizar, Deletar
2. **Field Validations** - Validações de campos obrigatórios, formatos, máscaras
3. **Navigation** - Navegação entre menus e telas
4. **Functional Flows** - Fluxos funcionais completos

## 📁 Estrutura do Projeto

```
e2e/
├── config/
│   └── test.config.ts          # Configurações globais
├── fixtures/
│   ├── establishments.fixture.ts
│   ├── users.fixture.ts
│   ├── countries.fixture.ts
│   └── states.fixture.ts
├── page-objects/
│   ├── base/
│   │   ├── BasePage.ts         # Page Object base
│   │   └── LoginPage.ts        # Login page
│   └── settings/
│       ├── EstablishmentsPage.ts
│       ├── UsersPage.ts
│       ├── CountriesPage.ts
│       └── StatesPage.ts
├── tests/
│   ├── navigation/             # Testes de navegação
│   └── settings/
│       ├── establishments/
│       │   ├── establishments.crud.spec.ts
│       │   └── establishments.validation.spec.ts
│       ├── users/
│       ├── countries/
│       └── states/
├── utils/
│   └── test-helpers.ts         # Funções auxiliares
└── reports/                    # Relatórios gerados
```

## 🚀 Instalação

### Pré-requisitos
- Node.js 16+
- npm ou yarn

### Instalar Dependências

```bash
# Instalar Playwright
npm install -D @playwright/test

# Instalar browsers
npx playwright install
```

### Configurar Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
BASE_URL=http://localhost:5173
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

## 🧪 Executando os Testes

### Todos os Testes

```bash
# Rodar todos os testes
npx playwright test

# Rodar com interface gráfica
npx playwright test --ui

# Rodar em modo debug
npx playwright test --debug
```

### Testes Específicos

```bash
# Rodar apenas testes de Estabelecimentos
npx playwright test e2e/tests/settings/establishments

# Rodar apenas CRUD
npx playwright test establishments.crud

# Rodar apenas validações
npx playwright test establishments.validation
```

### Por Módulo

```bash
# Estabelecimentos
npx playwright test establishments

# Usuários
npx playwright test users

# Países
npx playwright test countries

# Estados
npx playwright test states
```

### Por Browser

```bash
# Apenas Chrome
npx playwright test --project=chromium

# Apenas Firefox
npx playwright test --project=firefox

# Apenas Safari
npx playwright test --project=webkit
```

### Executar em Paralelo

```bash
# 4 workers
npx playwright test --workers=4

# Modo sequencial
npx playwright test --workers=1
```

## ✍️ Escrevendo Novos Testes

### 1. Criar Page Object

```typescript
// e2e/page-objects/settings/NewModulePage.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base/BasePage';

export class NewModulePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/configuracoes/new-module');
    await this.waitForPageLoad();
  }

  get addButton(): Locator {
    return this.page.locator('button:has-text("Adicionar")');
  }

  // Add more locators and methods...
}
```

### 2. Criar Fixtures

```typescript
// e2e/fixtures/newmodule.fixture.ts
export const NEWMODULE_FIXTURES = {
  valid: {
    codigo: 'TEST001',
    nome: 'Test Name',
  },
  invalid: {
    emptyCodigo: { codigo: '' },
  },
};
```

### 3. Criar Testes

```typescript
// e2e/tests/settings/newmodule/newmodule.crud.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../page-objects/base/LoginPage';
import { NewModulePage } from '../../../page-objects/settings/NewModulePage';

test.describe('New Module - CRUD', () => {
  let loginPage: LoginPage;
  let newModulePage: NewModulePage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    newModulePage = new NewModulePage(page);

    await loginPage.loginAsAdmin();
    await newModulePage.goto();
  });

  test('Deve criar novo registro', async () => {
    // Test implementation
  });
});
```

## 📊 Relatórios

### HTML Report

```bash
# Gerar e abrir relatório HTML
npx playwright show-report
```

O relatório HTML é gerado automaticamente em `e2e/reports/html-report/`

### Outros Formatos

- **JSON**: `e2e/reports/test-results.json`
- **JUnit**: `e2e/reports/junit.xml`

### Screenshots e Vídeos

- Screenshots são capturados automaticamente em caso de falha
- Vídeos são gravados para testes que falharem
- Arquivos salvos em `test-results/`

## 🎯 Boas Práticas

### 1. Use Page Objects

✅ **BOM:**
```typescript
await establishmentsPage.createEstablishment(data);
```

❌ **RUIM:**
```typescript
await page.fill('input[name="codigo"]', 'TEST001');
await page.fill('input[name="nome"]', 'Test');
await page.click('button[type="submit"]');
```

### 2. Use Fixtures

✅ **BOM:**
```typescript
await establishmentsPage.createEstablishment(ESTABLISHMENT_FIXTURES.valid);
```

❌ **RUIM:**
```typescript
await establishmentsPage.createEstablishment({
  codigo: 'TEST001',
  nome: 'Test Name',
  // ...
});
```

### 3. Organize por Describe

```typescript
test.describe('Module - Feature', () => {
  test.describe('CREATE Operations', () => {
    test('Deve criar com sucesso', () => {});
    test('Deve validar campos', () => {});
  });

  test.describe('UPDATE Operations', () => {
    test('Deve atualizar', () => {});
  });
});
```

### 4. Use beforeEach para Setup

```typescript
test.beforeEach(async ({ page }) => {
  await loginPage.loginAsAdmin();
  await modulePage.goto();
});
```

### 5. Espere por Elementos

```typescript
// Aguarde elementos estarem visíveis
await expect(page.locator('button')).toBeVisible();

// Use waitFor quando necessário
await page.waitForLoadState('networkidle');
```

### 6. Cleanup após Testes

```typescript
test.afterEach(async () => {
  // Limpar dados de teste
  await helpers.clearTestData('TEST_');
});
```

## 🔧 Configuração Avançada

### Timeouts

```typescript
// playwright.config.ts
use: {
  actionTimeout: 15000,
  navigationTimeout: 30000,
}
```

### Retry

```typescript
// playwright.config.ts
retries: process.env.CI ? 2 : 0,
```

### Parallelização

```typescript
// playwright.config.ts
workers: process.env.CI ? 1 : 4,
fullyParallel: true,
```

## 🐛 Debug

### Modo Debug

```bash
# Debug um teste específico
npx playwright test --debug establishments.crud
```

### Trace Viewer

```bash
# Visualizar trace de uma execução
npx playwright show-trace trace.zip
```

### Pausar Execução

```typescript
test('meu teste', async ({ page }) => {
  await page.pause(); // Pausa aqui
});
```

## 📝 Convenções

### Nomenclatura de Arquivos
- **Page Objects**: `ModulePage.ts`
- **Fixtures**: `module.fixture.ts`
- **Tests**: `module.operation.spec.ts`

### Nomenclatura de Testes
- Use português
- Seja descritivo
- Use "Deve" no início

```typescript
test('Deve criar estabelecimento com sucesso', () => {});
test('Não deve permitir código duplicado', () => {});
```

### Commits
- `test: adiciona testes CRUD para Estabelecimentos`
- `test: adiciona validações de campos para Usuários`
- `test: corrige teste de navegação`

## 🚦 CI/CD

### GitHub Actions (Exemplo)

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: e2e/reports/
```

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique a [documentação do Playwright](https://playwright.dev)
2. Consulte os exemplos nos testes existentes
3. Entre em contato com a equipe de QA

## 🔄 Próximos Passos

- [ ] Adicionar testes para módulo de Transportadoras
- [ ] Adicionar testes para módulo de Tabelas de Frete
- [ ] Implementar testes de performance
- [ ] Adicionar testes de acessibilidade
- [ ] Integrar com CI/CD
- [ ] Adicionar testes de API
- [ ] Implementar testes visuais (screenshots)

---

**Versão**: 1.0.0
**Última Atualização**: 2025-11-14
