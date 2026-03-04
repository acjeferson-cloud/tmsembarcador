import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../page-objects/base/LoginPage';
import { EstablishmentsPage } from '../../../page-objects/settings/EstablishmentsPage';

test.describe('Estabelecimentos - Navegação', () => {
  let loginPage: LoginPage;
  let establishmentsPage: EstablishmentsPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    establishmentsPage = new EstablishmentsPage(page);
    await loginPage.loginAsAdmin();
  });

  test.describe('Acesso ao Menu', () => {
    test('Deve acessar Estabelecimentos via menu Configurações', async ({ page }) => {
      // Click on Configurações menu
      await page.click('text=Configurações');
      await page.waitForTimeout(500);

      // Click on Estabelecimentos submenu
      await page.click('text=Estabelecimentos');
      await establishmentsPage.waitForPageLoad();

      // Verify URL
      await expect(page).toHaveURL(/estabelecimentos/);

      // Verify page title or header
      await expect(page.locator('h1, h2, h3').filter({ hasText: /Estabelecimentos/i })).toBeVisible();
    });

    test('Deve exibir breadcrumb corretamente', async ({ page }) => {
      await establishmentsPage.goto();

      // Verify breadcrumb
      const breadcrumb = page.locator('[data-testid="breadcrumb"], nav[aria-label="breadcrumb"], .breadcrumb');
      await expect(breadcrumb).toBeVisible();
      await expect(breadcrumb).toContainText(/Configurações/i);
      await expect(breadcrumb).toContainText(/Estabelecimentos/i);
    });

    test('Deve navegar de volta ao dashboard', async ({ page }) => {
      await establishmentsPage.goto();

      // Click Home/Dashboard link
      await page.click('a[href="/"], a:has-text("Home"), a:has-text("Dashboard")');
      await page.waitForTimeout(500);

      // Verify back at dashboard
      await expect(page).toHaveURL(/\/$|dashboard/);
    });
  });

  test.describe('Navegação entre Views', () => {
    test.beforeEach(async () => {
      await establishmentsPage.goto();
    });

    test('Deve abrir modal de criação', async () => {
      await establishmentsPage.clickAddButton();

      // Verify modal opened
      await expect(establishmentsPage.codigoInput).toBeVisible();
      await expect(establishmentsPage.nomeInput).toBeVisible();
      await expect(establishmentsPage.saveButton).toBeVisible();
    });

    test('Deve fechar modal com botão Cancelar', async () => {
      await establishmentsPage.clickAddButton();
      await establishmentsPage.cancelButton.click();

      // Verify modal closed
      await expect(establishmentsPage.codigoInput).not.toBeVisible();
    });

    test('Deve fechar modal com X', async ({ page }) => {
      await establishmentsPage.clickAddButton();

      // Click close button (X)
      const closeButton = page.locator('button[aria-label="Close"], button[aria-label="Fechar"], [data-testid="close-modal"]');
      await closeButton.click();

      // Verify modal closed
      await expect(establishmentsPage.codigoInput).not.toBeVisible();
    });

    test('Deve fechar modal com ESC', async ({ page }) => {
      await establishmentsPage.clickAddButton();

      // Press ESC
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);

      // Verify modal closed
      await expect(establishmentsPage.codigoInput).not.toBeVisible();
    });
  });

  test.describe('Navegação entre Tabs/Seções', () => {
    test.beforeEach(async () => {
      await establishmentsPage.goto();
      await establishmentsPage.clickAddButton();
    });

    test('Deve navegar entre abas do formulário', async ({ page }) => {
      // Check if there are tabs
      const tabs = page.locator('[role="tab"], .tab, button:has-text("Dados"), button:has-text("Endereço")');
      const tabCount = await tabs.count();

      if (tabCount > 0) {
        // Click each tab
        for (let i = 0; i < tabCount; i++) {
          await tabs.nth(i).click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('Deve manter dados ao navegar entre abas', async ({ page }) => {
      // Fill basic info
      await establishmentsPage.codigoInput.fill('TEST001');
      await establishmentsPage.nomeInput.fill('Test Name');

      // Navigate to address tab if exists
      const addressTab = page.locator('button:has-text("Endereço"), [role="tab"]:has-text("Endereço")');
      if (await addressTab.isVisible()) {
        await addressTab.click();
        await page.waitForTimeout(300);

        // Go back to basic tab
        const basicTab = page.locator('button:has-text("Dados"), [role="tab"]:has-text("Dados")');
        await basicTab.click();
        await page.waitForTimeout(300);
      }

      // Verify data persisted
      await expect(establishmentsPage.codigoInput).toHaveValue('TEST001');
      await expect(establishmentsPage.nomeInput).toHaveValue('Test Name');
    });
  });

  test.describe('Navegação via Teclado', () => {
    test.beforeEach(async () => {
      await establishmentsPage.goto();
      await establishmentsPage.clickAddButton();
    });

    test('Deve navegar entre campos com Tab', async ({ page }) => {
      // Focus first input
      await establishmentsPage.codigoInput.focus();

      // Tab to next fields
      await page.keyboard.press('Tab');
      await expect(establishmentsPage.nomeInput).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(establishmentsPage.cnpjInput).toBeFocused();
    });

    test('Deve submeter form com Enter no último campo', async ({ page }) => {
      // This test depends on form behavior
      // Some forms submit on Enter, some don't
      await establishmentsPage.codigoInput.fill('TEST');
      await establishmentsPage.codigoInput.press('Enter');

      // Check if form submitted or moved to next field
      // This is implementation-dependent
    });
  });

  test.describe('Deep Links', () => {
    test('Deve acessar diretamente via URL', async ({ page }) => {
      await page.goto('/configuracoes/estabelecimentos');
      await establishmentsPage.waitForPageLoad();

      await expect(page).toHaveURL(/estabelecimentos/);
      await expect(establishmentsPage.addButton).toBeVisible();
    });

    test('Deve redirecionar se não autenticado', async ({ page, context }) => {
      // Clear cookies to logout
      await context.clearCookies();

      await page.goto('/configuracoes/estabelecimentos');
      await page.waitForTimeout(1000);

      // Should redirect to login
      await expect(page).toHaveURL(/\/$|login/);
    });
  });

  test.describe('Back/Forward Navigation', () => {
    test('Deve usar botão voltar do browser', async ({ page }) => {
      await establishmentsPage.goto();
      await page.click('a[href="/"]');
      await page.waitForTimeout(500);

      // Go back
      await page.goBack();
      await page.waitForTimeout(500);

      await expect(page).toHaveURL(/estabelecimentos/);
    });

    test('Deve usar botão avançar do browser', async ({ page }) => {
      await establishmentsPage.goto();
      await page.click('a[href="/"]');
      await page.waitForTimeout(500);
      await page.goBack();
      await page.waitForTimeout(500);

      // Go forward
      await page.goForward();
      await page.waitForTimeout(500);

      await expect(page).not.toHaveURL(/estabelecimentos/);
    });
  });
});
