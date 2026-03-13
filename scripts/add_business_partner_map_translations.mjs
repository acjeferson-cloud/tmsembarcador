import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.resolve(__dirname, '../src/locales');
const languages = ['pt', 'en', 'es'];

const translations = {
  pt: {
    map: {
      errors: {
        loadError: "Erro ao carregar o Google Maps. Configure a chave de API nas configurações.",
        apiNotAvailable: "Google Maps API não está disponível",
        initError: "Erro ao inicializar o mapa",
        configKey: "Configure sua chave de API do Google Maps nas configurações do sistema."
      },
      loading: "Carregando mapa...",
      legend: {
        title: "Legenda"
      },
      partnersCount: "{{count}} parceiros no mapa",
      partnerCount_one: "{{count}} parceiro no mapa",
      partnerCount_other: "{{count}} parceiros no mapa" // Plural rule
    }
  },
  en: {
    map: {
      errors: {
        loadError: "Error loading Google Maps. Configure the API key in settings.",
        apiNotAvailable: "Google Maps API is not available",
        initError: "Error initializing the map",
        configKey: "Configure your Google Maps API key in system settings."
      },
      loading: "Loading map...",
      legend: {
        title: "Legend"
      },
      partnersCount: "{{count}} partners on map",
      partnerCount_one: "{{count}} partner on map",
      partnerCount_other: "{{count}} partners on map"
    }
  },
  es: {
    map: {
      errors: {
        loadError: "Error al cargar Google Maps. Configure la clave API en la configuración.",
        apiNotAvailable: "La API de Google Maps no está disponible",
        initError: "Error al inicializar el mapa",
        configKey: "Configure su clave API de Google Maps en la configuración del sistema."
      },
      loading: "Cargando mapa...",
      legend: {
        title: "Leyenda"
      },
      partnersCount: "{{count}} socios en el mapa",
      partnerCount_one: "{{count}} socio en el mapa",
      partnerCount_other: "{{count}} socios en el mapa"
    }
  }
};

languages.forEach(lang => {
  const filePath = path.join(localesDir, lang, 'translation.json');
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(fileContent);
    
    // Initialise if not exists
    if (!json.businessPartners) {
      json.businessPartners = {};
    }

    json.businessPartners.map = {
      ...(json.businessPartners.map || {}),
      ...translations[lang].map
    };

    fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
    console.log(`Updated map translations for ${lang}`);
  } else {
    console.error(`File not found: ${filePath}`);
  }
});
