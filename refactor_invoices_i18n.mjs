import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function addUseTranslation(content) {
  if (content.includes('useTranslation')) return content;
  
  // Find where react is imported
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
  
  // Find main component definition
  const regex = new RegExp(`(export\\s+const\\s+${componentName}\\s*=\\s*[^=>]*=>\\s*{)`);
  if (content.match(regex)) {
    content = content.replace(regex, `$1\n  const { t } = useTranslation();\n`);
  } else {
    // try React.memo
    const regexMemo = new RegExp(`(export\\s+const\\s+${componentName}\\s*=\\s*React\\.memo[^=>]*=>\\s*{)`);
    if (content.match(regexMemo)) {
      content = content.replace(regexMemo, `$1\n  const { t } = useTranslation();\n`);
    }
  }
  return content;
}

// 1. Process InvoicesTable.tsx
let tableFile = fs.readFileSync('src/components/Invoices/InvoicesTable.tsx', 'utf8');
tableFile = addUseTranslation(tableFile);
tableFile = injectTHook(tableFile, 'InvoicesTable');

const tableReplacements = [
  ['<span>STATUS</span>', "<span>{t('invoices.table.status')}</span>"],
  ['<span>Série</span>', "<span>{t('invoices.table.serie')}</span>"],
  ['<span>Número</span>', "<span>{t('invoices.table.number')}</span>"],
  ['<span>Data Emissão</span>', "<span>{t('invoices.table.issueDate')}</span>"],
  ['<span>Data Entrada</span>', "<span>{t('invoices.table.entryDate')}</span>"],
  ['<span>Previsão Entrega</span>', "<span>{t('invoices.table.expectedDate')}</span>"],
  ['<span>Transportador</span>', "<span>{t('invoices.table.carrier')}</span>"],
  ['<span>Valor NF-e</span>', "<span>{t('invoices.table.nfeValue')}</span>"],
  ['<span>Valor Custo</span>', "<span>{t('invoices.table.costValue')}</span>"],
  ['<span>Cliente</span>', "<span>{t('invoices.table.customer')}</span>"],
  ['<span>Cidade Destino</span>', "<span>{t('invoices.table.destCity')}</span>"],
  ['<span>UF Destino</span>', "<span>{t('invoices.table.destState')}</span>"],
  // Th headers without span
  ['Ações\n                </th>', "{t('invoices.table.actions')}\n                </th>"],
  // Tooltips
  ['title="Visualizar Detalhes"', "title={t('invoices.table.viewDetails')}"],
  ['title="Lançar Ocorrência"', "title={t('invoices.table.launchOccurrence')}"],
  ['title="Recalcular Nota Fiscal"', "title={t('invoices.table.recalculate')}"],
  ['title="Mapa de Relações"', "title={t('invoices.table.relationshipMap')}"],
  ['title="Mais ações"', "title={t('invoices.table.moreActions')}"],
  ['<span>Editar Nota Fiscal</span>', "<span>{t('invoices.table.editInvoice')}</span>"],
  ['<span>Excluir Nota Fiscal</span>', "<span>{t('invoices.table.deleteInvoice')}</span>"],
  
  // Status mapping
  ['return \'Emitida\';', "return t('invoices.status.emitida');"],
  ['return \'Em Coleta\';', "return t('invoices.status.emColeta');"],
  ['return \'Em trânsito\';', "return t('invoices.status.emTransito');"],
  ['return \'Saiu p/ Entrega\';', "return t('invoices.status.saiuParaEntrega');"],
  ['return \'Entregue\';', "return t('invoices.status.entregue');"],
  ['return \'Cancelada\';', "return t('invoices.status.cancelada');"],
  [/return status \? status\.charAt\(0\)\.toUpperCase\(\) \+ status\.slice\(1\) : 'Emitida';/, "return status ? status.charAt(0).toUpperCase() + status.slice(1) : t('invoices.status.emitida');"],
  
  // Pagination
  ['Mostrando <span className="font-medium">{paginatedInvoices.length}</span> de <span className="font-medium">{invoices.length}</span> notas fiscais', 
   "{t('invoices.pagination.showing')} <span className=\"font-medium\">{paginatedInvoices.length}</span> {t('invoices.pagination.of')} <span className=\"font-medium\">{invoices.length}</span> {t('invoices.pagination.nfe')}"],
  ['<option value={10}>10 por página</option>', "<option value={10}>10 {t('invoices.pagination.perPage')}</option>"],
  ['<option value={25}>25 por página</option>', "<option value={25}>25 {t('invoices.pagination.perPage')}</option>"],
  ['<option value={50}>50 por página</option>', "<option value={50}>50 {t('invoices.pagination.perPage')}</option>"],
  ['<option value={100}>100 por página</option>', "<option value={100}>100 {t('invoices.pagination.perPage')}</option>"],
  ['Anterior\n            </button>', "{t('invoices.pagination.previous')}\n            </button>"],
  ['Próximo\n            </button>', "{t('invoices.pagination.next')}\n            </button>"],
  ['Página <span className="font-medium">{currentPage}</span> de <span className="font-medium">{totalPages}</span>', 
   "{t('invoices.pagination.page')} <span className=\"font-medium\">{currentPage}</span> {t('invoices.pagination.of')} <span className=\"font-medium\">{totalPages}</span>"]
];

