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

// 1. Process InvoiceDetailsModal.tsx
let detailsFile = fs.readFileSync('src/components/Invoices/InvoiceDetailsModal.tsx', 'utf8');
detailsFile = addUseTranslation(detailsFile);
detailsFile = injectTHook(detailsFile, 'InvoiceDetailsModal');

// Create replacement patterns safely targeting inner elements text
const replacements = [
  // Header titles
  ['<h2 className="text-xl font-bold text-gray-900 dark:text-white">Detalhes da Nota Fiscal</h2>', '<h2 className="text-xl font-bold text-gray-900 dark:text-white">{t("invoices.details.title")}</h2>'],
  ['<span>Imprimir DANFE</span>', '<span>{t("invoices.details.printDanfe")}</span>'],
  ['<span>Download XML</span>', '<span>{t("invoices.details.downloadXml")}</span>'],
  // Tabs
  ['<span>Detalhes da Nota Fiscal</span>', '<span>{t("invoices.details.tabDetails")}</span>'],
  ['<span>Custos de Frete</span>', '<span>{t("invoices.details.tabCosts")}</span>'],
  ['<span>CT-es Vinculados</span>', '<span>{t("invoices.details.tabCtes")}</span>'],
  // Sub headers
  ['<h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações Básicas</h4>', '<h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t("invoices.details.basicInfo")}</h4>'],
  ['<p className="text-sm text-gray-600 dark:text-gray-400">Data de Emissão</p>', '<p className="text-sm text-gray-600 dark:text-gray-400">{t("invoices.details.issueDate")}</p>'],
  ['<p className="text-sm text-gray-600 dark:text-gray-400">Data de Entrada</p>', '<p className="text-sm text-gray-600 dark:text-gray-400">{t("invoices.details.entryDate")}</p>'],
  ['<p className="text-sm text-gray-600 dark:text-gray-400">Chave de Acesso</p>', '<p className="text-sm text-gray-600 dark:text-gray-400">{t("invoices.details.accessKey")}</p>'],
  ['<p className="text-sm text-gray-600 dark:text-gray-400">Tipo da Nota</p>', '<p className="text-sm text-gray-600 dark:text-gray-400">{t("invoices.details.invoiceType")}</p>'],
  ['<p className="text-sm text-gray-600 dark:text-gray-400">Natureza da Operação</p>', '<p className="text-sm text-gray-600 dark:text-gray-400">{t("invoices.details.operationNature")}</p>'],
  ['<p className="text-sm text-gray-600 dark:text-gray-400">Número do Pedido</p>', '<p className="text-sm text-gray-600 dark:text-gray-400">{t("invoices.details.orderNumber")}</p>'],
  ['<p className="text-sm text-gray-600 dark:text-gray-400">Previsão de Entrega</p>', '<p className="text-sm text-gray-600 dark:text-gray-400">{t("invoices.details.expectedDelivery")}</p>'],
  
  // Carrier info
  ['<h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações do Transportador</h4>', '<h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t("invoices.details.carrierInfo")}</h4>'],
  ['<p className="text-sm text-gray-600 dark:text-gray-400">Transportador</p>', '<p className="text-sm text-gray-600 dark:text-gray-400">{t("invoices.details.carrier")}</p>'],
  ['<p className="text-sm text-gray-600 dark:text-gray-400">Base para Custo</p>', '<p className="text-sm text-gray-600 dark:text-gray-400">{t("invoices.details.costBase")}</p>'],
  ['<p className="text-sm text-gray-600 dark:text-gray-400">Status da Coleta</p>', '<p className="text-sm text-gray-600 dark:text-gray-400">{t("invoices.details.collectionStatus")}</p>'],
  
  // Customer
  ['<h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações do Cliente</h4>', '<h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t("invoices.details.customerInfo")}</h4>'],
  ['<p className="text-sm text-gray-600 dark:text-gray-400">Cliente</p>', '<p className="text-sm text-gray-600 dark:text-gray-400">{t("invoices.details.customer")}</p>'],
  ['<p className="text-sm text-gray-600 dark:text-gray-400">Cidade de Destino</p>', '<p className="text-sm text-gray-600 dark:text-gray-400">{t("invoices.details.destCity")}</p>'],
  ['<p className="text-sm text-gray-600 dark:text-gray-400">UF de Destino</p>', '<p className="text-sm text-gray-600 dark:text-gray-400">{t("invoices.details.destState")}</p>'],
  
  // Financial
  ['<h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações Financeiras</h4>', '<h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t("invoices.details.financialInfo")}</h4>'],
  ['<p className="text-sm text-gray-600 dark:text-gray-400">Valor Total da NF-e</p>', '<p className="text-sm text-gray-600 dark:text-gray-400">{t("invoices.details.totalNfeValue")}</p>'],
  ['<p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Tributos</p>', '<p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t("invoices.details.taxes")}</p>'],
  
  // Cargo
  ['<h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações de Carga</h4>', '<h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t("invoices.details.cargoInfo")}</h4>'],
  ['<p className="text-sm text-gray-600 dark:text-gray-400">Peso Total</p>', '<p className="text-sm text-gray-600 dark:text-gray-400">{t("invoices.details.totalWeight")}</p>'],
  ['<p className="text-sm text-gray-600 dark:text-gray-400">Volumes</p>', '<p className="text-sm text-gray-600 dark:text-gray-400">{t("invoices.details.volumes")}</p>'],
  
  // Functions text mapped:
  ["return 'Não informado';", "return t('invoices.details.notInformed');"],
  ["? `${invoice.peso.toFixed(3)} kg` : 'Não informado'", "? `${invoice.peso.toFixed(3)} kg` : t('invoices.details.notInformed')"],
  ["{invoice.volumes || 'Não informado'}", "{invoice.volumes || t('invoices.details.notInformed')}"],

  // Full customer details
  ['Dados Completos do Cliente', '{t("invoices.details.fullCustomerData")}'],
  ['<p className="text-sm text-gray-600 dark:text-gray-400">Razão Social / Nome</p>', '<p className="text-sm text-gray-600 dark:text-gray-400">{t("invoices.details.companyName")}</p>'],
  ['<p className="text-sm text-gray-600 dark:text-gray-400">CNPJ/CPF</p>', '<p className="text-sm text-gray-600 dark:text-gray-400">CNPJ/CPF</p>'],
  ['<p className="text-sm text-gray-600 dark:text-gray-400">CEP</p>', '<p className="text-sm text-gray-600 dark:text-gray-400">CEP</p>'],
  ['<p className="text-sm text-gray-600 dark:text-gray-400">Endereço</p>', '<p className="text-sm text-gray-600 dark:text-gray-400">{t("invoices.details.address")}</p>'],
  ['<p className="text-sm text-gray-600 dark:text-gray-400">Cidade / UF</p>', '<p className="text-sm text-gray-600 dark:text-gray-400">{t("invoices.details.cityState")}</p>'],
  ['<p className="text-sm text-gray-600 dark:text-gray-400">Telefone</p>', '<p className="text-sm text-gray-600 dark:text-gray-400">{t("invoices.details.phone")}</p>'],
  ['<p className="text-sm text-gray-600 dark:text-gray-400">E-mail</p>', '<p className="text-sm text-gray-600 dark:text-gray-400">{t("invoices.details.email")}</p>'],
  
  ["{customer.razao_social || customer.name || 'Não informado'}", "{customer.razao_social || customer.name || t('invoices.details.notInformed')}"],
  ["{customer.cnpj_cpf || customer.cnpj || 'Não informado'}", "{customer.cnpj_cpf || customer.cnpj || t('invoices.details.notInformed')}"],
  ["{customer.cep || customer.zip_code || 'Não informado'}", "{customer.cep || customer.zip_code || t('invoices.details.notInformed')}"],
  
  // Produtoss
  ['Itens da Nota Fiscal ({products.length} {products.length === 1 ? \'item\' : \'itens\'})', '{t("invoices.details.invoiceItems", { count: products.length })}'],
  ['<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Item</th>', '<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("invoices.details.item")}</th>'],
  ['<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Código</th>', '<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("invoices.details.code")}</th>'],
  ['<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Descrição</th>', '<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("invoices.details.description")}</th>'],
  ['<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantidade</th>', '<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("invoices.details.quantity")}</th>'],
  ['<th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unidade</th>', '<th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("invoices.details.unit")}</th>'],
  ['<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor Unit.</th>', '<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("invoices.details.unitValue")}</th>'],
  ['<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor Total</th>', '<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("invoices.details.totalValue")}</th>'],
  ['<th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">NCM</th>', '<th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">NCM</th>'],
  ['Total dos Itens:', '{t("invoices.details.itemsTotal")}:'],
  ['<p className="text-sm font-medium text-yellow-800">Nenhum item encontrado</p>', '<p className="text-sm font-medium text-yellow-800">{t("invoices.details.noItemsFound")}</p>'],
  ['<p className="text-xs text-yellow-600 mt-1">Esta nota fiscal não possui itens cadastrados.</p>', '<p className="text-xs text-yellow-600 mt-1">{t("invoices.details.noItemsDescription")}</p>'],
  
  // Status History
  ['<h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Histórico de Status</h4>', '<h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t("invoices.details.statusHistory")}</h4>'],
  ["label: 'Nota Fiscal Emitida'", "label: t('invoices.status.emitida')"],
  ["label: 'Em Coleta'", "label: t('invoices.status.emColeta')"],
  ["label: 'Em Trânsito - Saindo da Origem'", "label: t('invoices.status.emTransitoOrigem')"],
  ["label: 'Em Trânsito na Rodovia'", "label: t('invoices.status.emTransitoRodovia')"],
  ["label: 'Chegada na Cidade de Destino'", "label: t('invoices.status.chegouDestino')"],
  ["label: 'Saiu para Entrega'", "label: t('invoices.status.saiuParaEntrega')"],
  ["label: 'Entregue'", "label: t('invoices.status.entregue')"],

  // Associated CTEs
  ['<h4 className="text-lg font-semibold text-gray-900 dark:text-white">CT-es Vinculados à Nota Fiscal</h4>', '<h4 className="text-lg font-semibold text-gray-900 dark:text-white">{t("invoices.details.linkedCtesTitle")}</h4>'],
  ['Carregando CT-es...', '{t("invoices.details.loadingCtes")}'],
  ['Nenhum CT-e vinculado encontrado.', '{t("invoices.details.noCtesFound")}'],
  ['Total de CT-es', '{t("invoices.details.totalCtes")}'],
  ['Valor Total', '{t("invoices.details.totalValue")}'],
  ['Valor Médio', '{t("invoices.details.avgValue")}'],
  ['<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">\n                          Número\n                        </th>', '<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">\n                          {t("invoices.table.number")}\n                        </th>'],
  ['<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">\n                          Série\n                        </th>', '<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">\n                          {t("invoices.table.serie")}\n                        </th>'],
  ['<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">\n                          Data Emissão\n                        </th>', '<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">\n                          {t("invoices.table.issueDate")}\n                        </th>'],
  ['<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">\n                          Valor\n                        </th>', '<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">\n                          {t("invoices.table.nfeValue")}\n                        </th>'],
  ['<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">\n                          Status\n                        </th>', '<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">\n                          {t("invoices.table.status")}\n                        </th>'],
  ['<th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">\n                          Ações\n                        </th>', '<th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">\n                          {t("invoices.table.actions")}\n                        </th>'],
  ['Visualizar\n                                  </button>', '{t("invoices.table.viewDetails")}\n                                  </button>'],

  // Base custo format:
  ["return 'Tabela de Frete';", "return t('invoices.filters.freightTable');"],
  ["return 'Negociação Individual';", "return t('invoices.filters.individualNegotiation');"],

  // Status coleta format:
  ["return 'Disponível para Coleta';", "return t('invoices.status.disponivelColeta');"],
  ["return 'Coleta Realizada';", "return t('invoices.status.coletaRealizada');"]
];

