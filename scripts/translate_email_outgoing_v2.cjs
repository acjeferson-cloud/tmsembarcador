const fs = require('fs');
const path = require('path');

const locales = ['pt', 'en', 'es'];
const baseDir = path.join(__dirname, '../src');

const ptKeys = {
  emailOutgoing: {
    smtpServer: "Servidor SMTP",
    portLabel: "Porta",
    securityType: "Tipo de Segurança",
    securityOptions: {
      tls: "TLS (Recomendado)",
      ssl: "SSL",
      none: "Nenhuma"
    },
    securityHint: "TLS porta 587 | SSL porta 465 | Nenhuma porta 25",
    smtpUser: "Usuário SMTP",
    smtpUserPlaceholder: "seu-email@dominio.com",
    smtpPassword: "Senha SMTP",
    gmailWarning: "Gmail requer \"Senha de App\"",
    gmailWarningDesc1: "O Gmail não aceita sua senha normal. Você precisa gerar uma \"Senha de App\":",
    gmailWarningStep1Text: "Acesse sua",
    gmailWarningStep1Link: "Conta do Google",
    gmailWarningStep2: "Ative a \"Verificação em duas etapas\" se ainda não ativou",
    gmailWarningStep3Text: "Vá em",
    gmailWarningStep3Link: "Senhas de App",
    gmailWarningStep4: "Gere uma nova senha para \"E-mail\" ou \"Outro (nome personalizado)\"",
    gmailWarningStep5: "Use a senha gerada (16 caracteres) no campo acima",
    authType: "Tipo de Autenticação",
    authTypeLogin: "LOGIN (Usuário/Senha)",
    authTypeOauth2: "OAuth 2.0",
    clientId: "Client ID",
    clientIdPlaceholder: "Digite o Client ID fornecido pelo provedor",
    clientSecret: "Client Secret",
    clientSecretPlaceholder: "Digite o Client Secret",
    refreshToken: "Refresh Token",
    refreshTokenPlaceholder: "Digite o Refresh Token",
    aboutOauth2: "Sobre OAuth 2.0",
    aboutOauth2Desc: "Para usar OAuth 2.0, você precisa configurar uma aplicação no console do provedor de e-mail (Google, Microsoft, etc.) e obter o Client ID, Client Secret e Refresh Token. Consulte a documentação do seu provedor para mais informações.",
    senderEmail: "E-mail Remetente",
    senderEmailPlaceholder: "noreply@empresa.com",
    senderName: "Nome do Remetente",
    senderNamePlaceholder: "TMS - Sistema de Gestão",
    replyToEmail: "E-mail para Respostas (Opcional)",
    replyToEmailPlaceholder: "contato@empresa.com",
    activeConfig: "Configuração ativa (usada para envio de e-mails)",
    testEmailDialog: {
      title: "Testar Envio de E-mail",
      desc: "Digite um e-mail para receber uma mensagem de teste e validar a configuração SMTP.",
      testEmail: "E-mail de Teste",
      testEmailPlaceholder: "seu-email@exemplo.com",
      cancel: "Cancelar",
      sendTest: "Enviar Teste",
      sending: "Enviando..."
    }
  }
};

