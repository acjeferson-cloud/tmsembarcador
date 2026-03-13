import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localesDir = path.join(__dirname, '../src/locales');

const newTranslationsPt = {
  carriers: {
    searchPlaceholderExtended: "Buscar por código, nome, CNPJ ou email...",
    newCarrier: "Novo Transportador",
    backToCarriers: "Voltar para Transportadores",
    viewAction: "Visualizar",
    editAction: "Editar",
    deleteAction: "Excluir",
    emptyState: {
      title: "Nenhum transportador encontrado",
      subtitle: "Tente ajustar os filtros ou cadastrar um novo transportador."
    },
    pagination: {
      showing: "Mostrando {{start}} a {{end}} de {{total}} transportadores",
      previous: "Anterior",
      next: "Próximo"
    },
    freightRates: {
      title: "Tabelas de Frete",
      manageTables: "Gerencie as tabelas de frete deste transportador"
    },
    modals: {
      attended: "Modais Atendidos",
      rodoviario: "Rodoviário",
      aereo: "Aéreo",
      aquaviario: "Aquaviário",
      ferroviario: "Ferroviário"
    },
    status: {
      active: "Ativo",
      inactive: "Inativo"
    },
    form: {
      code: "Código",
      codeSequential: "Código Sequencial",
      codeSequentialHelp1: "Os códigos são gerados automaticamente em sequência numérica começando em 0001.",
      codeSequentialHelpNew: "Clique no ícone # para gerar o próximo código disponível.",
      codeSequentialHelpEdit: "O código não pode ser alterado após o cadastro.",
      generateNextCode: "Gerar próximo código",
      codeRequired: "Código é obrigatório",
      codeInUse: "Este código já está sendo usado por outro transportador",
      cnpjRequired: "CNPJ é obrigatório",
      companyNameRequired: "Razão Social é obrigatória",
      searchRFB: "Buscar dados da Receita Federal",
      importNotAllowed: "Importação não permitida. {{status}}\\n\\nApenas empresas com situação ATIVA podem ser cadastradas.",
      dataImportedSuccess: "✓ Dados importados com sucesso! {{status}}",
      cnpjError: "Erro ao consultar CNPJ. Tente novamente.",
      invalidCnpj: "Informe um CNPJ válido.",
      cepNeeds8Digits: "CEP deve conter 8 dígitos",
      searchingCep: "Buscando CEP...",
      stateNotFound: "Estado não encontrado no sistema",
      cepNotFound: "CEP não encontrado",
      cepError: "Erro ao buscar CEP. Tente novamente.",
      fillCarrierData: "Preencha os dados do transportador",
      logoText: "Sua logo de transportador",
      tolerances: "Tolerâncias",
      toleranceCteLabel: "Tolerância de Valor CT-e",
      toleranceCtePercentLabel: "Tolerância de Percentual CT-e",
      toleranceInvoiceLabel: "Tolerância de Valor Fatura",
      toleranceInvoicePercentLabel: "Tolerância de Percentual Fatura",
      uploadLogo: "Enviar Logo",
      removeLogo: "Remover",
      logoHelp: "PNG, JPG ou GIF até 2MB",
      notInformed: "Não informado"
    },
    view: {
      title: "Visualizar Transportador",
      details: "Detalhes completos do transportador",
      carrierData: "Dados do Transportador",
      freightRates: "Tabelas de Frete",
      locationInfo: "Informações de Localização",
      country: "País",
      state: "Estado",
      city: "Cidade",
      toleranceSettings: "Configurações de Tolerância",
      cte: "CT-e",
      invoice: "Fatura",
      valueTolerance: "Tolerância de Valor",
      percentTolerance: "Tolerância de Percentual",
      transportModals: "Modais de Transporte",
      avgRating: "Avaliação Média",
      deliveryRate: "Taxa de Entrega"
    }
  }
};

