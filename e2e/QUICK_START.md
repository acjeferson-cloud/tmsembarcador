# 🚀 Quick Start - Testes E2E do TMS

## Início Rápido em 3 Passos

### 1️⃣ Instalar Browsers do Playwright

```bash
npx playwright install
```

### 2️⃣ Rodar os Testes

```bash
# Todos os testes
npm run test:e2e

# Com interface gráfica (recomendado para desenvolvimento)
npm run test:e2e:ui
```

### 3️⃣ Ver Relatórios

```bash
npm run test:e2e:report
```

---

## 📋 Comandos Principais

| Comando | Descrição |
|---------|-----------|
| `npm run test:e2e` | Roda todos os testes |
| `npm run test:e2e:ui` | Interface gráfica interativa |
| `npm run test:e2e:debug` | Modo debug |
| `npm run test:e2e:report` | Abre relatório HTML |
| `npm run test:e2e:chromium` | Apenas Chrome |
| `npm run test:e2e:firefox` | Apenas Firefox |
| `npm run test:e2e:webkit` | Apenas Safari |

---

## 📂 Estrutura Criada

```
e2e/
├── config/              ✅ Configurações
├── fixtures/            ✅ Dados de teste
├── page-objects/        ✅ Page Objects Pattern
│   ├── base/           ✅ Classes base (Login, BasePage)
│   └── settings/       ✅ Configurações (4 módulos)
├── tests/              ✅ Suites de testes
│   ├── navigation/     ✅ Testes de navegação
│   └── settings/       ✅ Testes de configurações
├── utils/              ✅ Helpers e utilitários
└── reports/            📊 Relatórios gerados
```

---

## 🎯 Módulos Implementados

### ✅ Estabelecimentos
- CRUD Completo
- Validações de campos
- Máscaras (CNPJ, CEP, Telefone)
- Busca de CEP via API
- Unicidade de dados

### ✅ Usuários
- CRUD Completo
- Validações de senha
- Perfis de acesso
- Status (Ativo/Bloqueado)

### ✅ Países
- CRUD Completo
- Continentes
- Códigos ISO
- DDI e Moedas

### ✅ Estados
- CRUD Completo
- Regiões do Brasil
- Códigos IBGE
- Mapa do Brasil interativo

---

## 🧪 Exemplo de Teste

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/base/LoginPage';
import { EstablishmentsPage } from '../page-objects/settings/EstablishmentsPage';

test('Deve criar estabelecimento', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const establishmentsPage = new EstablishmentsPage(page);

  await loginPage.loginAsAdmin();
  await establishmentsPage.goto();
  await establishmentsPage.createEstablishment({
    // dados do estabelecimento
  });

  await expect(page.locator('text=/sucesso/i')).toBeVisible();
});
```

---

## 📊 Tipos de Testes

### 1. CRUD (Create, Read, Update, Delete)
```bash
npx playwright test establishments.crud
```

### 2. Validações de Campos
```bash
npx playwright test establishments.validation
```

### 3. Navegação
```bash
npx playwright test navigation
```

---

## 🔍 Debug de Testes

### Modo Debug Interativo
```bash
npm run test:e2e:debug
```

### Pausar em Ponto Específico
```typescript
test('meu teste', async ({ page }) => {
  await page.pause(); // ⏸️ Pausa aqui
  // ...
});
```

### Ver Trace de Execução
```bash
npx playwright show-trace trace.zip
```

---

## 📸 Screenshots e Vídeos

- **Screenshots**: Capturados automaticamente em falhas
- **Vídeos**: Gravados para testes com falha
- **Localização**: `test-results/`

---

## 🎨 Interface Gráfica

A interface do Playwright UI permite:

- ✅ Ver todos os testes em árvore
- ✅ Rodar testes individualmente
- ✅ Ver execução em tempo real
- ✅ Inspecionar locators
- ✅ Time travel debugging
- ✅ Ver console e network

```bash
npm run test:e2e:ui
```

---

## 🌐 Browsers Suportados

| Browser | Projeto | Comando |
|---------|---------|---------|
| Chrome | `chromium` | `npm run test:e2e:chromium` |
| Firefox | `firefox` | `npm run test:e2e:firefox` |
| Safari | `webkit` | `npm run test:e2e:webkit` |
| Mobile Chrome | `mobile-chrome` | Incluído no `test:e2e` |
| Mobile Safari | `mobile-safari` | Incluído no `test:e2e` |

---

## ⚙️ Configuração Personalizada

### Timeout
Edite `playwright.config.ts`:
```typescript
use: {
  actionTimeout: 15000,  // 15 segundos
  navigationTimeout: 30000, // 30 segundos
}
```

### Retry
```typescript
retries: 2, // Retry 2 vezes em caso de falha
```

### Workers
```typescript
workers: 4, // Executa 4 testes em paralelo
```

---

## 📝 Criar Novo Teste

### 1. Criar Page Object
```typescript
// e2e/page-objects/settings/NewPage.ts
export class NewPage extends BasePage {
  async goto() {
    await this.page.goto('/new-path');
  }
}
```

### 2. Criar Fixtures
```typescript
// e2e/fixtures/new.fixture.ts
export const NEW_FIXTURES = {
  valid: { /* dados */ },
  invalid: { /* dados */ }
};
```

### 3. Criar Teste
```typescript
// e2e/tests/settings/new/new.crud.spec.ts
test('Deve criar', async ({ page }) => {
  // implementação
});
```

---

## 🐛 Troubleshooting

### Erro: Browser not found
```bash
npx playwright install
```

### Erro: Port already in use
```bash
# Matar processo na porta 5173
npx kill-port 5173
```

### Teste Timeout
Aumente o timeout:
```typescript
test('meu teste', async ({ page }) => {
  test.setTimeout(60000); // 60 segundos
});
```

---

## 📚 Recursos

- [Documentação Playwright](https://playwright.dev)
- [README Completo](./README.md)
- [Best Practices](https://playwright.dev/docs/best-practices)

---

## 🎯 Próximos Passos

1. Execute os testes existentes
2. Familiarize-se com os Page Objects
3. Estude os fixtures
4. Crie seus primeiros testes
5. Adicione novos módulos

---

**🚀 Pronto para começar!**

```bash
npm run test:e2e:ui
```