const enKeys = {
  emailOutgoing: {
    smtpServer: "SMTP Server",
    portLabel: "Port",
    securityType: "Security Type",
    securityOptions: {
      tls: "TLS (Recommended)",
      ssl: "SSL",
      none: "None"
    },
    securityHint: "TLS port 587 | SSL port 465 | None port 25",
    smtpUser: "SMTP User",
    smtpUserPlaceholder: "your-email@domain.com",
    smtpPassword: "SMTP Password",
    gmailWarning: "Gmail requires an \"App Password\"",
    gmailWarningDesc1: "Gmail does not accept your normal password. You need to generate an \"App Password\":",
    gmailWarningStep1Text: "Access your",
    gmailWarningStep1Link: "Google Account",
    gmailWarningStep2: "Enable \"2-Step Verification\" if not already enabled",
    gmailWarningStep3Text: "Go to",
    gmailWarningStep3Link: "App Passwords",
    gmailWarningStep4: "Generate a new password for \"Mail\" or \"Other (custom name)\"",
    gmailWarningStep5: "Use the generated password (16 characters) in the field above",
    authType: "Authentication Type",
    authTypeLogin: "LOGIN (User/Password)",
    authTypeOauth2: "OAuth 2.0",
    clientId: "Client ID",
    clientIdPlaceholder: "Enter the Client ID provided by the provider",
    clientSecret: "Client Secret",
    clientSecretPlaceholder: "Enter the Client Secret",
    refreshToken: "Refresh Token",
    refreshTokenPlaceholder: "Enter the Refresh Token",
    aboutOauth2: "About OAuth 2.0",
    aboutOauth2Desc: "To use OAuth 2.0, you need to configure an application in the email provider's console (Google, Microsoft, etc.) and obtain the Client ID, Client Secret, and Refresh Token. Consult your provider's documentation for more information.",
    senderEmail: "Sender Email",
    senderEmailPlaceholder: "noreply@company.com",
    senderName: "Sender Name",
    senderNamePlaceholder: "TMS - Management System",
    replyToEmail: "Reply-To Email (Optional)",
    replyToEmailPlaceholder: "contact@company.com",
    activeConfig: "Active config (used for sending emails)",
    testEmailDialog: {
      title: "Test Email Sending",
      desc: "Enter an email to receive a test message and validate the SMTP configuration.",
      testEmail: "Test Email",
      testEmailPlaceholder: "your-email@example.com",
      cancel: "Cancel",
      sendTest: "Send Test",
      sending: "Sending..."
    }
  }
};

const esKeys = {
  emailOutgoing: {
    smtpServer: "Servidor SMTP",
    portLabel: "Puerto",
    securityType: "Tipo de Seguridad",
    securityOptions: {
      tls: "TLS (Recomendado)",
      ssl: "SSL",
      none: "Ninguna"
    },
    securityHint: "TLS puerto 587 | SSL puerto 465 | Ninguna puerto 25",
    smtpUser: "Usuario SMTP",
    smtpUserPlaceholder: "tu-correo@dominio.com",
    smtpPassword: "Contraseña SMTP",
    gmailWarning: "Gmail requiere \"Contraseña de Aplicación\"",
    gmailWarningDesc1: "Gmail no acepta su contraseña normal. Necesita generar una \"Contraseña de Aplicación\":",
    gmailWarningStep1Text: "Acceda a su",
    gmailWarningStep1Link: "Cuenta de Google",
    gmailWarningStep2: "Active la \"Verificación en dos pasos\" si aún no está activada",
    gmailWarningStep3Text: "Vaya a",
    gmailWarningStep3Link: "Contraseñas de Aplicación",
    gmailWarningStep4: "Genere una nueva contraseña para \"Correo\" o \"Otro (nombre personalizado)\"",
    gmailWarningStep5: "Use la contraseña generada (16 caracteres) en el campo de arriba",
    authType: "Tipo de Autenticación",
    authTypeLogin: "LOGIN (Usuario/Contraseña)",
    authTypeOauth2: "OAuth 2.0",
    clientId: "Client ID",
    clientIdPlaceholder: "Ingrese el Client ID proporcionado por el proveedor",
    clientSecret: "Client Secret",
    clientSecretPlaceholder: "Ingrese el Client Secret",
    refreshToken: "Refresh Token",
    refreshTokenPlaceholder: "Ingrese el Refresh Token",
    aboutOauth2: "Sobre OAuth 2.0",
    aboutOauth2Desc: "Para usar OAuth 2.0, necesita configurar una aplicación en la consola del proveedor de correo (Google, Microsoft, etc.) y obtener el Client ID, Client Secret y Refresh Token. Consulte la documentación de su proveedor para más información.",
    senderEmail: "Correo Remitente",
    senderEmailPlaceholder: "noreply@empresa.com",
    senderName: "Nombre del Remetente",
    senderNamePlaceholder: "TMS - Sistema de Gestión",
    replyToEmail: "Correo para Respuestas (Opcional)",
    replyToEmailPlaceholder: "contacto@empresa.com",
    activeConfig: "Configuración activa (usada para envío de correos)",
    testEmailDialog: {
      title: "Probar Envío de Correo",
      desc: "Ingrese un correo electrónico para recibir un mensaje de prueba y validar la configuración SMTP.",
      testEmail: "Correo de Prueba",
      testEmailPlaceholder: "tu-correo@ejemplo.com",
      cancel: "Cancelar",
      sendTest: "Enviar Prueba",
      sending: "Enviando..."
    }
  }
};

