const fs = require('fs');
const path = require('path');

const locales = ['pt', 'en', 'es'];
const baseDir = path.join(__dirname, '../src');

const ptKeys = {
  address: {
    neighborhood: "Bairro *",
    zipCode: "CEP *",
    neighborhoodPlaceholder: "Digite o bairro",
    autoFilledByZipCode: "Preenchido automaticamente pelo CEP",
    autoSearch: "Busca Automática por CEP",
    autoSearchDesc: "Ao informar o CEP, o sistema buscará automaticamente a cidade e estado correspondentes no cadastro de cidades. Os campos cidade e estado serão preenchidos automaticamente.",
    mapLocation: "Localização no Mapa",
    mapLocationDesc: "Clique no mapa ou arraste o marcador para definir a localização exata do estabelecimento",
    selectedLocation: "Localização selecionada:",
    coordinates: "Coordenadas:"
  },
  logos: {
    tipsTitle: "Dicas para melhor resultado:",
    tip1: "Use imagens PNG com fundo transparente para melhor integração",
    tip2: "Dimensões recomendadas: 200-300px de largura",
    tip3: "A versão escura será exibida quando o usuário ativar o modo escuro",
    tip4: "O logo de E-mail NPS será usado exclusivamente nos e-mails de pesquisa de satisfação",
    tip5: "Se enviar apenas uma versão, ela será usada em ambos os modos"
  },
  email: {
    accountConfig: "Configuração da Conta",
    emailAddress: "Endereço de E-mail *",
    username: "Usuário *",
    password: "Senha *",
    authType: "Tipo de Autenticação *",
    clientId: "Client ID *",
    clientSecret: "Client Secret *",
    refreshToken: "Refresh Token *",
    aboutOauth2: "Sobre OAuth 2.0",
    aboutOauth2Desc: "Para usar OAuth 2.0, você precisa configurar uma aplicação no console do provedor de email (Google, Microsoft, etc.) e obter o Client ID, Client Secret e Refresh Token. Consulte a documentação do seu provedor para mais informações.",
    receiveProtocol: "Protocolo de Recebimento *",
    incomingServer: "Servidor de Entrada (Host) *",
    port: "Porta *",
    secureConnection: "Usar conexão segura (SSL/TLS)",
    importConfig: "Configuração de Importação",
    autoImport: "Importar e-mails automaticamente",
    checkInterval: "Intervalo de Verificação *",
    intervalOptions: {
      "5": "A cada 5 minutos",
      "10": "A cada 10 minutos",
      "15": "A cada 15 minutos",
      "30": "A cada 30 minutos",
      "60": "A cada 1 hora"
    },
    processFolder: "Pasta de Processamento",
    processFolderPlaceholder: "Ex: INBOX/Processados",
    howItWorks: "Como funciona",
    howItWorks1: "O sistema verificará automaticamente a caixa de entrada no intervalo configurado",
    howItWorks2: "XMLs de NF-e e CT-e serão identificados e importados automaticamente",
    howItWorks3: "Após a importação, os arquivos serão movidos para uma pasta processada",
    howItWorks4: "Duplicatas são detectadas e não serão importadas novamente",
    testingConnection: "Testando conexão...",
    testConnection: "Testar Conexão",
    important: "Importante",
    importantDesc: "A configuração de e-mail de entrada é usada pelo módulo TMS Mail Center para capturar arquivos XML (CT-e, NF-e) enviados por transportadoras e parceiros."
  }
};