for (const [s, r] of tableReplacements) {
  tableFile = tableFile.replace(s, r);
}
fs.writeFileSync('src/components/Invoices/InvoicesTable.tsx', tableFile);


// 2. Process InvoicesFilters.tsx
let filtersFile = fs.readFileSync('src/components/Invoices/InvoicesFilters.tsx', 'utf8');
filtersFile = addUseTranslation(filtersFile);
filtersFile = injectTHook(filtersFile, 'InvoicesFilters');

const filterReplacements = [
  ['placeholder="Buscar por número ou chave de acesso..."', "placeholder={t('invoices.filters.searchPlaceholder')}"],
  ['<span>Filtros Avançados</span>', "<span>{t('invoices.filters.advancedFilters')}</span>"],
  ['<span>Transportador</span>', "<span>{t('invoices.filters.carrier')}</span>"],
  ['<option value="">Todos os Transportadores</option>', "<option value=\"\">{t('invoices.filters.allCarriers')}</option>"],
  ['<span>Cliente</span>', "<span>{t('invoices.filters.customer')}</span>"],
  ['placeholder="Digite o nome do cliente"', "placeholder={t('invoices.filters.customerPlaceholder')}"],
  ['<span>Período de Emissão</span>', "<span>{t('invoices.filters.issuePeriod')}</span>"],
  ['<span>Período de Entrada</span>', "<span>{t('invoices.filters.entryPeriod')}</span>"],
  ['<span>UF de Destino</span>', "<span>{t('invoices.filters.destState')}</span>"],
  ['<option value="">Todas as UFs</option>', "<option value=\"\">{t('invoices.filters.allStates')}</option>"],
  ['<span>Cidade de Destino</span>', "<span>{t('invoices.filters.destCity')}</span>"],
  ['placeholder="Digite a cidade de destino"', "placeholder={t('invoices.filters.destCityPlaceholder')}"],
  ['<span>Base para Custo</span>', "<span>{t('invoices.filters.costBase')}</span>"],
  ['<option value="">Todas</option>', "<option value=\"\">{t('invoices.filters.all')}</option>"],
  ['<option value="tabela">Tabela de Frete</option>', "<option value=\"tabela\">{t('invoices.filters.freightTable')}</option>"],
  ['<option value="negociacao">Negociação Individual</option>', "<option value=\"negociacao\">{t('invoices.filters.individualNegotiation')}</option>"],
  ['<span>Status da NF-e</span>', "<span>{t('invoices.filters.nfeStatus')}</span>"],
  
  ['Nota Fiscal Emitida\n                </label>', "{t('invoices.status.emitida')}\n                </label>"],
  ['Em Coleta\n                </label>', "{t('invoices.status.emColeta')}\n                </label>"],
  ['Em Trânsito\n                </label>', "{t('invoices.status.emTransito')}\n                </label>"],
  ['Saiu para Entrega\n                </label>', "{t('invoices.status.saiuParaEntrega')}\n                </label>"],
  ['Entregue\n                </label>', "{t('invoices.status.entregue')}\n                </label>"],
  ['Cancelada\n                </label>', "{t('invoices.status.cancelada')}\n                </label>"],
  
  ['Limpar Filtros\n            </button>', "{t('invoices.filters.clearFilters')}\n            </button>"],
  ['Aplicar Filtros\n            </button>', "{t('invoices.filters.applyFilters')}\n            </button>"]
];

for (const [s, r] of filterReplacements) {
  filtersFile = filtersFile.replace(s, r);
}
fs.writeFileSync('src/components/Invoices/InvoicesFilters.tsx', filtersFile);


// 3. Process Invoices.tsx
let invoicesFile = fs.readFileSync('src/components/Invoices/Invoices.tsx', 'utf8');
invoicesFile = addUseTranslation(invoicesFile);
invoicesFile = injectTHook(invoicesFile, 'Invoices');

