const fs = require('fs');
const path = require('path');

const locales = ['pt', 'en', 'es'];
const basePath = path.join(__dirname, 'src', 'i18n', 'locales');

const ptTranslations = {
  userView: {
    back: "Voltar para Usuários",
    title: "Visualizar Usuário",
    subtitle: "Detalhes completos do usuário",
    protectedUser: "Usuário Protegido",
    edit: "Editar",
    tabs: {
      details: "Detalhes do Usuário",
      permissions: "Permissões",
      establishments: "Estabelecimentos"
    },
    sections: {
      contact: "Informações de Contato",
      professional: "Informações Profissionais",
      personal: "Informações Pessoais",
      security: "Informações de Segurança",
      audit: "Informações de Auditoria",
      observations: "Observações",
      customPermissions: "Permissões Personalizadas",
      permittedEstablishments: "Estabelecimentos Permitidos"
    },
    fields: {
      email: "Email",
      cpf: "CPF",
      status: "Status",
      profile: "Perfil",
      companyTime: "Tempo de Empresa",
      phone: "Telefone",
      cellphone: "Celular",
      role: "Cargo",
      department: "Departamento",
      admissionDate: "Data de Admissão",
      accessProfile: "Perfil de Acesso",
      mainEstablishment: "Estabelecimento Principal",
      lastLogin: "Último Login",
      birthDate: "Data de Nascimento",
      address: "Endereço",
      loginAttempts: "Tentativas de Login",
      accountStatus: "Status da Conta",
      accessLevel: "Nível de Acesso",
      createdBy: "Criado por",
      createdAt: "Data de Criação",
      updatedBy: "Última alteração por",
      updatedAt: "Data da última alteração"
    },
    values: {
      notLinked: "Não vinculado",
      never: "Nunca",
      yearsOld: "anos"
    },
    securityAlerts: {
      title: "Alerta de Segurança",
      blockedTitle: "Conta Bloqueada",
      attempts: "Este usuário possui {{attempts}} tentativa(s) de login falhada(s).",
      autoBlocked: " A conta foi bloqueada automaticamente.",
      willBlock: " Após 5 tentativas a conta será bloqueada.",
      blockedDesc: "Esta conta foi bloqueada devido ao excesso de tentativas de login. Entre em contato com o administrador para desbloqueio."
    },
    audit: {
      userNumber: "Usuário #{{id}}"
    },
    permissions: {
      customProfileTitle: "Perfil Personalizado",
      customProfileDesc: "Este usuário possui um perfil personalizado com acesso apenas às funcionalidades listadas abaixo. Todas as outras funcionalidades do sistema não estarão disponíveis para este usuário.",
      menu: "Menu",
      permission: "Permissão",
      permitted: "Permitido",
      partial: "Parcial",
      notPermitted: "Não permitido",
      summary: "Resumo de Permissões",
      totalPermissions: "Total de Permissões",
      mainMenus: "Menus Principais",
      submenus: "Submenus"
    },
    establishments: {
      restrictedAccessTitle: "Acesso Restrito a Estabelecimentos",
      restrictedAccessDesc: "Este usuário tem acesso apenas aos estabelecimentos listados abaixo. Após o login, o usuário deverá selecionar um destes estabelecimentos para iniciar o trabalho.",
      listTitle: "Estabelecimentos Permitidos",
      mainTitle: "Estabelecimento Principal",
      mainDescHas: "O estabelecimento principal deste usuário é",
      mainDescHasNot: "Este usuário não possui um estabelecimento principal definido.",
      summaryPermitted: "estabelecimento(s) permitido(s)",
      summaryTotal: "total no sistema"
    }
  }
};

const enTranslations = {
  userView: {
    back: "Back to Users",
    title: "View User",
    subtitle: "Complete user details",
    protectedUser: "Protected User",
    edit: "Edit",
    tabs: {
      details: "User Details",
      permissions: "Permissions",
      establishments: "Establishments"
    },
    sections: {
      contact: "Contact Information",
      professional: "Professional Information",
      personal: "Personal Information",
      security: "Security Information",
      audit: "Audit Information",
      observations: "Observations",
      customPermissions: "Custom Permissions",
      permittedEstablishments: "Permitted Establishments"
    },
    fields: {
      email: "Email",
      cpf: "Tax ID",
      status: "Status",
      profile: "Profile",
      companyTime: "Tenure",
      phone: "Phone",
      cellphone: "Cellphone",
      role: "Role",
      department: "Department",
      admissionDate: "Admission Date",
      accessProfile: "Access Profile",
      mainEstablishment: "Main Establishment",
      lastLogin: "Last Login",
      birthDate: "Birth Date",
      address: "Address",
      loginAttempts: "Login Attempts",
      accountStatus: "Account Status",
      accessLevel: "Access Level",
      createdBy: "Created by",
      createdAt: "Created at",
      updatedBy: "Last updated by",
      updatedAt: "Last updated at"
    },
    values: {
      notLinked: "Not linked",
      never: "Never",
      yearsOld: "years old"
    },
    securityAlerts: {
      title: "Security Alert",
      blockedTitle: "Account Blocked",
      attempts: "This user has {{attempts}} failed login attempt(s).",
      autoBlocked: " The account has been automatically blocked.",
      willBlock: " After 5 attempts the account will be blocked.",
      blockedDesc: "This account was blocked due to too many login attempts. Please contact the administrator to unblock."
    },
    audit: {
      userNumber: "User #{{id}}"
    },
    permissions: {
      customProfileTitle: "Custom Profile",
      customProfileDesc: "This user has a custom profile with access only to the features listed below. All other system features will be unavailable.",
      menu: "Menu",
      permission: "Permission",
      permitted: "Permitted",
      partial: "Partial",
      notPermitted: "Not permitted",
      summary: "Permissions Summary",
      totalPermissions: "Total Permissions",
      mainMenus: "Main Menus",
      submenus: "Submenus"
    },
    establishments: {
      restrictedAccessTitle: "Restricted Access to Establishments",
      restrictedAccessDesc: "This user only has access to the establishments listed below. After logging in, the user must select one to start working.",
      listTitle: "Permitted Establishments",
      mainTitle: "Main Establishment",
      mainDescHas: "This user's main establishment is",
      mainDescHasNot: "This user does not have a defined main establishment.",
      summaryPermitted: "permitted establishment(s)",
      summaryTotal: "total in system"
    }
  }
};

