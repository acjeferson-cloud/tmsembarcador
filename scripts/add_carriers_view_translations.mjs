import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localesDir = path.join(__dirname, '../src/locales');

const newTranslationsPt = {
  carriers: {
    view: {
      notInformed: "Não informado",
      pageTitle: "Visualizar Transportador",
      pageSubtitle: "Detalhes completos do transportador",
      vision360Tab: "Visão 360",
      carrierData: "Dados do Transportador",
      status: "Status",
      activeDeliveries: "Entregas Ativas",
      contactInfo: "Informações de Contato",
      locationInfo: "Informações de Localização",
      toleranceSettings: "Configurações de Tolerância",
      cte: "CT-e",
      valueTolerance: "Tolerância de Valor",
      percentTolerance: "Tolerância de Percentual",
      invoice: "Fatura",
      performanceMetrics: "Métricas de Performance",
      averageRating: "Avaliação Média",
      deliveryRate: "Taxa de Entrega",
      country: "País",
      state: "Estado",
      city: "Cidade"
    }
  }
};

const newTranslationsEn = {
  carriers: {
    view: {
      notInformed: "Not informed",
      pageTitle: "View Carrier",
      pageSubtitle: "Complete carrier details",
      vision360Tab: "360° Vision",
      carrierData: "Carrier Data",
      status: "Status",
      activeDeliveries: "Active Deliveries",
      contactInfo: "Contact Information",
      locationInfo: "Location Information",
      toleranceSettings: "Tolerance Settings",
      cte: "CT-e (Bill of Lading)",
      valueTolerance: "Value Tolerance",
      percentTolerance: "Percentage Tolerance",
      invoice: "Invoice",
      performanceMetrics: "Performance Metrics",
      averageRating: "Average Rating",
      deliveryRate: "Delivery Rate",
      country: "Country",
      state: "State",
      city: "City"
    }
  }
};

const newTranslationsEs = {
  carriers: {
    view: {
      notInformed: "No informado",
      pageTitle: "Ver Transportista",
      pageSubtitle: "Detalles completos del transportista",
      vision360Tab: "Visión 360",
      carrierData: "Datos del Transportista",
      status: "Estado",
      activeDeliveries: "Entregas Activas",
      contactInfo: "Información de Contacto",
      locationInfo: "Información de Ubicación",
      toleranceSettings: "Configuraciones de Tolerancia",
      cte: "CT-e (Conocimiento de Embarque)",
      valueTolerance: "Tolerancia de Valor",
      percentTolerance: "Tolerancia de Porcentaje",
      invoice: "Factura",
      performanceMetrics: "Métricas de Rendimiento",
      averageRating: "Calificación Promedio",
      deliveryRate: "Tasa de Entrega",
      country: "País",
      state: "Estado",
      city: "Ciudad"
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
  if (!fileJson.carriers.view) fileJson.carriers.view = {};
  
  fileJson.carriers.view = deepMergeLocal(fileJson.carriers.view, ext.carriers.view);
  
  fs.writeFileSync(filePath, JSON.stringify(fileJson, null, 2), 'utf-8');
});

console.log('Translations for CarrierView merged successfully.');