const newTranslationsEn = {
  carriers: {
    searchPlaceholderExtended: "Search by code, name, CNPJ or email...",
    newCarrier: "New Carrier",
    backToCarriers: "Back to Carriers",
    viewAction: "View",
    editAction: "Edit",
    deleteAction: "Delete",
    emptyState: {
      title: "No carriers found",
      subtitle: "Try adjusting your filters or registering a new carrier."
    },
    pagination: {
      showing: "Showing {{start}} to {{end}} of {{total}} carriers",
      previous: "Previous",
      next: "Next"
    },
    freightRates: {
      title: "Freight Rates",
      manageTables: "Manage freight rates for this carrier"
    },
    modals: {
      attended: "Attended Modals",
      rodoviario: "Road",
      aereo: "Air",
      aquaviario: "Waterway",
      ferroviario: "Railway"
    },
    status: {
      active: "Active",
      inactive: "Inactive"
    },
    form: {
      code: "Code",
      codeSequential: "Sequential Code",
      codeSequentialHelp1: "Codes are automatically generated in numerical sequence starting from 0001.",
      codeSequentialHelpNew: "Click the # icon to generate the next available code.",
      codeSequentialHelpEdit: "The code cannot be changed after registration.",
      generateNextCode: "Generate next code",
      codeRequired: "Code is required",
      codeInUse: "This code is already in use by another carrier",
      cnpjRequired: "CNPJ is required",
      companyNameRequired: "Company Name is required",
      searchRFB: "Search Federal Revenue data",
      importNotAllowed: "Import not allowed. {{status}}\\n\\nOnly companies with ACTIVE status can be registered.",
      dataImportedSuccess: "✓ Data imported successfully! {{status}}",
      cnpjError: "Error consulting CNPJ. Try again.",
      invalidCnpj: "Enter a valid CNPJ.",
      cepNeeds8Digits: "ZIP code must contain 8 digits",
      searchingCep: "Searching ZIP code...",
      stateNotFound: "State not found in the system",
      cepNotFound: "ZIP code not found",
      cepError: "Error searching ZIP code. Try again.",
      fillCarrierData: "Fill in the carrier details",
      logoText: "Carrier Logo",
      tolerances: "Tolerances",
      toleranceCteLabel: "CT-e Value Tolerance",
      toleranceCtePercentLabel: "CT-e Percent Tolerance",
      toleranceInvoiceLabel: "Invoice Value Tolerance",
      toleranceInvoicePercentLabel: "Invoice Percent Tolerance",
      uploadLogo: "Upload Logo",
      removeLogo: "Remove",
      logoHelp: "PNG, JPG or GIF up to 2MB",
      notInformed: "Not informed"
    },
    view: {
      title: "View Carrier",
      details: "Complete carrier details",
      carrierData: "Carrier Data",
      freightRates: "Freight Rates",
      locationInfo: "Location Information",
      country: "Country",
      state: "State",
      city: "City",
      toleranceSettings: "Tolerance Settings",
      cte: "CT-e",
      invoice: "Invoice",
      valueTolerance: "Value Tolerance",
      percentTolerance: "Percent Tolerance",
      transportModals: "Transport Modals",
      avgRating: "Average Rating",
      deliveryRate: "Delivery Rate"
    }
  }
};

