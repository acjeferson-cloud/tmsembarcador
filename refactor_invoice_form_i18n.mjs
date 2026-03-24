import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function addUseTranslation(content) {
  if (content.includes('useTranslation')) return content;
  const reactImport = content.indexOf(`import React`);
  const i18nImport = `import { useTranslation } from 'react-i18next';\n`;
  if (reactImport !== -1) {
    const nextLine = content.indexOf('\n', reactImport) + 1;
    content = content.slice(0, nextLine) + i18nImport + content.slice(nextLine);
  } else {
    content = i18nImport + content;
  }
  return content;
}

function injectTHook(content, componentName) {
  if (content.match(/const\s*{\s*t\s*}\s*=\s*useTranslation\(\);/)) return content;
  const regex = new RegExp(`(export\\s+const\\s+${componentName}\\s*:\\s*React\\.FC<[^>]+>\\s*=\\s*\\([^)]+\\)\\s*=>\\s*{)`);
  if (content.match(regex)) {
    content = content.replace(regex, `$1\n  const { t } = useTranslation();\n`);
  }
  return content;
}

let formFile = fs.readFileSync('src/components/Invoices/InvoiceForm.tsx', 'utf8');
formFile = addUseTranslation(formFile);
formFile = injectTHook(formFile, 'InvoiceForm');