const enKeys = {
  address: {
    neighborhood: "Neighborhood *",
    zipCode: "Zip Code *",
    neighborhoodPlaceholder: "Enter neighborhood",
    autoFilledByZipCode: "Auto-filled by Zip Code",
    autoSearch: "Automatic Zip Code Search",
    autoSearchDesc: "By typing the Zip Code, the system will automatically search for the corresponding city and state in the cities registry. City and state fields will be automatically filled.",
    mapLocation: "Map Location",
    mapLocationDesc: "Click the map or drag the marker to set the exact establishment location",
    selectedLocation: "Selected location:",
    coordinates: "Coordinates:"
  },
  logos: {
    tipsTitle: "Tips for better results:",
    tip1: "Use PNG images with transparent backgrounds for better integration",
    tip2: "Recommended dimensions: 200-300px width",
    tip3: "The dark version will be displayed when the user enables dark mode",
    tip4: "The NPS Email logo will be exclusively used in satisfaction survey emails",
    tip5: "If only one version is uploaded, it will be used in both modes"
  },
  email: {
    accountConfig: "Account Configuration",
    emailAddress: "Email Address *",
    username: "Username *",
    password: "Password *",
    authType: "Authentication Type *",
    clientId: "Client ID *",
    clientSecret: "Client Secret *",
    refreshToken: "Refresh Token *",
    aboutOauth2: "About OAuth 2.0",
    aboutOauth2Desc: "To use OAuth 2.0, you need to configure an application in the email provider's console (Google, Microsoft, etc.) and obtain the Client ID, Client Secret, and Refresh Token. Consult your provider's documentation for more information.",
    receiveProtocol: "Receiving Protocol *",
    incomingServer: "Incoming Server (Host) *",
    port: "Port *",
    secureConnection: "Use secure connection (SSL/TLS)",
    importConfig: "Import Configuration",
    autoImport: "Import emails automatically",
    checkInterval: "Check Interval *",
    intervalOptions: {
      "5": "Every 5 minutes",
      "10": "Every 10 minutes",
      "15": "Every 15 minutes",
      "30": "Every 30 minutes",
      "60": "Every 1 hour"
    },
    processFolder: "Processing Folder",
    processFolderPlaceholder: "Ex: INBOX/Processed",
    howItWorks: "How it works",
    howItWorks1: "The system will automatically check the inbox at the configured interval",
    howItWorks2: "NF-e and CT-e XMLs will be automatically identified and imported",
    howItWorks3: "After importing, files will be moved to a processed folder",
    howItWorks4: "Duplicates are detected and will not be imported again",
    testingConnection: "Testing connection...",
    testConnection: "Test Connection",
    important: "Important",
    importantDesc: "The incoming email configuration is used by the TMS Mail Center module to capture XML files (CT-e, NF-e) sent by carriers and partners."
  }
};

const esKeys = {
  address: {
    neighborhood: "Barrio *",
    zipCode: "Código Postal *",
    neighborhoodPlaceholder: "Ingrese el barrio",
    autoFilledByZipCode: "Completado automáticamente por el Código Postal",
    autoSearch: "Búsqueda Automática de Código Postal",
    autoSearchDesc: "Al ingresar el Código Postal, el sistema buscará automáticamente la ciudad y el estado correspondientes en el registro de ciudades. Los campos ciudad y estado se completarán automáticamente.",
    mapLocation: "Ubicación en el Mapa",
    mapLocationDesc: "Haga clic en el mapa o arrastre el marcador para definir la ubicación exacta del establecimiento",
    selectedLocation: "Ubicación seleccionada:",
    coordinates: "Coordenadas:"
  },
  logos: {
    tipsTitle: "Consejos para mejores resultados:",
    tip1: "Use imágenes PNG con fondo transparente para una mejor integración",
    tip2: "Dimensiones recomendadas: 200-300px de ancho",
    tip3: "La versión oscura se mostrará cuando el usuario active el modo oscuro",
    tip4: "El logo de Correo NPS se utilizará exclusivamente en los correos de encuestas de satisfacción",
    tip5: "Si solo se envía una versión, se utilizará en ambos modos"
  },
  email: {
    accountConfig: "Configuración de la Cuenta",
    emailAddress: "Dirección de Correo *",
    username: "Usuario *",
    password: "Contraseña *",
    authType: "Tipo de Autenticación *",
    clientId: "Client ID *",
    clientSecret: "Client Secret *",
    refreshToken: "Refresh Token *",
    aboutOauth2: "Sobre OAuth 2.0",
    aboutOauth2Desc: "Para usar OAuth 2.0, debe configurar una aplicación en la consola del proveedor de correo (Google, Microsoft, etc.) y obtener el Client ID, Client Secret y Refresh Token. Consulte la documentación de su proveedor para más información.",
    receiveProtocol: "Protocolo de Recepción *",
    incomingServer: "Servidor de Entrada (Host) *",
    port: "Puerto *",
    secureConnection: "Usar conexión segura (SSL/TLS)",
    importConfig: "Configuración de Importación",
    autoImport: "Importar correos automáticamente",
    checkInterval: "Intervalo de Verificación *",
    intervalOptions: {
      "5": "Cada 5 minutos",
      "10": "Cada 10 minutos",
      "15": "Cada 15 minutos",
      "30": "Cada 30 minutos",
      "60": "Cada 1 hora"
    },
    processFolder: "Carpeta de Procesamiento",
    processFolderPlaceholder: "Ej: INBOX/Procesados",
    howItWorks: "Cómo funciona",
    howItWorks1: "El sistema verificará automáticamente la bandeja de entrada en el intervalo configurado",
    howItWorks2: "Los XMLs de NF-e y CT-e serán identificados e importados automáticamente",
    howItWorks3: "Después de la importación, los archivos se moverán a una carpeta procesada",
    howItWorks4: "Las copias duplicadas son detectadas y no serán importadas de nuevo",
    testingConnection: "Probando conexión...",
    testConnection: "Probar Conexión",
    important: "Importante",
    importantDesc: "La configuración de correo de entrada es utilizada por el módulo TMS Mail Center para capturar archivos XML (CT-e, NF-e) enviados por transportistas y socios."
  }
};