const invoicesReplacements = [
  ['<span className="font-medium">Debug Auto-Import</span>', '<span className="font-medium">{t(\'invoices.actions.debugAutoImport\')}</span>'],
  ['<h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notas Fiscais</h1>', '<h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t(\'invoices.pageTitle\')}</h1>'],
  ['<p className="text-gray-600 dark:text-gray-400">Visualize, audite e gerencie todas as Notas Fiscais importadas no sistema</p>', '<p className="text-gray-600 dark:text-gray-400">{t(\'invoices.pageDescription\')}</p>'],
  ['<span>Inserir Nota Fiscal</span>', '<span>{t(\'invoices.actions.insertInvoice\')}</span>'],
  ['<span>Inserir XML em Lote</span>', '<span>{t(\'invoices.actions.bulkXmlImport\')}</span>'],
  ['<span>{isLoading ? \'Carregando...\' : \'Atualizar\'}</span>', '<span>{isLoading ? t(\'invoices.actions.loading\') : t(\'invoices.actions.refresh\')}</span>'],
  
  ['<p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de NF-es</p>', '<p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t(\'invoices.summary.totalNfes\')}</p>'],
  ['<p className="text-sm font-medium text-gray-600 dark:text-gray-400">Emitidas</p>', '<p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t(\'invoices.summary.issued\')}</p>'],
  ['<p className="text-sm font-medium text-gray-600 dark:text-gray-400">Em Coleta</p>', '<p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t(\'invoices.summary.inCollection\')}</p>'],
  ['<p className="text-sm font-medium text-gray-600 dark:text-gray-400">Em Trânsito</p>', '<p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t(\'invoices.summary.inTransit\')}</p>'],
  ['<p className="text-sm font-medium text-gray-600 dark:text-gray-400">Saiu p/ Entrega</p>', '<p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t(\'invoices.summary.outForDelivery\')}</p>'],
  ['<p className="text-sm font-medium text-gray-600 dark:text-gray-400">Entregues</p>', '<p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t(\'invoices.summary.delivered\')}</p>'],
  ['<p className="text-sm font-medium text-gray-600 dark:text-gray-400">Canceladas</p>', '<p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t(\'invoices.summary.canceled\')}</p>'],
  
  ['<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhuma nota fiscal encontrada</h3>', '<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t(\'invoices.empty.title\')}</h3>'],
  ['<p className="text-gray-600 dark:text-gray-400">Tente ajustar os filtros ou importar novas notas fiscais.</p>', '<p className="text-gray-600 dark:text-gray-400">{t(\'invoices.empty.description\')}</p>'],
  ['<p className="text-gray-800 dark:text-gray-200 font-medium">Processando...</p>', '<p className="text-gray-800 dark:text-gray-200 font-medium">{t(\'invoices.loading\')}</p>']
];

for (const [s, r] of invoicesReplacements) {
  invoicesFile = invoicesFile.replace(s, r);
}
fs.writeFileSync('src/components/Invoices/Invoices.tsx', invoicesFile);


// 4. Process InvoicesActions.tsx
let actionsFile = fs.readFileSync('src/components/Invoices/InvoicesActions.tsx', 'utf8');
actionsFile = addUseTranslation(actionsFile);
actionsFile = injectTHook(actionsFile, 'InvoicesActions');

const actionsReplacements = [
  ['<span>Criar Coleta(s)</span>', '<span>{t(\'invoices.actions.createPickup\')}</span>'],
  ['<span>Recalcular Nota Fiscal</span>', '<span>{t(\'invoices.actions.recalculate\')}</span>'],
  ['<span>Imprimir DANFE</span>', '<span>{t(\'invoices.actions.printDanfe\')}</span>'],
  ['<span>Download XMLs</span>', '<span>{t(\'invoices.actions.downloadXmls\')}</span>'],
  [
    "{selectedCount} Nota{selectedCount !== 1 ? 's' : ''} Fiscal{selectedCount !== 1 ? 'is' : ''} selecionada{selectedCount !== 1 ? 's' : ''}",
    "{selectedCount} {selectedCount !== 1 ? t('invoices.actions.selectedPlural') : t('invoices.actions.selectedSingular')}"
  ]
];

for (const [s, r] of actionsReplacements) {
  actionsFile = actionsFile.replace(s, r);
}
fs.writeFileSync('src/components/Invoices/InvoicesActions.tsx', actionsFile);