const replacements = [
  // Toasts / Setup messages
  ["setSuccess('XML importado com sucesso!');", "setSuccess(t('invoices.form.messages.xmlImportSuccess'));"],
  ["setError('Erro ao importar XML. Verifique o formato do arquivo.');", "setError(t('invoices.form.messages.xmlImportError'));"],
  ["setError(err.message || 'Erro ao importar XML. Verifique o formato do arquivo.');", "setError(err.message || t('invoices.form.messages.xmlImportError'));"],
  ["setError('Por favor, importe um XML ou edite uma nota existente antes de salvar.');", "setError(t('invoices.form.messages.missingXml'));"],
  ["setSuccess('Nota Fiscal atualizada com sucesso!');", "setSuccess(t('invoices.form.messages.updateSuccess'));"],
  ["setSuccess('Nota Fiscal importada com sucesso!');", "setSuccess(t('invoices.form.messages.importSuccess'));"],
  ["setError(result.error || 'Erro ao salvar nota fiscal.');", "setError(result.error || t('invoices.form.messages.saveError'));"],
  ["setError(err.message || 'Erro ao salvar nota fiscal.');", "setError(err.message || t('invoices.form.messages.saveError'));"],
  
  // Headers and buttons
  ["Nova Nota Fiscal", "{t('invoices.form.titleNew')}"],
  ["Editar Nota Fiscal", "{t('invoices.form.titleEdit')}"],
  ["Salvar Nota Fiscal", "{t('invoices.form.save')}"],
  ["Salvando...", "{t('invoices.form.saving')}"],
  ["Importar XML da NF-e", "{t('invoices.form.importXmlTitle')}"],
  ['<span className="font-semibold">Clique para selecionar</span> ou arraste o arquivo XML', '<span className="font-semibold">{t("invoices.form.clickToSelect")}</span> {t("invoices.form.orDragXml")}'],
  ['XML da NF-e (formato padrão da SEFAZ)', '{t("invoices.form.xmlFormatHelper")}'],

  // Tabs
  ["<span>Dados Básicos</span>", "<span>{t('invoices.form.tabBasic')}</span>"],
  ["<span>Cliente</span>", "<span>{t('invoices.form.tabCustomer')}</span>"],
  ["<span>Itens ({products.length})</span>", "<span>{t('invoices.form.tabItems', { count: products.length })}</span>"],
  ["<span>Valores</span>", "<span>{t('invoices.form.tabValues')}</span>"],

  // Tab Messages
  ["Aguardando importação do XML:", "{t('invoices.form.waitingXml')}:"],
  ["Faça upload do arquivo XML da NF-e acima para preencher automaticamente os campos.", "{t('invoices.form.waitingXmlBasic')}"],
  ["Os dados do cliente serão preenchidos automaticamente após o upload do XML.", "{t('invoices.form.waitingXmlCustomer')}"],
  ["Os itens serão extraídos automaticamente após o upload do XML.", "{t('invoices.form.waitingXmlItems')}"],
  ["Os valores e impostos da NF-e serão preenchidos após o upload do XML.", "{t('invoices.form.waitingXmlValues')}"],

  // Form Basic Tab
  ["Estabelecimento", "{t('invoices.form.fields.establishment')}"],
  ["Tipo da NF-e *", "{t('invoices.form.fields.nfeType')} *"],
  ["<label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">\n                        Número *\n                      </label>", "<label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">\n                        {t('invoices.form.fields.number')} *\n                      </label>"],
  ["<label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">\n                        Série *\n                      </label>", "<label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">\n                        {t('invoices.form.fields.serie')} *\n                      </label>"],
  ["Chave de Acesso", "{t('invoices.form.fields.accessKey')}"],
  ["<label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">\n                        Data de Emissão\n                      </label>", "<label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">\n                        {t('invoices.form.fields.issueDate')}\n                      </label>"],
  ["<label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">\n                        Data de Entrada\n                      </label>", "<label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">\n                        {t('invoices.form.fields.entryDate')}\n                      </label>"],
  ["Previsão de Entrega", "{t('invoices.form.fields.expectedDelivery')}"],
  ["Natureza da Operação", "{t('invoices.form.fields.operationNature')}"],
  ["Série do Pedido", "{t('invoices.form.fields.orderSerie')}"],
  ["Número do Pedido", "{t('invoices.form.fields.orderNumber')}"],
  ["Peso (kg)", "{t('invoices.form.fields.weightKg')}"],
  ["<label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">\n                        Volumes\n                      </label>", "<label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">\n                        {t('invoices.form.fields.volumes')}\n                      </label>"],
  ["<label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">\n                        Status\n                      </label>", "<label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">\n                        {t('invoices.table.status')}\n                      </label>"],
  ["<label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">\n                        Transportador\n                      </label>", "<label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">\n                        {t('invoices.form.fields.carrier')}\n                      </label>"],
  ["Selecione um transportador", "{t('invoices.form.selectCarrier')}"],
  ["<label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">\n                        Observações\n                      </label>", "<label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">\n                        {t('invoices.form.fields.observations')}\n                      </label>"],
  ['placeholder="Observações adicionais sobre a nota fiscal..."', 'placeholder={t("invoices.form.observationsPlaceholder")}'],

  // Customer Tab
  ["Nome / Razão Social *", "{t('invoices.form.fields.customerName')} *"],
  ['placeholder="Nome ou Razão Social"', 'placeholder={t("invoices.form.placeholders.customerName")}'],
  ["<label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">\n                        CNPJ\n                      </label>", "<label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">\n                        CNPJ\n                      </label>"],
  ["Inscrição Estadual", "{t('invoices.form.fields.stateReg')}"],
  ["<label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">\n                        Endereço\n                      </label>", "<label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">\n                        {t('invoices.form.fields.address')}\n                      </label>"],
  ["<label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">\n                        Número\n                      </label>", "<label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">\n                        {t('invoices.form.fields.addressNumber')}\n                      </label>"],
  ["Complemento", "{t('invoices.form.fields.complement')}"],
  ["Bairro", "{t('invoices.form.fields.neighborhood')}"],
  ["<label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">\n                        Cidade\n                      </label>", "<label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">\n                        {t('invoices.form.fields.city')}\n                      </label>"],
  ["<label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">\n                        Estado\n                      </label>", "<label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">\n                        {t('invoices.form.fields.state')}\n                      </label>"],
  ["<label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">\n                        CEP\n                      </label>", "<label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">\n                        {t('invoices.form.fields.zipCode')}\n                      </label>"],
  ["País", "{t('invoices.form.fields.country')}"],
  ["Telefone", "{t('invoices.form.fields.phone')}"],
  ["Email", "{t('invoices.form.fields.email')}"],

  // Products Tab
  ["<h3 className=\"text-lg font-medium text-gray-900 dark:text-white\">Itens da Nota Fiscal</h3>", "<h3 className=\"text-lg font-medium text-gray-900 dark:text-white\">{t('invoices.form.itemsTitle')}</h3>"],
  ["<span>+ Adicionar Item</span>", "<span>+ {t('invoices.form.addItem')}</span>"],
  ["Nenhum item adicionado", "{t('invoices.form.noItemsAdded')}"],
  ["<span>+ Adicionar Primeiro Item</span>", "<span>+ {t('invoices.form.addFirstItem')}</span>"],
  ["<th className=\"text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 w-32\">Código</th>", "<th className=\"text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 w-32\">{t('invoices.details.code')}</th>"],
  ["<th className=\"text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-[250px]\">Descrição</th>", "<th className=\"text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-[250px]\">{t('invoices.details.description')}</th>"],
  ["<th className=\"text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 w-24\">Qtd</th>", "<th className=\"text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 w-24\">{t('invoices.details.quantity')}</th>"],
  ["<th className=\"text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 w-24\">Peso (kg)</th>", "<th className=\"text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 w-24\">{t('invoices.form.fields.weightKg')}</th>"],
  ["<th className=\"text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 w-28\">Cubagem (m³)</th>", "<th className=\"text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 w-28\">{t('invoices.form.fields.cubageM3')}</th>"],
  ["<th className=\"text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 w-32\">Valor Unit.</th>", "<th className=\"text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 w-32\">{t('invoices.details.unitValue')}</th>"],
  ["<th className=\"text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 w-32\">Valor Total</th>", "<th className=\"text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 w-32\">{t('invoices.details.totalValue')}</th>"],
  ["<th className=\"text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 w-16\">Ações</th>", "<th className=\"text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 w-16\">{t('invoices.table.actions')}</th>"],
  ["Total dos Itens:", "{t('invoices.details.itemsTotal')}:"],
  ['placeholder="Código"', 'placeholder={t("invoices.details.code")}'],
  ['placeholder="Descrição do item"', 'placeholder={t("invoices.form.placeholders.itemDescription")}'],

  // Values Tab
  ["Valor Total da NF-e", "{t('invoices.form.fields.totalNfeValue')}"],
  ["Valor dos Produtos", "{t('invoices.form.fields.productsValue')}"],
  ["Calculado automaticamente", "{t('invoices.form.autoCalculated')}"],
  ["Valor do Frete", "{t('invoices.form.fields.freightValue')}"],
  ["Dados da Carga (para cálculo de frete automático)", "{t('invoices.form.cargoDataFreightLabel')}"],
  ["<label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">\n                            Peso Total (kg)\n                          </label>", "<label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">\n                            {t('invoices.form.fields.totalWeightKg')}\n                          </label>"],
  ["Quantidade de Volumes", "{t('invoices.form.fields.volumesQty')}"],
  ["<label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">\n                            Cubagem (m³)\n                          </label>", "<label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1\">\n                            {t('invoices.form.fields.cubageM3')}\n                          </label>"],
  ["<h4 className=\"text-lg font-semibold text-gray-900 dark:text-white mb-4\">Impostos</h4>", "<h4 className=\"text-lg font-semibold text-gray-900 dark:text-white mb-4\">{t('invoices.details.taxes')}</h4>"],
  ["Valor de ICMS", "{t('invoices.form.fields.icmsValue')}"],
  ["Valor de PIS", "{t('invoices.form.fields.pisValue')}"],
  ["Valor de COFINS", "{t('invoices.form.fields.cofinsValue')}"]
];