const addKeysToJson = (locale, keyData) => {
  const jsonPath = path.join(baseDir, 'locales', locale, 'translation.json');
  let data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  
  if (!data.establishments.form.address) data.establishments.form.address = {};
  if (!data.establishments.form.logos) data.establishments.form.logos = {};
  
  Object.assign(data.establishments.form.address, keyData.address);
  // merge logos into existing logos object if needed
  Object.assign(data.establishments.form.logos, keyData.logos);
  // add email missing translations
  Object.assign(data.establishments.form.email, keyData.email);

  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
  console.log(`Updated ${locale}/translation.json`);
};

addKeysToJson('pt', ptKeys);
addKeysToJson('en', enKeys);
addKeysToJson('es', esKeys);

// Replace in EstablishmentForm.tsx
const formPath = path.join(baseDir, 'components', 'establishments', 'EstablishmentForm.tsx');
let formContent = fs.readFileSync(formPath, 'utf8');

const replacements = [
  ["Bairro *", "{t('establishments.form.address.neighborhood')}"],
  ["CEP *", "{t('establishments.form.address.zipCode')}"],
  ["\"Digite o bairro\"", "{t('establishments.form.address.neighborhoodPlaceholder')}"],
  ["\"Preenchido automaticamente pelo CEP\"", "{t('establishments.form.address.autoFilledByZipCode')}"],
  ["Busca Automática por CEP", "{t('establishments.form.address.autoSearch')}"],
  ["Ao informar o CEP, o sistema buscará automaticamente a cidade e estado correspondentes \n                    no cadastro de cidades. Os campos cidade e estado \n                    serão preenchidos automaticamente.", "{t('establishments.form.address.autoSearchDesc')}"],
  ["Localização no Mapa", "{t('establishments.form.address.mapLocation')}"],
  ["Clique no mapa ou arraste o marcador para definir a localização exata do estabelecimento", "{t('establishments.form.address.mapLocationDesc')}"],
  ["Localização selecionada:", "{t('establishments.form.address.selectedLocation')}"],
  ["Coordenadas:", "{t('establishments.form.address.coordinates')}"],
  
  ["Dicas para melhor resultado:", "{t('establishments.form.logos.tipsTitle')}"],
  ["Use imagens PNG com fundo transparente para melhor integração", "{t('establishments.form.logos.tip1')}"],
  ["Dimensões recomendadas: 200-300px de largura", "{t('establishments.form.logos.tip2')}"],
  ["A versão escura será exibida quando o usuário ativar o modo escuro", "{t('establishments.form.logos.tip3')}"],
  ["O logo de E-mail NPS será usado exclusivamente nos e-mails de pesquisa de satisfação", "{t('establishments.form.logos.tip4')}"],
  ["Se enviar apenas uma versão, ela será usada em ambos os modos", "{t('establishments.form.logos.tip5')}"],

  ["Configuração da Conta", "{t('establishments.form.email.accountConfig')}"],
  ["Endereço de E-mail *", "{t('establishments.form.email.emailAddress')}"],
  ["Usuário *", "{t('establishments.form.email.username')}"],
  ["Senha *", "{t('establishments.form.email.password')}"],
  ["Tipo de Autenticação *", "{t('establishments.form.email.authType')}"],
  ["Client ID *", "{t('establishments.form.email.clientId')}"],
  ["Client Secret *", "{t('establishments.form.email.clientSecret')}"],
  ["Refresh Token *", "{t('establishments.form.email.refreshToken')}"],
  ["Sobre OAuth 2.0", "{t('establishments.form.email.aboutOauth2')}"],
  ["Para usar OAuth 2.0, você precisa configurar uma aplicação no console do provedor de email (Google, Microsoft, etc.) e obter o Client ID, Client Secret e Refresh Token. Consulte a documentação do seu provedor para mais informações.", "{t('establishments.form.email.aboutOauth2Desc')}"],
  ["Protocolo de Recebimento *", "{t('establishments.form.email.receiveProtocol')}"],
  ["Servidor de Entrada (Host) *", "{t('establishments.form.email.incomingServer')}"],
  ["Porta *", "{t('establishments.form.email.port')}"],
  ["Usar conexão segura (SSL/TLS)", "{t('establishments.form.email.secureConnection')}"],
  ["Configuração de Importação", "{t('establishments.form.email.importConfig')}"],
  ["Importar e-mails automaticamente", "{t('establishments.form.email.autoImport')}"],
  ["Intervalo de Verificação *", "{t('establishments.form.email.checkInterval')}"],
  [">LOGIN<", ">{t('establishments.form.email.authType')}: LOGIN<"],
  [">OAuth 2.0<", ">{t('establishments.form.email.authType')}: OAuth 2.0<"],
  ["A cada 5 minutos", "{t('establishments.form.email.intervalOptions.5')}"],
  ["A cada 10 minutos", "{t('establishments.form.email.intervalOptions.10')}"],
  ["A cada 15 minutos", "{t('establishments.form.email.intervalOptions.15')}"],
  ["A cada 30 minutos", "{t('establishments.form.email.intervalOptions.30')}"],
  ["A cada 1 hora", "{t('establishments.form.email.intervalOptions.60')}"],
  ["Pasta de Processamento", "{t('establishments.form.email.processFolder')}"],
  ["\"Ex: INBOX/Processados\"", "{t('establishments.form.email.processFolderPlaceholder')}"],
  ["Como funciona", "{t('establishments.form.email.howItWorks')}"],
  ["O sistema verificará automaticamente a caixa de entrada no intervalo configurado", "{t('establishments.form.email.howItWorks1')}"],
  ["XMLs de NF-e e CT-e serão identificados e importados automaticamente", "{t('establishments.form.email.howItWorks2')}"],
  ["Após a importação, os arquivos serão movidos para uma pasta processada", "{t('establishments.form.email.howItWorks3')}"],
  ["Duplicatas são detectadas e não serão importadas novamente", "{t('establishments.form.email.howItWorks4')}"],
  ["Testando conexão...", "{t('establishments.form.email.testingConnection')}"],
  ["Testar Conexão", "{t('establishments.form.email.testConnection')}"],
  ["Importante", "{t('establishments.form.email.important')}"],
  ["A configuração de e-mail de entrada é usada pelo módulo TMS Mail Center para capturar arquivos XML (CT-e, NF-e) enviados por transportadoras e parceiros.", "{t('establishments.form.email.importantDesc')}"]
];

for (const [search, replace] of replacements) {
    if (search.includes('\n')) {
        // use basic replace for multi-line search if required
        formContent = formContent.replace(search, replace);
    } else {
        formContent = formContent.split(search).join(replace);
    }
}

fs.writeFileSync(formPath, formContent, 'utf8');
console.log('✅ EstablishmentForm.tsx updated successfully!');