// 5. Update the translation files
const buildTranslation = (lang) => {
  const isEn = lang === 'en';
  const isEs = lang === 'es';
  
  return {
    invoices: {
      pageTitle: isEn ? "Invoices" : (isEs ? "Facturas" : "Notas Fiscais"),
      pageDescription: isEn ? "View, audit and manage all invoices imported in the system" : (isEs ? "Vea, audite y gestione todas las facturas importadas en el sistema" : "Visualize, audite e gerencie todas as Notas Fiscais importadas no sistema"),
      actions: {
        debugAutoImport: "Debug Auto-Import",
        insertInvoice: isEn ? "Insert Invoice" : (isEs ? "Insertar Factura" : "Inserir Nota Fiscal"),
        bulkXmlImport: isEn ? "Bulk XML Import" : (isEs ? "Importar XML por Lotes" : "Inserir XML em Lote"),
        refresh: isEn ? "Refresh" : (isEs ? "Actualizar" : "Atualizar"),
        loading: isEn ? "Loading..." : (isEs ? "Cargando..." : "Carregando..."),
        createPickup: isEn ? "Create Pickup(s)" : (isEs ? "Crear Recolecta(s)" : "Criar Coleta(s)"),
        recalculate: isEn ? "Recalculate Invoice" : (isEs ? "Recalcular Factura" : "Recalcular Nota Fiscal"),
        printDanfe: isEn ? "Print DANFE" : (isEs ? "Imprimir DANFE" : "Imprimir DANFE"),
        downloadXmls: isEn ? "Download XMLs" : (isEs ? "Descargar XMLs" : "Download XMLs"),
        selectedSingular: isEn ? "Invoice selected" : (isEs ? "Factura seleccionada" : "Nota Fiscal selecionada"),
        selectedPlural: isEn ? "Invoices selected" : (isEs ? "Facturas seleccionadas" : "Notas Fiscais selecionadas")
      },
      summary: {
        totalNfes: isEn ? "Total Invoices" : (isEs ? "Total Facturas" : "Total de NF-es"),
        issued: isEn ? "Issued" : (isEs ? "Emitidas" : "Emitidas"),
        inCollection: isEn ? "In Collection" : (isEs ? "En Recolecta" : "Em Coleta"),
        inTransit: isEn ? "In Transit" : (isEs ? "En Tránsito" : "Em Trânsito"),
        outForDelivery: isEn ? "Out for Delivery" : (isEs ? "Salió para Entrega" : "Saiu p/ Entrega"),
        delivered: isEn ? "Delivered" : (isEs ? "Entregadas" : "Entregues"),
        canceled: isEn ? "Canceled" : (isEs ? "Canceladas" : "Canceladas")
      },
      empty: {
        title: isEn ? "No invoices found" : (isEs ? "No se encontraron facturas" : "Nenhuma nota fiscal encontrada"),
        description: isEn ? "Try adjusting the filters or importing new invoices." : (isEs ? "Intente ajustar los filtros o importar nuevas facturas." : "Tente ajustar os filtros ou importar novas notas fiscais.")
      },
      loading: isEn ? "Processing..." : (isEs ? "Procesando..." : "Processando..."),
      table: {
        status: "STATUS",
        serie: isEn ? "Series" : (isEs ? "Serie" : "Série"),
        number: isEn ? "Number" : (isEs ? "Número" : "Número"),
        issueDate: isEn ? "Issue Date" : (isEs ? "Fecha Emisión" : "Data Emissão"),
        entryDate: isEn ? "Entry Date" : (isEs ? "Fecha Entrada" : "Data Entrada"),
        expectedDate: isEn ? "Expected Date" : (isEs ? "Prev. Entrega" : "Previsão Entrega"),
        carrier: isEn ? "Carrier" : (isEs ? "Transportista" : "Transportador"),
        nfeValue: isEn ? "Invoice Value" : (isEs ? "Valor Factura" : "Valor NF-e"),
        costValue: isEn ? "Cost Value" : (isEs ? "Valor Costo" : "Valor Custo"),
        customer: isEn ? "Customer" : (isEs ? "Cliente" : "Cliente"),
        destCity: isEn ? "Dest. City" : (isEs ? "Ciudad Destino" : "Cidade Destino"),
        destState: isEn ? "Dest. State" : (isEs ? "Estado Destino" : "UF Destino"),
        actions: isEn ? "Actions" : (isEs ? "Acciones" : "Ações"),
        viewDetails: isEn ? "View Details" : (isEs ? "Ver Detalles" : "Visualizar Detalhes"),
        launchOccurrence: isEn ? "Launch Occurrence" : (isEs ? "Lanzar Ocurrencia" : "Lançar Ocorrência"),
        recalculate: isEn ? "Recalculate Invoice" : (isEs ? "Recalcular Factura" : "Recalcular Nota Fiscal"),
        relationshipMap: isEn ? "Relationship Map" : (isEs ? "Mapa de Relaciones" : "Mapa de Relações"),
        moreActions: isEn ? "More Actions" : (isEs ? "Más Acciones" : "Mais ações"),
        editInvoice: isEn ? "Edit Invoice" : (isEs ? "Editar Factura" : "Editar Nota Fiscal"),
        deleteInvoice: isEn ? "Delete Invoice" : (isEs ? "Eliminar Factura" : "Excluir Nota Fiscal")
      },
      status: {
        emitida: isEn ? "Issued" : (isEs ? "Emitida" : "Emitida"),
        emColeta: isEn ? "In Collection" : (isEs ? "En Recolecta" : "Em Coleta"),
        emTransito: isEn ? "In Transit" : (isEs ? "En Tránsito" : "Em trânsito"),
        saiuParaEntrega: isEn ? "Out for Dlvry" : (isEs ? "Para Entrega" : "Saiu p/ Entrega"),
        entregue: isEn ? "Delivered" : (isEs ? "Entregado" : "Entregue"),
        cancelada: isEn ? "Canceled" : (isEs ? "Cancelada" : "Cancelada")
      },
      pagination: {
        showing: isEn ? "Showing" : (isEs ? "Mostrando" : "Mostrando"),
        of: isEn ? "of" : (isEs ? "de" : "de"),
        nfe: isEn ? "invoices" : (isEs ? "facturas" : "notas fiscais"),
        perPage: isEn ? "per page" : (isEs ? "por página" : "por página"),
        previous: isEn ? "Previous" : (isEs ? "Anterior" : "Anterior"),
        next: isEn ? "Next" : (isEs ? "Siguiente" : "Próximo"),
        page: isEn ? "Page" : (isEs ? "Página" : "Página")
      },
      filters: {
        searchPlaceholder: isEn ? "Search by number or access key..." : (isEs ? "Buscar por número o clave de acceso..." : "Buscar por número ou chave de acesso..."),
        advancedFilters: isEn ? "Advanced Filters" : (isEs ? "Filtros Avanzados" : "Filtros Avançados"),
        carrier: isEn ? "Carrier" : (isEs ? "Transportista" : "Transportador"),
        allCarriers: isEn ? "All Carriers" : (isEs ? "Todos los Transportistas" : "Todos os Transportadores"),
        customer: isEn ? "Customer" : (isEs ? "Cliente" : "Cliente"),
        customerPlaceholder: isEn ? "Enter customer name" : (isEs ? "Introduzca nombre del cliente" : "Digite o nome do cliente"),
        issuePeriod: isEn ? "Issue Period" : (isEs ? "Período Misión" : "Período de Emissão"),
        entryPeriod: isEn ? "Entry Period" : (isEs ? "Período Entrada" : "Período de Entrada"),
        destState: isEn ? "Destination State" : (isEs ? "Estado Destino" : "UF de Destino"),
        allStates: isEn ? "All States" : (isEs ? "Todos los Estados" : "Todas as UFs"),
        destCity: isEn ? "Destination City" : (isEs ? "Ciudad Destino" : "Cidade de Destino"),
        destCityPlaceholder: isEn ? "Enter destination city" : (isEs ? "Introduzca ciudad de destino" : "Digite a cidade de destino"),
        costBase: isEn ? "Cost Base" : (isEs ? "Base Costo" : "Base para Custo"),
        all: isEn ? "All" : (isEs ? "Todas" : "Todas"),
        freightTable: isEn ? "Freight Table" : (isEs ? "Tabla Flete" : "Tabela de Frete"),
        individualNegotiation: isEn ? "Individual Negotiation" : (isEs ? "Negociación Indv." : "Negociação Individual"),
        nfeStatus: isEn ? "Invoice Status" : (isEs ? "Estado Factura" : "Status da NF-e"),
        clearFilters: isEn ? "Clear Filters" : (isEs ? "Limpiar Filtros" : "Limpar Filtros"),
        applyFilters: isEn ? "Apply Filters" : (isEs ? "Aplicar Filtros" : "Aplicar Filtros")
      }
    }
  };
};

const locales = ['pt', 'en', 'es'];
locales.forEach(lang => {
  const p = path.join(__dirname, 'src', 'locales', lang, 'translation.json');
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  const invoicesData = buildTranslation(lang).invoices;
  
  data.invoices = { ...data.invoices, ...invoicesData };
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
  console.log(`Updated locale: ${lang}`);
});