const esTranslations = {
  userView: {
    back: "Volver a Usuarios",
    title: "Ver Usuario",
    subtitle: "Detalles completos del usuario",
    protectedUser: "Usuario Protegido",
    edit: "Editar",
    tabs: {
      details: "Detalles del Usuario",
      permissions: "Permisos",
      establishments: "Establecimientos"
    },
    sections: {
      contact: "Información de Contacto",
      professional: "Información Profesional",
      personal: "Información Personal",
      security: "Información de Seguridad",
      audit: "Información de Auditoría",
      observations: "Observaciones",
      customPermissions: "Permisos Personalizados",
      permittedEstablishments: "Establecimientos Permitidos"
    },
    fields: {
      email: "Correo",
      cpf: "Documento",
      status: "Estado",
      profile: "Perfil",
      companyTime: "Antigüedad",
      phone: "Teléfono",
      cellphone: "Celular",
      role: "Cargo",
      department: "Departamento",
      admissionDate: "Fecha de Ingreso",
      accessProfile: "Perfil de Acceso",
      mainEstablishment: "Establecimiento Principal",
      lastLogin: "Último Acceso",
      birthDate: "Fecha de Nacimiento",
      address: "Dirección",
      loginAttempts: "Intentos de Acceso",
      accountStatus: "Estado de la Cuenta",
      accessLevel: "Nivel de Acceso",
      createdBy: "Creado por",
      createdAt: "Fecha de Creación",
      updatedBy: "Última modificación por",
      updatedAt: "Fecha de última modificación"
    },
    values: {
      notLinked: "No vinculado",
      never: "Nunca",
      yearsOld: "años"
    },
    securityAlerts: {
      title: "Alerta de Seguridad",
      blockedTitle: "Cuenta Bloqueada",
      attempts: "Este usuario tiene {{attempts}} intento(s) de acceso fallido(s).",
      autoBlocked: " La cuenta ha sido bloqueada automáticamente.",
      willBlock: " Después de 5 intentos la cuenta será bloqueada.",
      blockedDesc: "Esta cuenta fue bloqueada debido a demasiados intentos de acceso. Por favor contacte al administrador para desbloquear."
    },
    audit: {
      userNumber: "Usuario #{{id}}"
    },
    permissions: {
      customProfileTitle: "Perfil Personalizado",
      customProfileDesc: "Este usuario tiene un perfil personalizado con acceso solo a las funcionalidades listadas abajo. Todas las demás funcionalidades no estarán disponibles.",
      menu: "Menú",
      permission: "Permiso",
      permitted: "Permitido",
      partial: "Parcial",
      notPermitted: "No permitido",
      summary: "Resumen de Permisos",
      totalPermissions: "Total de Permisos",
      mainMenus: "Menús Principales",
      submenus: "Submenús"
    },
    establishments: {
      restrictedAccessTitle: "Acceso Restringido a Establecimientos",
      restrictedAccessDesc: "Este usuario solo tiene acceso a los establecimientos listados abajo. Después de iniciar sesión, el usuario deberá seleccionar uno para empezar a trabajar.",
      listTitle: "Establecimientos Permitidos",
      mainTitle: "Establecimiento Principal",
      mainDescHas: "El establecimiento principal de este usuario es",
      mainDescHasNot: "Este usuario no tiene un establecimiento principal definido.",
      summaryPermitted: "establecimiento(s) permitido(s)",
      summaryTotal: "total en el sistema"
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
      json.userView = ptTranslations.userView;
    } else if (loc === 'en') {
      json.userView = enTranslations.userView;
    } else if (loc === 'es') {
      json.userView = esTranslations.userView;
    }
    
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf-8');
    console.log(`Updated ${loc}/translation.json`);
  }
});