for (const [s, r] of replacements) {
  formFile = formFile.split(s).join(r);
}

// Special case `Editar Nota Fiscal ${invoice.numero || ''}`
formFile = formFile.replace(
  "{invoice ? `Editar Nota Fiscal ${invoice.numero || ''}` : 'Nova Nota Fiscal'}",
  "{invoice ? `${t('invoices.form.titleEdit')} ${invoice.numero || ''}` : t('invoices.form.titleNew')}"
);

fs.writeFileSync('src/components/Invoices/InvoiceForm.tsx', formFile);

// Build translation
const buildTranslation = (lang) => {
  const isEn = lang === 'en';
  const isEs = lang === 'es';
  
  return {
    form: {
      messages: {
        xmlImportSuccess: isEn ? "XML imported successfully!" : (isEs ? "¡XML importado con éxito!" : "XML importado com sucesso!"),
        xmlImportError: isEn ? "Error importing XML. Check file format." : (isEs ? "Error al importar XML. Verifique el formato." : "Erro ao importar XML. Verifique o formato do arquivo."),
        missingXml: isEn ? "Please import XML or edit existing invoice before saving." : (isEs ? "Por favor importe XML o edite factura existente antes de guardar." : "Por favor, importe um XML ou edite uma nota existente antes de salvar."),
        updateSuccess: isEn ? "Invoice updated successfully!" : (isEs ? "¡Factura actualizada con éxito!" : "Nota Fiscal atualizada com sucesso!"),
        importSuccess: isEn ? "Invoice imported successfully!" : (isEs ? "¡Factura importada con éxito!" : "Nota Fiscal importada com sucesso!"),
        saveError: isEn ? "Error saving invoice." : (isEs ? "Error guardando factura." : "Erro ao salvar nota fiscal.")
      },
      titleNew: isEn ? "New Invoice" : (isEs ? "Nueva Factura" : "Nova Nota Fiscal"),
      titleEdit: isEn ? "Edit Invoice" : (isEs ? "Editar Factura" : "Editar Nota Fiscal"),
      save: isEn ? "Save Invoice" : (isEs ? "Guardar Factura" : "Salvar Nota Fiscal"),
      saving: isEn ? "Saving..." : (isEs ? "Guardando..." : "Salvando..."),
      importXmlTitle: isEn ? "Import NFe XML" : (isEs ? "Importar XML NFe" : "Importar XML da NF-e"),
      clickToSelect: isEn ? "Click to select" : (isEs ? "Haga clic para seleccionar" : "Clique para selecionar"),
      orDragXml: isEn ? "or drag XML file here" : (isEs ? "o arrastre archivo XML aquí" : "ou arraste o arquivo XML"),
      xmlFormatHelper: isEn ? "NFe XML (standard SEFAZ format)" : (isEs ? "XML NFe (formato padrão SEFAZ)" : "XML da NF-e (formato padrão da SEFAZ)"),
      tabBasic: isEn ? "Basic Info" : (isEs ? "Info Básica" : "Dados Básicos"),
      tabCustomer: isEn ? "Customer" : (isEs ? "Cliente" : "Cliente"),
      tabItems: isEn ? "Items ({{count}})" : (isEs ? "Ítems ({{count}})" : "Itens ({{count}})"),
      tabValues: isEn ? "Values" : (isEs ? "Valores" : "Valores"),
      waitingXml: isEn ? "Waiting for XML import" : (isEs ? "Esperando importación XML" : "Aguardando importação do XML"),
      waitingXmlBasic: isEn ? "Upload an NFe XML file above to automatically fill in the fields." : (isEs ? "Sube archivo XML NFe para rellenar campos." : "Faça upload do arquivo XML da NF-e acima para preencher automaticamente os campos."),
      waitingXmlCustomer: isEn ? "Customer data will be auto-filled after XML upload." : (isEs ? "Datos del cliente se rellenarán automáticamente tras subir XML." : "Os dados do cliente serão preenchidos automaticamente após o upload do XML."),
      waitingXmlItems: isEn ? "Items will be automatically extracted after XML upload." : (isEs ? "Ítems serán extraídos automáticamente." : "Os itens serão extraídos automaticamente após o upload do XML."),
      waitingXmlValues: isEn ? "NFe values and taxes will be filled after XML upload." : (isEs ? "Valores e impuestos se rellenarán tras subir XML." : "Os valores e impostos da NF-e serão preenchidos após o upload do XML."),
      selectCarrier: isEn ? "Select a carrier" : (isEs ? "Seleccione un transportista" : "Selecione um transportador"),
      observationsPlaceholder: isEn ? "Additional observations about the invoice..." : (isEs ? "Observaciones adicionales sobre la factura..." : "Observações adicionais sobre a nota fiscal..."),
      itemsTitle: isEn ? "Invoice Items" : (isEs ? "Ítems de Factura" : "Itens da Nota Fiscal"),
      addItem: isEn ? "Add Item" : (isEs ? "Agregar Ítem" : "Adicionar Item"),
      noItemsAdded: isEn ? "No items added" : (isEs ? "Ningún ítem agregado" : "Nenhum item adicionado"),
      addFirstItem: isEn ? "Add First Item" : (isEs ? "Agregar Primer Ítem" : "Adicionar Primeiro Item"),
      autoCalculated: isEn ? "Automatically calculated" : (isEs ? "Calculado automáticamente" : "Calculado automaticamente"),
      cargoDataFreightLabel: isEn ? "Cargo Data (for automatic freight calc)" : (isEs ? "Datos de Carga (para cálculo frete auto)" : "Dados da Carga (para cálculo de frete automático)"),
      fields: {
        establishment: isEn ? "Establishment" : (isEs ? "Establecimiento" : "Estabelecimento"),
        nfeType: isEn ? "NFe Type" : (isEs ? "Tipo NFe" : "Tipo da NF-e"),
        number: isEn ? "Number" : (isEs ? "Número" : "Número"),
        serie: isEn ? "Series" : (isEs ? "Serie" : "Série"),
        accessKey: isEn ? "Access Key" : (isEs ? "Clave de Acceso" : "Chave de Acesso"),
        issueDate: isEn ? "Issue Date" : (isEs ? "Fecha Emisión" : "Data de Emissão"),
        entryDate: isEn ? "Entry Date" : (isEs ? "Fecha Entrada" : "Data de Entrada"),
        expectedDelivery: isEn ? "Expected Delivery" : (isEs ? "Prev. Entrega" : "Previsão de Entrega"),
        operationNature: isEn ? "Operation Nature" : (isEs ? "Nat. Operación" : "Natureza da Operação"),
        orderSerie: isEn ? "Order Series" : (isEs ? "Serie Pedido" : "Série do Pedido"),
        orderNumber: isEn ? "Order Number" : (isEs ? "Número Pedido" : "Número do Pedido"),
        weightKg: isEn ? "Weight (kg)" : (isEs ? "Peso (kg)" : "Peso (kg)"),
        volumes: isEn ? "Volumes" : (isEs ? "Volúmenes" : "Volumes"),
        carrier: isEn ? "Carrier" : (isEs ? "Transportista" : "Transportador"),
        observations: isEn ? "Observations" : (isEs ? "Observaciones" : "Observações"),
        customerName: isEn ? "Company Name / Name" : (isEs ? "Razón Social / Nombre" : "Nome / Razão Social"),
        stateReg: isEn ? "State Registration" : (isEs ? "Registro Estatal" : "Inscrição Estadual"),
        address: isEn ? "Address" : (isEs ? "Dirección" : "Endereço"),
        addressNumber: isEn ? "Number" : (isEs ? "Número" : "Número"),
        complement: isEn ? "Complement" : (isEs ? "Complemento" : "Complemento"),
        neighborhood: isEn ? "Neighborhood" : (isEs ? "Barrio" : "Bairro"),
        city: isEn ? "City" : (isEs ? "Ciudad" : "Cidade"),
        state: isEn ? "State" : (isEs ? "Estado" : "Estado"),
        zipCode: isEn ? "Zip Code" : (isEs ? "Código Postal" : "CEP"),
        country: isEn ? "Country" : (isEs ? "País" : "País"),
        phone: isEn ? "Phone" : (isEs ? "Teléfono" : "Telefone"),
        email: isEn ? "Email" : (isEs ? "Email" : "Email"),
        cubageM3: isEn ? "Cubic Meters (m³)" : (isEs ? "Cubicación (m³)" : "Cubagem (m³)"),
        totalNfeValue: isEn ? "Total NFe Value" : (isEs ? "Valor Total NFe" : "Valor Total da NF-e"),
        productsValue: isEn ? "Products Value" : (isEs ? "Valor Productos" : "Valor dos Produtos"),
        freightValue: isEn ? "Freight Value" : (isEs ? "Valor Flete" : "Valor do Frete"),
        totalWeightKg: isEn ? "Total Weight (kg)" : (isEs ? "Peso Total (kg)" : "Peso Total (kg)"),
        volumesQty: isEn ? "Volumes Qty" : (isEs ? "Cant. Volúmenes" : "Quantidade de Volumes"),
        icmsValue: isEn ? "ICMS Value" : (isEs ? "Valor ICMS" : "Valor de ICMS"),
        pisValue: isEn ? "PIS Value" : (isEs ? "Valor PIS" : "Valor de PIS"),
        cofinsValue: isEn ? "COFINS Value" : (isEs ? "Valor COFINS" : "Valor de COFINS")
      },
      placeholders: {
        customerName: isEn ? "Company Name or Name" : (isEs ? "Razón Social o Nombre" : "Nome ou Razão Social"),
        itemDescription: isEn ? "Item description" : (isEs ? "Descripción del ítem" : "Descrição do item")
      }
    }
  };
};

const locales = ['pt', 'en', 'es'];
locales.forEach(lang => {
  const p = path.join(__dirname, 'src', 'locales', lang, 'translation.json');
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  const newKeys = buildTranslation(lang);
  
  data.invoices = { 
    ...data.invoices, 
    form: newKeys.form
  };
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
  console.log(`Updated locale ${lang}`);
});
