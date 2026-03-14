const fs = require('fs');
const path = require('path');

const locales = ['pt', 'en', 'es'];
const basePath = path.join(__dirname, 'src', 'i18n', 'locales');

const ptTranslations = {
  userCard: {
    status: {
      ativo: "Ativo",
      inativo: "Inativo",
      bloqueado: "Bloqueado"
    },
    role: {
      administrador: "Administrador",
      gerente: "Gerente",
      operador: "Operador",
      visualizador: "Visualizador",
      personalizado: "Personalizado"
    },
    lastLogin: {
      never: "Nunca",
      now: "Agora",
      hoursAgo: "{{hours}}h atrás",
      yesterday: "Ontem",
      label: "Último login:"
    },
    tooltips: {
      view: "Visualizar",
      edit: "Editar",
      delete: "Excluir",
      protectedUser: "Usuário protegido"
    },
    fields: {
      notInformed: "Não informado",
      notLinked: "Não vinculado",
      loginAttempts: "tentativa",
      loginAttemptsPlural: "tentativas",
      loginAttemptsLabel: "de login",
      permissionsConfigured: "permissão(ões) configurada(s)"
    }
  }
};

const enTranslations = {
  userCard: {
    status: {
      ativo: "Active",
      inativo: "Inactive",
      bloqueado: "Blocked"
    },
    role: {
      administrador: "Administrator",
      gerente: "Manager",
      operador: "Operator",
      visualizador: "Viewer",
      personalizado: "Custom"
    },
    lastLogin: {
      never: "Never",
      now: "Just now",
      hoursAgo: "{{hours}}h ago",
      yesterday: "Yesterday",
      label: "Last login:"
    },
    tooltips: {
      view: "View",
      edit: "Edit",
      delete: "Delete",
      protectedUser: "Protected user"
    },
    fields: {
      notInformed: "Not informed",
      notLinked: "Not linked",
      loginAttempts: "login attempt",
      loginAttemptsPlural: "login attempts",
      loginAttemptsLabel: "",
      permissionsConfigured: "configured permission(s)"
    }
  }
};

const esTranslations = {
  userCard: {
    status: {
      ativo: "Activo",
      inativo: "Inactivo",
      bloqueado: "Bloqueado"
    },
    role: {
      administrador: "Administrador",
      gerente: "Gerente",
      operador: "Operador",
      visualizador: "Visualizador",
      personalizado: "Personalizado"
    },
    lastLogin: {
      never: "Nunca",
      now: "Ahora",
      hoursAgo: "hace {{hours}}h",
      yesterday: "Ayer",
      label: "Último acceso:"
    },
    tooltips: {
      view: "Ver",
      edit: "Editar",
      delete: "Eliminar",
      protectedUser: "Usuario protegido"
    },
    fields: {
      notInformed: "No informado",
      notLinked: "No vinculado",
      loginAttempts: "intento",
      loginAttemptsPlural: "intentos",
      loginAttemptsLabel: "de acceso",
      permissionsConfigured: "permiso(s) configurado(s)"
    }
  }
};

locales.forEach(loc => {
  const filePath = path.join(basePath, loc, 'translation.json');
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const json = JSON.parse(fileContent);
    
    // Merge new translations
    if (loc === 'pt') {
      json.userCard = ptTranslations.userCard;
    } else if (loc === 'en') {
      json.userCard = enTranslations.userCard;
    } else if (loc === 'es') {
      json.userCard = esTranslations.userCard;
    }
    
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf-8');
    console.log(`Updated ${loc}/translation.json`);
  }
});
