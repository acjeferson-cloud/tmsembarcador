import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.resolve(__dirname, '../src/locales');
const languages = ['pt', 'en', 'es'];

const translations = {
  pt: {
    view: {
      typeLabel: {
        customer: "Cliente",
        supplier: "Fornecedor",
        both: "Cliente/Fornecedor",
        default: "Desconhecido"
      },
      statusLabel: {
        active: "Ativo",
        inactive: "Inativo"
      },
      addressTypeLabel: {
        billing: "Cobrança",
        delivery: "Entrega",
        correspondence: "Correspondência",
        commercial: "Comercial",
        shipping: "Expedição",
        both: "Cobrança e Entrega",
        default: "Outro"
      },
      tabs: {
        vision360: "Visão 360",
        basicData: "Dados Básicos"
      },
      actions: {
        edit: "Editar",
        close: "Fechar"
      },
      sections: {
        basicInfo: "Informações Básicas",
        contacts: "Pessoas de Contato",
        addresses: "Endereços",
        observations: "Observações",
        systemInfo: "Informações do Sistema"
      },
      labels: {
        type: "Tipo",
        status: "Status",
        email: "Email",
        phone: "Telefone",
        primaryContact: "Principal",
        primaryAddress: "Principal",
        createdAt: "Criado em",
        updatedAt: "Última atualização"
      }
    }
  },
  en: {
    view: {
      typeLabel: {
        customer: "Customer",
        supplier: "Supplier",
        both: "Customer/Supplier",
        default: "Unknown"
      },
      statusLabel: {
        active: "Active",
        inactive: "Inactive"
      },
      addressTypeLabel: {
        billing: "Billing",
        delivery: "Delivery",
        correspondence: "Correspondence",
        commercial: "Commercial",
        shipping: "Shipping",
        both: "Billing and Delivery",
        default: "Other"
      },
      tabs: {
        vision360: "Vision 360",
        basicData: "Basic Data"
      },
      actions: {
        edit: "Edit",
        close: "Close"
      },
      sections: {
        basicInfo: "Basic Information",
        contacts: "Contact Persons",
        addresses: "Addresses",
        observations: "Observations",
        systemInfo: "System Information"
      },
      labels: {
        type: "Type",
        status: "Status",
        email: "Email",
        phone: "Phone",
        primaryContact: "Primary",
        primaryAddress: "Primary",
        createdAt: "Created at",
        updatedAt: "Last updated"
      }
    }
  },
  es: {
    view: {
      typeLabel: {
        customer: "Cliente",
        supplier: "Proveedor",
        both: "Cliente/Proveedor",
        default: "Desconocido"
      },
      statusLabel: {
        active: "Activo",
        inactive: "Inactivo"
      },
      addressTypeLabel: {
        billing: "Facturación",
        delivery: "Entrega",
        correspondence: "Correspondencia",
        commercial: "Comercial",
        shipping: "Expedición",
        both: "Facturación y Entrega",
        default: "Otro"
      },
      tabs: {
        vision360: "Visión 360",
        basicData: "Datos Básicos"
      },
      actions: {
        edit: "Editar",
        close: "Cerrar"
      },
      sections: {
        basicInfo: "Información Básica",
        contacts: "Personas de Contacto",
        addresses: "Direcciones",
        observations: "Observaciones",
        systemInfo: "Información del Sistema"
      },
      labels: {
        type: "Tipo",
        status: "Estado",
        email: "Email",
        phone: "Teléfono",
        primaryContact: "Principal",
        primaryAddress: "Principal",
        createdAt: "Creado en",
        updatedAt: "Última actualización"
      }
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

    json.businessPartners.view = {
      ...(json.businessPartners.view || {}),
      ...translations[lang].view
    };

    fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
    console.log(`Updated view translations for ${lang}`);
  } else {
    console.error(`File not found: ${filePath}`);
  }
});
