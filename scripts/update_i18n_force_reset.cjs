const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'locales');

const newKeys = {
  pt: {
    "title": "Segurança em Primeiro Lugar",
    "description": "Sua conta foi sinalizada para uma redefinição obrigatória de credenciais pelos administradores de segurança do Log Axis.",
    "secureEnv": "Ambiente Protegido Log Axis",
    "logout": "Sair (Logout)",
    "hello": "Olá, {{name}}",
    "subtitle": "Por medida de segurança, o Administrador determinou que você deve atualizar sua senha de acesso agora mesmo.",
    "button": "Atualizar Senha & Acessar",
    "errors": {
      "userNotFound": "Usuário não encontrado no banco de dados.",
      "samePassword": "A nova senha não pode ser igual à senha atual que você está usando.",
      "generic": "Falha grave ao redefinir a senha."
    }
  },
  en: {
    "title": "Safety First",
    "description": "Your account has been flagged for a mandatory credential reset by Log Axis security administrators.",
    "secureEnv": "Log Axis Secure Environment",
    "logout": "Log Out",
    "hello": "Hello, {{name}}",
    "subtitle": "As a security measure, the Administrator has determined that you must update your access password right now.",
    "button": "Update Password & Access",
    "errors": {
      "userNotFound": "User not found in the database.",
      "samePassword": "The new password cannot be the same as your current password.",
      "generic": "Critical failure resetting password."
    }
  },
  es: {
    "title": "La Seguridad ante Todo",
    "description": "Tu cuenta ha sido marcada para un restablecimiento obligatorio de credenciales por los administradores de seguridad de Log Axis.",
    "secureEnv": "Entorno Seguro Log Axis",
    "logout": "Cerrar sesión",
    "hello": "Hola, {{name}}",
    "subtitle": "Por motivos de seguridad, el Administrador ha determinado que debes actualizar tu contraseña de acceso ahora mismo.",
    "button": "Actualizar Contraseña y Acceder",
    "errors": {
      "userNotFound": "Usuario no encontrado en la base de datos.",
      "samePassword": "La nueva contraseña no puede ser igual a tu contraseña actual.",
      "generic": "Falla crítica al restablecer la contraseña."
    }
  }
};

['pt', 'en', 'es'].forEach(lang => {
  const filePath = path.join(localesDir, lang, 'translation.json');
  if (fs.existsSync(filePath)) {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    // Inject the new object
    content.forcePasswordReset = newKeys[lang];
    
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
    console.log(`Updated ${lang}/translation.json`);
  }
});
