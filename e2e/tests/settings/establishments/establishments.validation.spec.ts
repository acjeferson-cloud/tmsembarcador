import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../page-objects/base/LoginPage';
import { EstablishmentsPage } from '../../../page-objects/settings/EstablishmentsPage';
import { ESTABLISHMENT_FIXTURES } from '../../../fixtures/establishments.fixture';

test.describe('Estabelecimentos - Validações de Campos', () => {
  let loginPage: LoginPage;
  let establishmentsPage: EstablishmentsPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    establishmentsPage = new EstablishmentsPage(page);

    await loginPage.loginAsAdmin();
    await establishmentsPage.goto();
    await establishmentsPage.clickAddButton();
  });

  test.describe('Campos Obrigatórios', () => {
    test('Não deve salvar sem código', async () => {
      await establishmentsPage.fillBasicInfo({
        ...ESTABLISHMENT_FIXTURES.invalid.emptyCodigo.basic,
        codigo: '', // Empty
        nome: 'Teste',
        cnpj: '12.345.678/0001-90',
        razaoSocial: 'Teste LTDA',
        nomeFantasia: 'Teste',
      });

      await establishmentsPage.saveButton.click();

      // Verify error message
      await expect(establishmentsPage.page.locator('text=/código.*obrigatório|campo obrigatório/i')).toBeVisible();
    });

    test('Não deve salvar sem nome', async () => {
      await establishmentsPage.fillBasicInfo({
        codigo: 'TEST001',
        nome: '', // Empty
        cnpj: '12.345.678/0001-90',
        razaoSocial: 'Teste LTDA',
        nomeFantasia: 'Teste',
      });

      await establishmentsPage.saveButton.click();

      // Verify error message
      await expect(establishmentsPage.page.locator('text=/nome.*obrigatório|campo obrigatório/i')).toBeVisible();
    });

    test('Não deve salvar sem CNPJ', async () => {
      await establishmentsPage.fillBasicInfo({
        codigo: 'TEST001',
        nome: 'Teste',
        cnpj: '', // Empty
        razaoSocial: 'Teste LTDA',
        nomeFantasia: 'Teste',
      });

      await establishmentsPage.saveButton.click();

      // Verify error message
      await expect(establishmentsPage.page.locator('text=/cnpj.*obrigatório|campo obrigatório/i')).toBeVisible();
    });

    test('Não deve salvar sem endereço completo', async () => {
      await establishmentsPage.fillBasicInfo(ESTABLISHMENT_FIXTURES.valid.basic);

      // Don't fill address
      await establishmentsPage.saveButton.click();

      // Verify error message
      await expect(establishmentsPage.page.locator('text=/endereço.*obrigatório|campo obrigatório|preencha/i')).toBeVisible();
    });
  });

  test.describe('Validação de Formato', () => {
    test('Deve validar formato de CNPJ', async () => {
      await establishmentsPage.cnpjInput.fill('00.000.000/0000-00');
      await establishmentsPage.cnpjInput.blur();

      // Verify error message
      await expect(establishmentsPage.page.locator('text=/cnpj.*inválido|formato.*inválido/i')).toBeVisible();
    });

    test('Deve validar formato de email', async () => {
      await establishmentsPage.fillBasicInfo(ESTABLISHMENT_FIXTURES.valid.basic);
      await establishmentsPage.emailInput.fill('email-invalido');
      await establishmentsPage.emailInput.blur();

      // Verify error message
      await expect(establishmentsPage.page.locator('text=/email.*inválido|formato.*inválido/i')).toBeVisible();
    });

    test('Deve validar formato de CEP', async () => {
      await establishmentsPage.cepInput.fill('00000-000');
      await establishmentsPage.cepInput.blur();

      // Wait for CEP validation
      await establishmentsPage.page.waitForTimeout(2000);

      // Verify error message
      await expect(establishmentsPage.page.locator('text=/cep.*inválido|não encontrado/i')).toBeVisible();
    });

    test('Deve validar formato de telefone', async () => {
      await establishmentsPage.telefoneInput.fill('1234');
      await establishmentsPage.telefoneInput.blur();

      // Verify error message or mask application
      const value = await establishmentsPage.telefoneInput.inputValue();
      expect(value.length).toBeGreaterThan(4); // Mask should be applied
    });
  });

  test.describe('Máscaras de Entrada', () => {
    test('Deve aplicar máscara no CNPJ', async () => {
      await establishmentsPage.cnpjInput.fill('12345678000190');

      const value = await establishmentsPage.cnpjInput.inputValue();
      expect(value).toMatch(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/);
    });

    test('Deve aplicar máscara no CEP', async () => {
      await establishmentsPage.cepInput.fill('01310100');

      const value = await establishmentsPage.cepInput.inputValue();
      expect(value).toMatch(/\d{5}-\d{3}/);
    });

    test('Deve aplicar máscara no telefone', async () => {
      await establishmentsPage.telefoneInput.fill('11987654321');

      const value = await establishmentsPage.telefoneInput.inputValue();
      expect(value).toMatch(/\(\d{2}\)\s?\d{4,5}-\d{4}/);
    });
  });

  test.describe('Busca de CEP', () => {
    test('Deve preencher endereço ao buscar CEP válido', async ({ page }) => {
      await establishmentsPage.searchCEP('01310-100');

      // Wait for CEP API response
      await page.waitForTimeout(3000);

      // Verify fields were filled
      const endereco = await establishmentsPage.enderecoInput.inputValue();
      const bairro = await establishmentsPage.bairroInput.inputValue();
      const cidade = await establishmentsPage.cidadeInput.inputValue();

      expect(endereco).not.toBe('');
      expect(bairro).not.toBe('');
      expect(cidade).not.toBe('');
    });

    test('Deve mostrar erro para CEP inválido', async ({ page }) => {
      await establishmentsPage.searchCEP('99999-999');

      // Wait for CEP API response
      await page.waitForTimeout(3000);

      // Verify error message
      await expect(page.locator('text=/cep.*não encontrado|inválido/i')).toBeVisible();
    });
  });

  test.describe('Unicidade', () => {
    test.beforeEach(async () => {
      // Create an establishment first
      await establishmentsPage.page.click('button:has-text("Cancelar")');
      await establishmentsPage.createEstablishment(ESTABLISHMENT_FIXTURES.valid);
      await establishmentsPage.page.waitForTimeout(1000);
      await establishmentsPage.clickAddButton();
    });

    test('Não deve permitir código duplicado', async () => {
      await establishmentsPage.fillBasicInfo({
        ...ESTABLISHMENT_FIXTURES.valid.basic,
        cnpj: '98.765.432/0001-10', // Different CNPJ
      });

      await establishmentsPage.fillAddress(ESTABLISHMENT_FIXTURES.valid.address);
      await establishmentsPage.fillContact(ESTABLISHMENT_FIXTURES.valid.contact);

      await establishmentsPage.saveButton.click();

      // Verify error message
      await expect(establishmentsPage.page.locator('text=/código.*já existe|duplicado/i')).toBeVisible();
    });

    test('Não deve permitir CNPJ duplicado', async () => {
      await establishmentsPage.fillBasicInfo({
        codigo: 'NEWCODE',
        nome: 'Novo Estabelecimento',
        cnpj: ESTABLISHMENT_FIXTURES.valid.basic.cnpj, // Same CNPJ
        razaoSocial: 'Nova Razao Social LTDA',
        nomeFantasia: 'Nova Fantasia',
      });

      await establishmentsPage.fillAddress(ESTABLISHMENT_FIXTURES.valid.address);
      await establishmentsPage.fillContact(ESTABLISHMENT_FIXTURES.valid.contact);

      await establishmentsPage.saveButton.click();

      // Verify error message
      await expect(establishmentsPage.page.locator('text=/cnpj.*já cadastrado|duplicado/i')).toBeVisible();
    });
  });

  test.describe('Limites de Caracteres', () => {
    test('Deve respeitar limite de caracteres do código', async () => {
      const longCode = 'A'.repeat(100);
      await establishmentsPage.codigoInput.fill(longCode);

      const value = await establishmentsPage.codigoInput.inputValue();
      expect(value.length).toBeLessThanOrEqual(20); // Assuming max 20 chars
    });

    test('Deve respeitar limite de caracteres do nome', async () => {
      const longName = 'Nome Muito Longo '.repeat(20);
      await establishmentsPage.nomeInput.fill(longName);

      const value = await establishmentsPage.nomeInput.inputValue();
      expect(value.length).toBeLessThanOrEqual(200); // Assuming max 200 chars
    });
  });

  test.describe('Campos Numéricos', () => {
    test('Deve aceitar apenas números no número do endereço', async () => {
      await establishmentsPage.numeroInput.fill('ABC123');

      const value = await establishmentsPage.numeroInput.inputValue();
      // Should contain only numbers
      expect(value).toMatch(/^\d+$/);
    });
  });
});