const newTranslationsEs = {
  carriers: {
    searchPlaceholderExtended: "Buscar por código, nombre, CNPJ o correo electrónico...",
    newCarrier: "Nuevo Transportista",
    backToCarriers: "Volver a Transportistas",
    viewAction: "Ver",
    editAction: "Editar",
    deleteAction: "Eliminar",
    emptyState: {
      title: "No se encontraron transportistas",
      subtitle: "Intente ajustar los filtros o registrar un nuevo transportista."
    },
    pagination: {
      showing: "Mostrando {{start}} a {{end}} de {{total}} transportistas",
      previous: "Anterior",
      next: "Siguiente"
    },
    freightRates: {
      title: "Tarifas de Flete",
      manageTables: "Administrar tablas de flete para este transportista"
    },
    modals: {
      attended: "Modalidades Atendidas",
      rodoviario: "Carretera",
      aereo: "Aéreo",
      aquaviario: "Vía fluvial",
      ferroviario: "Ferrocarril"
    },
    status: {
      active: "Activo",
      inactive: "Inactivo"
    },
    form: {
      code: "Código",
      codeSequential: "Código Secuencial",
      codeSequentialHelp1: "Los códigos se generan automáticamente en secuencia numérica a partir del 0001.",
      codeSequentialHelpNew: "Haga clic en el ícono # para generar el próximo código disponible.",
      codeSequentialHelpEdit: "El código no se puede cambiar después del registro.",
      generateNextCode: "Generar próximo código",
      codeRequired: "El código es obligatorio",
      codeInUse: "Este código ya está en uso por otro transportista",
      cnpjRequired: "CNPJ es obligatorio",
      companyNameRequired: "La Razón Social es obligatoria",
      searchRFB: "Buscar datos de Ingresos Federales",
      importNotAllowed: "Importación no permitida. {{status}}\\n\\nSolo las empresas con estado ACTIVO pueden ser registradas.",
      dataImportedSuccess: "✓ ¡Datos importados con éxito! {{status}}",
      cnpjError: "Error al consultar CNPJ. Intente de nuevo.",
      invalidCnpj: "Ingrese un CNPJ válido.",
      cepNeeds8Digits: "El código postal debe contener 8 dígitos",
      searchingCep: "Buscando código postal...",
      stateNotFound: "Estado no encontrado en el sistema",
      cepNotFound: "Código postal no encontrado",
      cepError: "Error al buscar el código postal. Intente de nuevo.",
      fillCarrierData: "Complete los datos del transportista",
      logoText: "Logotipo del Transportista",
      tolerances: "Tolerancias",
      toleranceCteLabel: "Tolerancia de Valor CT-e",
      toleranceCtePercentLabel: "Tolerancia Porcentual CT-e",
      toleranceInvoiceLabel: "Tolerancia de Valor Factura",
      toleranceInvoicePercentLabel: "Tolerancia Porcentual Factura",
      uploadLogo: "Subir Logotipo",
      removeLogo: "Eliminar",
      logoHelp: "PNG, JPG o GIF hasta 2MB",
      notInformed: "No informado"
    },
    view: {
      title: "Ver Transportista",
      details: "Detalles completos del transportista",
      carrierData: "Datos del Transportista",
      freightRates: "Tarifas de Flete",
      locationInfo: "Información de Ubicación",
      country: "País",
      state: "Estado",
      city: "Ciudad",
      toleranceSettings: "Configuraciones de Tolerancia",
      cte: "CT-e",
      invoice: "Factura",
      valueTolerance: "Tolerancia de Valor",
      percentTolerance: "Tolerancia Porcentual",
      transportModals: "Modalidades de Transporte",
      avgRating: "Calificación Promedio",
      deliveryRate: "Tasa de Entrega"
    }
  }
};

const langs = [
  { code: 'pt', ext: newTranslationsPt },
  { code: 'en', ext: newTranslationsEn },
  { code: 'es', ext: newTranslationsEs }
];

function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

function deepMergeLocal(target, source) {
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMergeLocal(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }
  return target;
}

langs.forEach(({ code, ext }) => {
  const filePath = path.join(localesDir, code, 'translation.json');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const fileJson = JSON.parse(fileContent);
  
  if (!fileJson.carriers) fileJson.carriers = {};
  fileJson.carriers = deepMergeLocal(fileJson.carriers, ext.carriers);
  
  fs.writeFileSync(filePath, JSON.stringify(fileJson, null, 2), 'utf-8');
});

console.log('Translations merged successfully.');
