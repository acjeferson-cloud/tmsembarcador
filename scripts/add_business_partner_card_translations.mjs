import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.resolve(__dirname, '../src/locales');
const languages = ['pt', 'en', 'es'];

const translations = {
  pt: {
    card: {
      actions: {
        view: "Visualizar",
        edit: "Editar",
        delete: "Excluir"
      },
      labels: {
        primaryContact: "Contato Principal",
        contactsCount: "{{count}} contato(s)",
        addressesCount: "{{count}} endereço(s)"
      },
      errors: {
        idNotFound: "Erro: ID do parceiro não encontrado"
      }
    }
  },
  en: {
    card: {
      actions: {
        view: "View",
        edit: "Edit",
        delete: "Delete"
      },
      labels: {
        primaryContact: "Primary Contact",
        contactsCount: "{{count}} contact(s)",
        addressesCount: "{{count}} address(es)"
      },
      errors: {
        idNotFound: "Error: Partner ID not found"
      }
    }
  },
  es: {
    card: {
      actions: {
        view: "Ver",
        edit: "Editar",
        delete: "Eliminar"
      },
      labels: {
        primaryContact: "Contacto Principal",
        contactsCount: "{{count}} contacto(s)",
        addressesCount: "{{count}} direccion(es)"
      },
      errors: {
        idNotFound: "Error: ID de socio no encontrado"
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

    json.businessPartners.card = {
      ...(json.businessPartners.card || {}),
      ...translations[lang].card
    };

    fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
    console.log(`Updated card translations for ${lang}`);
  } else {
    console.error(`File not found: ${filePath}`);
  }
});
