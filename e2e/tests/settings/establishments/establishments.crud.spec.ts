import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../page-objects/base/LoginPage';
import { EstablishmentsPage } from '../../../page-objects/settings/EstablishmentsPage';
import { ESTABLISHMENT_FIXTURES } from '../../../fixtures/establishments.fixture';

test.describe('Estabelecimentos - CRUD Operations', () => {
  let loginPage: LoginPage;
  let establishmentsPage: EstablishmentsPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    establishmentsPage = new EstablishmentsPage(page);

    // Login as admin
    await loginPage.loginAsAdmin();

    // Navigate to Establishments
    await establishmentsPage.goto();
  });

  test.describe('CREATE - Criar Estabelecimento', () => {
    test('Deve criar estabelecimento com todos os campos', async () => {
      const initialCount = await establishmentsPage.getEstablishmentCount();

      await establishmentsPage.createEstablishment(ESTABLISHMENT_FIXTURES.valid);

      // Verify success message
      await expect(establishmentsPage.page.locator('text=/sucesso|criado/i')).toBeVisible({
        timeout: 10000
      });

      // Verify establishment appears in list
      await establishmentsPage.searchEstablishment(ESTABLISHMENT_FIXTURES.valid.basic.codigo);
      await expect(
        await establishmentsPage.isEstablishmentVisible(ESTABLISHMENT_FIXTURES.valid.basic.codigo)
      ).toBeTruthy();

      // Verify count increased
      const finalCount = await establishmentsPage.getEstablishmentCount();
      expect(finalCount).toBeGreaterThan(initialCount);
    });

    test('Deve criar estabelecimento com campos mínimos obrigatórios', async () => {
      await establishmentsPage.createEstablishment(ESTABLISHMENT_FIXTURES.validMinimal);

      // Verify success
      await expect(establishmentsPage.page.locator('text=/sucesso|criado/i')).toBeVisible();

      // Verify in list
      await establishmentsPage.searchEstablishment(ESTABLISHMENT_FIXTURES.validMinimal.basic.codigo);
      const isVisible = await establishmentsPage.isEstablishmentVisible(
        ESTABLISHMENT_FIXTURES.validMinimal.basic.codigo
      );
      expect(isVisible).toBeTruthy();
    });

    test('Deve criar múltiplos estabelecimentos', async () => {
      for (const establishment of ESTABLISHMENT_FIXTURES.validMultiple) {
        await establishmentsPage.createEstablishment(establishment);
        await expect(establishmentsPage.page.locator('text=/sucesso/i')).toBeVisible();
      }

      // Verify all appear in list
      for (const establishment of ESTABLISHMENT_FIXTURES.validMultiple) {
        await establishmentsPage.searchEstablishment(establishment.basic.codigo);
        const isVisible = await establishmentsPage.isEstablishmentVisible(establishment.basic.codigo);
        expect(isVisible).toBeTruthy();
      }
    });
  });

  test.describe('READ - Visualizar Estabelecimento', () => {
    test.beforeEach(async () => {
      // Create establishment for reading
      await establishmentsPage.createEstablishment(ESTABLISHMENT_FIXTURES.valid);
      await establishmentsPage.page.waitForTimeout(1000);
    });

    test('Deve visualizar detalhes do estabelecimento', async () => {
      await establishmentsPage.searchEstablishment(ESTABLISHMENT_FIXTURES.valid.basic.codigo);
      await establishmentsPage.page.click(`text=${ESTABLISHMENT_FIXTURES.valid.basic.codigo}`);

      // Verify modal/form opened
      await expect(establishmentsPage.codigoInput).toBeVisible();

      // Verify data is correct
      await expect(establishmentsPage.codigoInput).toHaveValue(ESTABLISHMENT_FIXTURES.valid.basic.codigo);
      await expect(establishmentsPage.nomeInput).toHaveValue(ESTABLISHMENT_FIXTURES.valid.basic.nome);
      await expect(establishmentsPage.cnpjInput).toHaveValue(ESTABLISHMENT_FIXTURES.valid.basic.cnpj);
    });

    test('Deve pesquisar estabelecimento por código', async () => {
      await establishmentsPage.searchEstablishment(ESTABLISHMENT_FIXTURES.valid.basic.codigo);

      const isVisible = await establishmentsPage.isEstablishmentVisible(
        ESTABLISHMENT_FIXTURES.valid.basic.codigo
      );
      expect(isVisible).toBeTruthy();
    });

    test('Deve pesquisar estabelecimento por nome', async () => {
      await establishmentsPage.searchEstablishment(ESTABLISHMENT_FIXTURES.valid.basic.nome);

      const isVisible = await establishmentsPage.isEstablishmentVisible(
        ESTABLISHMENT_FIXTURES.valid.basic.codigo
      );
      expect(isVisible).toBeTruthy();
    });
  });

  test.describe('UPDATE - Atualizar Estabelecimento', () => {
    test.beforeEach(async () => {
      // Create establishment for updating
      await establishmentsPage.createEstablishment(ESTABLISHMENT_FIXTURES.valid);
      await establishmentsPage.page.waitForTimeout(1000);
    });

    test('Deve atualizar informações básicas', async () => {
      await establishmentsPage.editEstablishment(
        ESTABLISHMENT_FIXTURES.valid.basic.codigo,
        {
          basic: {
            ...ESTABLISHMENT_FIXTURES.valid.basic,
            nome: 'Nome Atualizado',
          }
        }
      );

      // Verify success message
      await expect(establishmentsPage.page.locator('text=/atualizado|sucesso/i')).toBeVisible();

      // Verify update persisted
      await establishmentsPage.searchEstablishment(ESTABLISHMENT_FIXTURES.valid.basic.codigo);
      await establishmentsPage.page.click(`text=${ESTABLISHMENT_FIXTURES.valid.basic.codigo}`);
      await expect(establishmentsPage.nomeInput).toHaveValue('Nome Atualizado');
    });

    test('Deve atualizar endereço', async () => {
      await establishmentsPage.editEstablishment(
        ESTABLISHMENT_FIXTURES.valid.basic.codigo,
        {
          address: {
            ...ESTABLISHMENT_FIXTURES.valid.address,
            numero: '9999',
          }
        }
      );

      // Verify success
      await expect(establishmentsPage.page.locator('text=/atualizado|sucesso/i')).toBeVisible();
    });

    test('Deve alternar status ativo/inativo', async () => {
      await establishmentsPage.searchEstablishment(ESTABLISHMENT_FIXTURES.valid.basic.codigo);
      await establishmentsPage.page.click(`text=${ESTABLISHMENT_FIXTURES.valid.basic.codigo}`);

      // Toggle active status
      await establishmentsPage.toggleActive(false);
      await establishmentsPage.saveEstablishment();

      // Verify success
      await expect(establishmentsPage.page.locator('text=/sucesso/i')).toBeVisible();
    });
  });

  test.describe('DELETE - Excluir Estabelecimento', () => {
    test.beforeEach(async () => {
      // Create establishment for deletion
      await establishmentsPage.createEstablishment(ESTABLISHMENT_FIXTURES.valid);
      await establishmentsPage.page.waitForTimeout(1000);
    });

    test('Deve excluir estabelecimento', async () => {
      const initialCount = await establishmentsPage.getEstablishmentCount();

      await establishmentsPage.deleteEstablishment(ESTABLISHMENT_FIXTURES.valid.basic.codigo);

      // Verify success message
      await expect(establishmentsPage.page.locator('text=/excluído|removido|sucesso/i')).toBeVisible();

      // Verify establishment no longer appears
      await establishmentsPage.searchEstablishment(ESTABLISHMENT_FIXTURES.valid.basic.codigo);
      const isVisible = await establishmentsPage.isEstablishmentVisible(
        ESTABLISHMENT_FIXTURES.valid.basic.codigo
      );
      expect(isVisible).toBeFalsy();

      // Verify count decreased
      const finalCount = await establishmentsPage.getEstablishmentCount();
      expect(finalCount).toBeLessThan(initialCount);
    });

    test('Deve cancelar exclusão', async () => {
      await establishmentsPage.searchEstablishment(ESTABLISHMENT_FIXTURES.valid.basic.codigo);
      await establishmentsPage.page.click(`text=${ESTABLISHMENT_FIXTURES.valid.basic.codigo}`);

      await establishmentsPage.deleteButton.click();
      await establishmentsPage.cancelButton.click();

      // Verify establishment still appears
      await establishmentsPage.searchEstablishment(ESTABLISHMENT_FIXTURES.valid.basic.codigo);
      const isVisible = await establishmentsPage.isEstablishmentVisible(
        ESTABLISHMENT_FIXTURES.valid.basic.codigo
      );
      expect(isVisible).toBeTruthy();
    });
  });
});