const addKeysToJson = (locale, keyData) => {
  const jsonPath = path.join(baseDir, 'locales', locale, 'translation.json');
  let data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  
  if (!data.establishments.form.emailOutgoing) data.establishments.form.emailOutgoing = {};
  
  // Merge keys over existing emailOutgoing translations
  Object.assign(data.establishments.form.emailOutgoing, keyData.emailOutgoing);

  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
  console.log(`Updated ${locale}/translation.json`);
};

addKeysToJson('pt', ptKeys);
addKeysToJson('en', enKeys);
addKeysToJson('es', esKeys);

const formPath = path.join(baseDir, 'components', 'establishments', 'EmailOutgoingConfig.tsx');
let formContent = fs.readFileSync(formPath, 'utf8');

const replacements = [
  ["{t('establishments.form.emailOutgoing.smtpServer')} *", "{t('establishments.form.emailOutgoing.smtpServer')} *"],
  ["Porta *", "{t('establishments.form.emailOutgoing.portLabel')} *"],
  ["Tipo de {t('establishments.form.emailOutgoing.security')} *", "{t('establishments.form.emailOutgoing.securityType')} *"],
  [">TLS (Recomendado)<", ">{t('establishments.form.emailOutgoing.securityOptions.tls')}<"],
  [">SSL<", ">{t('establishments.form.emailOutgoing.securityOptions.ssl')}<"],
  [">Nenhuma<", ">{t('establishments.form.emailOutgoing.securityOptions.none')}<"],
  ["TLS porta 587 | SSL porta 465 | Nenhuma porta 25", "{t('establishments.form.emailOutgoing.securityHint')}"],
  [">Usuário SMTP *<", ">{t('establishments.form.emailOutgoing.smtpUser')} *<"],
  ["placeholder=\"seu-email@dominio.com\"", "placeholder={t('establishments.form.emailOutgoing.smtpUserPlaceholder')}"],
  ["Senha SMTP *", "{t('establishments.form.emailOutgoing.smtpPassword')} *"],
  ["Gmail requer \"Senha de App\"", "{t('establishments.form.emailOutgoing.gmailWarning')}"],
  ["O Gmail não aceita sua senha normal. Você precisa gerar uma \"Senha de App\":", "{t('establishments.form.emailOutgoing.gmailWarningDesc1')}"],
  ["Acesse sua <a", "{t('establishments.form.emailOutgoing.gmailWarningStep1Text')} <a"],
  [">Conta do Google</a>", ">{t('establishments.form.emailOutgoing.gmailWarningStep1Link')}</a>"],
  ["Ative a \"Verificação em duas etapas\" se ainda não ativou", "{t('establishments.form.emailOutgoing.gmailWarningStep2')}"],
  ["Vá em <a", "{t('establishments.form.emailOutgoing.gmailWarningStep3Text')} <a"],
  [">Senhas de App</a>", ">{t('establishments.form.emailOutgoing.gmailWarningStep3Link')}</a>"],
  ["Gere uma nova senha para \"E-mail\" ou \"Outro (nome personalizado)\"", "{t('establishments.form.emailOutgoing.gmailWarningStep4')}"],
  ["Use a senha gerada (16 caracteres) no campo acima", "{t('establishments.form.emailOutgoing.gmailWarningStep5')}"],
  [">LOGIN (Usuário/Senha)<", ">{t('establishments.form.emailOutgoing.authTypeLogin')}<"],
  [">OAuth 2.0<", ">{t('establishments.form.emailOutgoing.authTypeOauth2')}<"],
  ["Client ID *", "{t('establishments.form.emailOutgoing.clientId')} *"],
  ["placeholder=\"Digite o Client ID fornecido pelo provedor\"", "placeholder={t('establishments.form.emailOutgoing.clientIdPlaceholder')}"],
  ["Client Secret *", "{t('establishments.form.emailOutgoing.clientSecret')} *"],
  ["placeholder=\"Digite o Client Secret\"", "placeholder={t('establishments.form.emailOutgoing.clientSecretPlaceholder')}"],
  ["Refresh Token *", "{t('establishments.form.emailOutgoing.refreshToken')} *"],
  ["placeholder=\"Digite o Refresh Token\"", "placeholder={t('establishments.form.emailOutgoing.refreshTokenPlaceholder')}"],
  ["Sobre OAuth 2.0", "{t('establishments.form.emailOutgoing.aboutOauth2')}"],
  ["Para usar OAuth 2.0, você precisa configurar uma aplicação no console do provedor de e-mail\n                        (Google, Microsoft, etc.) e obter o Client ID, Client Secret e Refresh Token.\n                        Consulte a documentação do seu provedor para mais informações.", "{t('establishments.form.emailOutgoing.aboutOauth2Desc')}"],
  [">E-mail Remetente *", ">{t('establishments.form.emailOutgoing.senderEmail')} *"],
  ["placeholder=\"noreply@empresa.com\"", "placeholder={t('establishments.form.emailOutgoing.senderEmailPlaceholder')}"],
  [">Nome do Remetente *", ">{t('establishments.form.emailOutgoing.senderName')} *"],
  ["placeholder=\"TMS - Sistema de Gestão\"", "placeholder={t('establishments.form.emailOutgoing.senderNamePlaceholder')}"],
  ["E-mail para Respostas (Opcional)", "{t('establishments.form.emailOutgoing.replyToEmail')}"],
  ["placeholder=\"contato@empresa.com\"", "placeholder={t('establishments.form.emailOutgoing.replyToEmailPlaceholder')}"],
  ["Configuração ativa (usada para envio de e-mails)", "{t('establishments.form.emailOutgoing.activeConfig')}"],
  ["<h3 classNa=\"text-lg font-semibold text-gray-900 dark:text-white\">Testar Envio de E-mail</h3>", "<h3 className=\"text-lg font-semibold text-gray-900 dark:text-white\">{t('establishments.form.emailOutgoing.testEmailDialog.title')}</h3>"],
  ["Digite um e-mail para receber uma mensagem de teste e validar a configuração SMTP.", "{t('establishments.form.emailOutgoing.testEmailDialog.desc')}"],
  ["E-mail de Teste", "{t('establishments.form.emailOutgoing.testEmailDialog.testEmail')}"],
  ["placeholder=\"seu-email@exemplo.com\"", "placeholder={t('establishments.form.emailOutgoing.testEmailDialog.testEmailPlaceholder')}"],
  ["<h3 className=\"text-lg font-semibold text-gray-900 dark:text-white\">Testar Envio de E-mail</h3>", "<h3 className=\"text-lg font-semibold text-gray-900 dark:text-white\">{t('establishments.form.emailOutgoing.testEmailDialog.title')}</h3>"],
];

for (const [search, replace] of replacements) {
    if (search.includes('\n')) {
        formContent = formContent.replace(search, replace);
    } else {
        formContent = formContent.split(search).join(replace);
    }
}

fs.writeFileSync(formPath, formContent, 'utf8');
console.log('✅ EmailOutgoingConfig.tsx updated successfully!');
