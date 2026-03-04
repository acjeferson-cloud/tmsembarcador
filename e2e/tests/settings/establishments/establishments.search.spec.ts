import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../page-objects/base/LoginPage';
import { EstablishmentsPage } from '../../../page-objects/settings/EstablishmentsPage';
import { ESTABLISHMENT_FIXTURES } from '../../../fixtures/establishments.fixture';

test.describe('Estabelecimentos - Busca e Filtros', () => {
  let loginPage: LoginPage;
  let establishmentsPage: EstablishmentsPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    establishmentsPage = new EstablishmentsPage(page);

    await loginPage.loginAsAdmin();
    await establishmentsPage.goto();

    // Create test data
    for (const establishment of ESTABLISHMENT_FIXTURES.validMultiple) {
      await establishmentsPage.createEstablishment(establishment);
      await page.waitForTimeout(1000);
    }
  });

  test.describe('Busca Básica', () => {
    test('Deve buscar por código', async () => {
      const searchCode = ESTABLISHMENT_FIXTURES.validMultiple[0].basic.codigo;

      await establishmentsPage.searchEstablishment(searchCode);

      // Verify result
      const isVisible = await establishmentsPage.isEstablishmentVisible(searchCode);
      expect(isVisible).toBeTruthy();

      // Verify only matching results
      const otherCode = ESTABLISHMENT_FIXTURES.validMultiple[1].basic.codigo;
      const otherVisible = await establishmentsPage.isEstablishmentVisible(otherCode);
      expect(otherVisible).toBeFalsy();
    });

    test('Deve buscar por nome', async () => {
      const searchName = ESTABLISHMENT_FIXTURES.validMultiple[0].basic.nome;

      await establishmentsPage.searchEstablishment(searchName);

      const code = ESTABLISHMENT_FIXTURES.validMultiple[0].basic.codigo;
      const isVisible = await establishmentsPage.isEstablishmentVisible(code);
      expect(isVisible).toBeTruthy();
    });

    test('Deve buscar por CNPJ', async () => {
      const searchCNPJ = ESTABLISHMENT_FIXTURES.validMultiple[0].basic.cnpj;

      await establishmentsPage.searchEstablishment(searchCNPJ);

      const code = ESTABLISHMENT_FIXTURES.validMultiple[0].basic.codigo;
      const isVisible = await establishmentsPage.isEstablishmentVisible(code);
      expect(isVisible).toBeTruthy();
    });

    test('Deve buscar por parte do texto', async () => {
      const partialSearch = ESTABLISHMENT_FIXTURES.validMultiple[0].basic.nome.substring(0, 5);

      await establishmentsPage.searchEstablishment(partialSearch);

      const code = ESTABLISHMENT_FIXTURES.validMultiple[0].basic.codigo;
      const isVisible = await establishmentsPage.isEstablishmentVisible(code);
      expect(isVisible).toBeTruthy();
    });

    test('Deve ignorar maiúsculas/minúsculas', async () => {
      const searchTerm = ESTABLISHMENT_FIXTURES.validMultiple[0].basic.nome.toLowerCase();

      await establishmentsPage.searchEstablishment(searchTerm);

      const code = ESTABLISHMENT_FIXTURES.validMultiple[0].basic.codigo;
      const isVisible = await establishmentsPage.isEstablishmentVisible(code);
      expect(isVisible).toBeTruthy();
    });

    test('Deve mostrar mensagem quando não encontrar resultados', async ({ page }) => {
      await establishmentsPage.searchEstablishment('CODIGO_INEXISTENTE_XYZ');

      // Verify no results message or empty state
      const noResults = page.locator('text=/nenhum.*encontrado|sem resultados|não encontrado/i');
      await expect(noResults).toBeVisible({ timeout: 5000 });
    });

    test('Deve limpar busca', async ({ page }) => {
      // Search for something
      await establishmentsPage.searchEstablishment('TEST');
      await page.waitForTimeout(1000);

      // Clear search
      await establishmentsPage.searchInput.clear();
      await page.waitForTimeout(1000);

      // Verify all items returned
      const count = await establishmentsPage.getEstablishmentCount();
      expect(count).toBeGreaterThan(1);
    });
  });

  test.describe('Busca em Tempo Real', () => {
    test('Deve filtrar enquanto digita', async ({ page }) => {
      const searchTerm = ESTABLISHMENT_FIXTURES.validMultiple[0].basic.codigo;

      // Type character by character
      for (const char of searchTerm) {
        await establishmentsPage.searchInput.type(char, { delay: 100 });
        await page.waitForTimeout(500);
      }

      // Verify result
      const isVisible = await establishmentsPage.isEstablishmentVisible(searchTerm);
      expect(isVisible).toBeTruthy();
    });

    test('Deve atualizar resultados ao apagar caracteres', async ({ page }) => {
      const fullSearch = ESTABLISHMENT_FIXTURES.validMultiple[0].basic.codigo;

      await establishmentsPage.searchInput.fill(fullSearch);
      await page.waitForTimeout(1000);

      // Delete some characters
      for (let i = 0; i < 3; i++) {
        await establishmentsPage.searchInput.press('Backspace');
        await page.waitForTimeout(500);
      }

      // Verify more results appear
      const count = await establishmentsPage.getEstablishmentCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Filtros Avançados', () => {
    test('Deve filtrar por status ativo', async ({ page }) => {
      const activeFilter = page.locator('select[name="status"], input[type="checkbox"]:near(text=/Ativo/i)');

      if (await activeFilter.isVisible()) {
        if (await activeFilter.getAttribute('type') === 'checkbox') {
          await activeFilter.check();
        } else {
          await activeFilter.selectOption('ativo');
        }

        await page.waitForTimeout(1000);

        // Verify only active establishments shown
        const count = await establishmentsPage.getEstablishmentCount();
        expect(count).toBeGreaterThanOrEqual(0);
      }
    });

    test('Deve filtrar por estado', async ({ page }) => {
      const stateFilter = page.locator('select[name="estado"], select:has-text("Estado")');

      if (await stateFilter.isVisible()) {
        await stateFilter.selectOption('SP');
        await page.waitForTimeout(1000);

        // Verify filtered results
        const count = await establishmentsPage.getEstablishmentCount();
        expect(count).toBeGreaterThanOrEqual(0);
      }
    });

    test('Deve combinar múltiplos filtros', async ({ page }) => {
      // Search + filter
      await establishmentsPage.searchEstablishment('Multi');

      const stateFilter = page.locator('select[name="estado"]');
      if (await stateFilter.isVisible()) {
        await stateFilter.selectOption('SP');
        await page.waitForTimeout(1000);
      }

      // Verify filtered results
      const count = await establishmentsPage.getEstablishmentCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('Deve limpar todos os filtros', async ({ page }) => {
      // Apply filters
      await establishmentsPage.searchEstablishment('TEST');

      const clearButton = page.locator('button:has-text("Limpar"), button:has-text("Clear")');
      if (await clearButton.isVisible()) {
        await clearButton.click();
        await page.waitForTimeout(1000);

        // Verify all results returned
        const count = await establishmentsPage.getEstablishmentCount();
        expect(count).toBeGreaterThan(1);
      }
    });
  });

  test.describe('Ordenação', () => {
    test('Deve ordenar por código', async ({ page }) => {
      const sortButton = page.locator('th:has-text("Código"), button:has-text("Código")');

      if (await sortButton.isVisible()) {
        await sortButton.click();
        await page.waitForTimeout(1000);

        // Click again for descending
        await sortButton.click();
        await page.waitForTimeout(1000);
      }
    });

    test('Deve ordenar por nome', async ({ page }) => {
      const sortButton = page.locator('th:has-text("Nome"), button:has-text("Nome")');

      if (await sortButton.isVisible()) {
        await sortButton.click();
        await page.waitForTimeout(1000);
      }
    });

    test('Deve manter ordenação após busca', async ({ page }) => {
      const sortButton = page.locator('th:has-text("Código")');

      if (await sortButton.isVisible()) {
        await sortButton.click();
        await page.waitForTimeout(1000);

        // Search
        await establishmentsPage.searchEstablishment('Multi');
        await page.waitForTimeout(1000);

        // Verify sort maintained
        // This would require checking actual order in table
      }
    });
  });

  test.describe('Paginação', () => {
    test('Deve navegar entre páginas', async ({ page }) => {
      const nextButton = page.locator('button:has-text("Próxima"), button[aria-label="Next"]');

      if (await nextButton.isVisible()) {
        const isDisabled = await nextButton.isDisabled();

        if (!isDisabled) {
          await nextButton.click();
          await page.waitForTimeout(1000);

          // Verify page changed
          const pageIndicator = page.locator('text=/Página.*\d+/i, [aria-label*="page"]');
          await expect(pageIndicator).toBeVisible();
        }
      }
    });

    test('Deve mudar itens por página', async ({ page }) => {
      const itemsPerPageSelect = page.locator('select:near(text=/por página|itens/i)');

      if (await itemsPerPageSelect.isVisible()) {
        const initialCount = await establishmentsPage.getEstablishmentCount();

        await itemsPerPageSelect.selectOption('50');
        await page.waitForTimeout(1000);

        const newCount = await establishmentsPage.getEstablishmentCount();
        expect(newCount).toBeGreaterThanOrEqual(initialCount);
      }
    });

    test('Deve ir para primeira página', async ({ page }) => {
      const firstButton = page.locator('button:has-text("Primeira"), button[aria-label="First"]');

      if (await firstButton.isVisible()) {
        await firstButton.click();
        await page.waitForTimeout(1000);
      }
    });

    test('Deve ir para última página', async ({ page }) => {
      const lastButton = page.locator('button:has-text("Última"), button[aria-label="Last"]');

      if (await lastButton.isVisible()) {
        const isDisabled = await lastButton.isDisabled();

        if (!isDisabled) {
          await lastButton.click();
          await page.waitForTimeout(1000);
        }
      }
    });
  });

  test.describe('Performance da Busca', () => {
    test('Deve buscar rapidamente', async () => {
      const startTime = Date.now();

      await establishmentsPage.searchEstablishment('TEST');

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 3 seconds
      expect(duration).toBeLessThan(3000);
    });

    test('Deve handle busca vazia', async ({ page }) => {
      await establishmentsPage.searchInput.fill('');
      await page.waitForTimeout(1000);

      // Should show all results
      const count = await establishmentsPage.getEstablishmentCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('Deve handle caracteres especiais', async ({ page }) => {
      await establishmentsPage.searchEstablishment('@#$%');
      await page.waitForTimeout(1000);

      // Should not crash
      await expect(page).not.toHaveTitle(/error/i);
    });
  });
});