for (const [s, r] of replacements) {
  detailsFile = detailsFile.split(s).join(r);
}

// Special case: `Série: {invoice.serie} | Emissão: {formatDate(invoice.dataEmissao)}`
detailsFile = detailsFile.replace(
  '<p className="text-gray-600 dark:text-gray-400">Série: {invoice.serie} | Emissão: {formatDate(invoice.dataEmissao)}</p>',
  '<p className="text-gray-600 dark:text-gray-400">{t("invoices.details.serie")}: {invoice.serie} | {t("invoices.details.issueDate")}: {formatDate(invoice.dataEmissao)}</p>'
);

fs.writeFileSync('src/components/Invoices/InvoiceDetailsModal.tsx', detailsFile);

// Build translation
const buildTranslation = (lang) => {
  const isEn = lang === 'en';
  const isEs = lang === 'es';
  
  return {
    details: {
      title: isEn ? "Invoice Details" : (isEs ? "Detalles de la Factura" : "Detalhes da Nota Fiscal"),
      printDanfe: isEn ? "Print DANFE" : (isEs ? "Imprimir DANFE" : "Imprimir DANFE"),
      downloadXml: isEn ? "Download XML" : (isEs ? "Descargar XML" : "Download XML"),
      tabDetails: isEn ? "Invoice Info" : (isEs ? "Info Factura" : "Detalhes da Nota Fiscal"),
      tabCosts: isEn ? "Freight Costs" : (isEs ? "Costos Flete" : "Custos de Frete"),
      tabCtes: isEn ? "Linked CT-es" : (isEs ? "CT-es Vinculados" : "CT-es Vinculados"),
      basicInfo: isEn ? "Basic Information" : (isEs ? "Información Básica" : "Informações Básicas"),
      issueDate: isEn ? "Issue Date" : (isEs ? "Fecha Emisión" : "Data de Emissão"),
      entryDate: isEn ? "Entry Date" : (isEs ? "Fecha Entrada" : "Data de Entrada"),
      accessKey: isEn ? "Access Key" : (isEs ? "Clave Acceso" : "Chave de Acesso"),
      invoiceType: isEn ? "Invoice Type" : (isEs ? "Tipo Factura" : "Tipo da Nota"),
      operationNature: isEn ? "Operation Nature" : (isEs ? "Naturaleza Operación" : "Natureza da Operação"),
      orderNumber: isEn ? "Order Number" : (isEs ? "Número Pedido" : "Número do Pedido"),
      expectedDelivery: isEn ? "Expected Delivery" : (isEs ? "Prev. Entrega" : "Previsão de Entrega"),
      carrierInfo: isEn ? "Carrier Information" : (isEs ? "Info Transportador" : "Informações do Transportador"),
      carrier: isEn ? "Carrier" : (isEs ? "Transportador" : "Transportador"),
      costBase: isEn ? "Cost Base" : (isEs ? "Base Costo" : "Base para Custo"),
      collectionStatus: isEn ? "Pickup Status" : (isEs ? "Status Recolecta" : "Status da Coleta"),
      customerInfo: isEn ? "Customer Information" : (isEs ? "Info Cliente" : "Informações do Cliente"),
      customer: isEn ? "Customer" : (isEs ? "Cliente" : "Cliente"),
      destCity: isEn ? "Dest. City" : (isEs ? "Ciudad Destino" : "Cidade de Destino"),
      destState: isEn ? "Dest. State" : (isEs ? "Estado Destino" : "UF de Destino"),
      financialInfo: isEn ? "Financial Information" : (isEs ? "Info Financiera" : "Informações Financeiras"),
      totalNfeValue: isEn ? "Total Invoice Value" : (isEs ? "Valor Total Factura" : "Valor Total da NF-e"),
      taxes: isEn ? "Taxes" : (isEs ? "Impuestos" : "Tributos"),
      cargoInfo: isEn ? "Cargo Information" : (isEs ? "Info Carga" : "Informações de Carga"),
      totalWeight: isEn ? "Total Weight" : (isEs ? "Peso Total" : "Peso Total"),
      volumes: isEn ? "Volumes" : (isEs ? "Volúmenes" : "Volumes"),
      notInformed: isEn ? "Not informed" : (isEs ? "No informado" : "Não informado"),
      fullCustomerData: isEn ? "Full Customer Data" : (isEs ? "Datos Comp. Cliente" : "Dados Completos do Cliente"),
      companyName: isEn ? "Company Name" : (isEs ? "Razón Social / Nombre" : "Razão Social / Nome"),
      address: isEn ? "Address" : (isEs ? "Dirección" : "Endereço"),
      cityState: isEn ? "City / State" : (isEs ? "Ciudad / Est." : "Cidade / UF"),
      phone: isEn ? "Phone" : (isEs ? "Teléfono" : "Telefone"),
      email: isEn ? "E-mail" : (isEs ? "Email" : "E-mail"),
      invoiceItems: isEn ? "Invoice Items ({{count}} item)" : (isEs ? "Ítems de Factura ({{count}} ítem)" : "Itens da Nota Fiscal ({{count}} item)"),
      invoiceItems_plural: isEn ? "Invoice Items ({{count}} items)" : (isEs ? "Ítems de Factura ({{count}} ítems)" : "Itens da Nota Fiscal ({{count}} itens)"),
      item: isEn ? "Item" : (isEs ? "Ítem" : "Item"),
      code: isEn ? "Code" : (isEs ? "Código" : "Código"),
      description: isEn ? "Description" : (isEs ? "Descripción" : "Descrição"),
      quantity: isEn ? "Quantity" : (isEs ? "Cantidad" : "Quantidade"),
      unit: isEn ? "Unit" : (isEs ? "Unidad" : "Unidade"),
      unitValue: isEn ? "Unit Value" : (isEs ? "Valor Unit." : "Valor Unit."),
      totalValue: isEn ? "Total Value" : (isEs ? "Valor Total" : "Valor Total"),
      itemsTotal: isEn ? "Items Total" : (isEs ? "Total Ítems" : "Total dos Itens"),
      noItemsFound: isEn ? "No items found" : (isEs ? "Ningún ítem encontrado" : "Nenhum item encontrado"),
      noItemsDescription: isEn ? "This invoice has no registered items." : (isEs ? "Esta factura no tiene ítems registrados." : "Esta nota fiscal não possui itens cadastrados."),
      statusHistory: isEn ? "Status History" : (isEs ? "Historial Status" : "Histórico de Status"),
      linkedCtesTitle: isEn ? "CT-es Linked to Invoice" : (isEs ? "CT-es Vinculados Factura" : "CT-es Vinculados à Nota Fiscal"),
      loadingCtes: isEn ? "Loading CT-es..." : (isEs ? "Cargando CT-es..." : "Carregando CT-es..."),
      noCtesFound: isEn ? "No linked CT-es found." : (isEs ? "Ningún CT-e vinculado." : "Nenhum CT-e vinculado encontrado."),
      totalCtes: isEn ? "Total CT-es" : (isEs ? "Total CT-es" : "Total de CT-es"),
      avgValue: isEn ? "Average Value" : (isEs ? "Valor Medio" : "Valor Médio"),
      serie: isEn ? "Series" : (isEs ? "Serie" : "Série")
    },
    status: {
      emTransitoOrigem: isEn ? "In Transit - Leaving Origin" : (isEs ? "En Tránsito - Salida Origen" : "Em Trânsito - Saindo da Origem"),
      emTransitoRodovia: isEn ? "In Transit on Highway" : (isEs ? "En Tránsito Rodovía" : "Em Trânsito na Rodovia"),
      chegouDestino: isEn ? "Arrived at Dest. City" : (isEs ? "Llegada Ciudad Destino" : "Chegada na Cidade de Destino"),
      disponivelColeta: isEn ? "Available for Pickup" : (isEs ? "Disponible Recolecta" : "Disponível para Coleta"),
      coletaRealizada: isEn ? "Pickup Completed" : (isEs ? "Recolecta Realizada" : "Coleta Realizada")
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
    details: newKeys.details,
    status: { ...data.invoices.status, ...newKeys.status }
  };
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
  console.log(`Updated locale ${lang}`);
});
