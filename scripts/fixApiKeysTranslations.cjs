const fs = require('fs');
const path = require('path');

const pts = {
  apiKeys: {
    actions: {
      rotate: "Rotacionar",
      history: "Histórico",
      delete: "Excluir"
    },
    card: {
      nearLimit: "Próximo do Limite",
      keyLabel: "Chave:",
      autoRotationScheduled: "Rotação programada",
      autoRotation: "Automática"
    },
    form: {
      title: "Nova Chave de API",
      subtitle: "Cadastre uma nova chave de API no sistema",
      keyType: "Tipo de Chave *",
      environment: "Ambiente *",
      keyName: "Nome da Chave *",
      keyNamePlaceholder: "Ex: Google Maps API Principal",
      description: "Descrição",
      descriptionPlaceholder: "Descrição opcional...",
      apiKey: "Chave de API *",
      apiKeyPlaceholder: "Cole a chave de API aqui...",
      monthlyLimit: "Limite Mensal",
      monthlyLimitPlaceholder: "Ex: 100000",
      alertThreshold: "Alerta em (%)",
      expiresAt: "Data de Expiração",
      alertEmails: "Emails para Alertas (separados por vírgula)",
      alertEmailsPlaceholder: "email1@example.com, email2@example.com",
      activeImmediately: "Ativar chave imediatamente",
      cancel: "Cancelar",
      create: "Criar Chave",
      creating: "Criando...",
      messages: {
        fillRequired: "Por favor, preencha os campos obrigatórios",
        createSuccess: "Chave de API criada com sucesso!",
        duplicateKey: "Já existe uma chave ativa deste tipo para este ambiente.",
        createError: "Erro ao criar chave de API. Tente novamente."
      }
    }
  }
};

const ens = {
  apiKeys: {
    actions: {
      rotate: "Rotate",
      history: "History",
      delete: "Delete"
    },
    card: {
      nearLimit: "Approaching Limit",
      keyLabel: "Key:",
      autoRotationScheduled: "Scheduled rotation",
      autoRotation: "Automatic"
    },
    form: {
      title: "New API Key",
      subtitle: "Register a new API key",
      keyType: "Key Type *",
      environment: "Environment *",
      keyName: "Key Name *",
      keyNamePlaceholder: "Ex: Main Google Maps API",
      description: "Description",
      descriptionPlaceholder: "Optional description...",
      apiKey: "API Key *",
      apiKeyPlaceholder: "Paste the API key here...",
      monthlyLimit: "Monthly Limit",
      monthlyLimitPlaceholder: "Ex: 100000",
      alertThreshold: "Alert at (%)",
      expiresAt: "Expiration Date",
      alertEmails: "Alert Emails (comma-separated)",
      alertEmailsPlaceholder: "email1@example.com, email2@example.com",
      activeImmediately: "Activate key immediately",
      cancel: "Cancel",
      create: "Create Key",
      creating: "Creating...",
      messages: {
        fillRequired: "Please fill in the required fields",
        createSuccess: "API key created successfully!",
        duplicateKey: "An active key of this type already exists here.",
        createError: "Error creating API key."
      }
    }
  }
};

const ess = {
  apiKeys: {
    actions: {
      rotate: "Rotar",
      history: "Historial",
      delete: "Eliminar"
    },
    card: {
      nearLimit: "Cerca del Límite",
      keyLabel: "Clave:",
      autoRotationScheduled: "Rotación programada",
      autoRotation: "Automática"
    },
    form: {
      title: "Nueva Clave de API",
      subtitle: "Registre una nueva clave de API",
      keyType: "Tipo de Clave *",
      environment: "Entorno *",
      keyName: "Nombre de la Clave *",
      keyNamePlaceholder: "Ej: API principal de Google Maps",
      description: "Descripción",
      descriptionPlaceholder: "Descripción opcional...",
      apiKey: "Clave de API *",
      apiKeyPlaceholder: "Pegue la clave de API aquí...",
      monthlyLimit: "Límite Mensual",
      monthlyLimitPlaceholder: "Ej: 100000",
      alertThreshold: "Alerta en (%)",
      expiresAt: "Fecha de Expiración",
      alertEmails: "Correos para Alertas (separados por coma)",
      alertEmailsPlaceholder: "correo1@ejemplo.com, correo2@ejemplo.com",
      activeImmediately: "Activar clave inmediatamente",
      cancel: "Cancelar",
      create: "Crear Clave",
      creating: "Creando...",
      messages: {
        fillRequired: "Rellene los campos obligatorios",
        createSuccess: "Clave de API creada con éxito!",
        duplicateKey: "Ya existe una clave activa de este tipo.",
        createError: "Error al crear la clave de API."
      }
    }
  }
};

function readJsonFile(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (err) {
    return null;
  }
}

function writeJsonFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

const langs = [
  { lang: 'pt', data: pts },
  { lang: 'en', data: ens },
  { lang: 'es', data: ess }
];

langs.forEach(({ lang, data }) => {
  const p = path.resolve(__dirname, `../src/locales/${lang}/translation.json`);
  const exist = readJsonFile(p);
  if (exist) {
    if (!exist.apiKeys) exist.apiKeys = {};
    if (!exist.apiKeys.actions) exist.apiKeys.actions = {};
    if (!exist.apiKeys.card) exist.apiKeys.card = {};
    if (!exist.apiKeys.form) exist.apiKeys.form = {};
    if (!exist.apiKeys.form.messages) exist.apiKeys.form.messages = {};

    exist.apiKeys.actions = { ...exist.apiKeys.actions, ...data.apiKeys.actions };
    exist.apiKeys.card = { ...exist.apiKeys.card, ...data.apiKeys.card };
    exist.apiKeys.form = { ...exist.apiKeys.form, ...data.apiKeys.form };
    exist.apiKeys.form.messages = { ...exist.apiKeys.form.messages, ...data.apiKeys.form.messages };

    writeJsonFile(p, exist);
    console.log(`Updated ${lang}`);
  }
});
