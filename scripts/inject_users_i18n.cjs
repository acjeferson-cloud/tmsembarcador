const fs = require('fs');
const path = require('path');

const locales = ['pt', 'en', 'es'];
const baseDir = path.join(__dirname, '../src');

const ptKeys = {
  users: {
    title: "Usuários",
    subtitle: "Gerencie os usuários do sistema",
    buttons: {
      new: "Novo Usuário",
      export: "Exportar",
      impersonate: "Acessar como",
      block: "Bloquear",
      unblock: "Desbloquear",
      resetPassword: "Resetar Senha",
      edit: "Editar",
      delete: "Excluir",
      cancel: "Cancelar",
      save: "Salvar",
      back: "Voltar",
      update: "Atualizar",
      choosePhoto: "Escolher Foto",
      remove: "Remover"
    },
    filters: {
      searchPlaceholder: "Buscar por nome, email ou CPF...",
      allRoles: "Todos os Perfis",
      allStatuses: "Todos os Status",
      active: "Ativo",
      blocked: "Bloqueado",
      pending: "Pendente",
      inactive: "Inativo"
    },
    table: {
      name: "Nome",
      contact: "Contato",
      role: "Perfil",
      status: "Status",
      actions: "Ações"
    },
    form: {
      newTitle: "Novo Usuário",
      newSubtitle: "Preencha os dados do novo usuário",
      editTitle: "Editar Usuário",
      editSubtitle: "Atualize os dados do usuário",
      tabs: {
        basic: "Informações Básicas",
        contact: "Contato",
        professional: "Profissional",
        access: "Acesso",
        address: "Endereço",
        permissions: "Permissões",
        establishments: "Estabelecimentos"
      },
      fields: {
        name: "Nome Completo",
        email: "E-mail",
        cpf: "CPF",
        phone: "Telefone",
        mobile: "Celular",
        department: "Departamento",
        position: "Cargo",
        role: "Perfil de Acesso",
        status: "Status",
        avatar: "Foto de Perfil",
        avatarHint: "JPG, PNG, GIF ou WebP. Máximo 5MB.",
        code: "Código do Usuário",
        password: "Senha",
        newPassword: "Nova Senha",
        passwordHint: "Deixe em branco para manter a senha atual",
        confirmPassword: "Confirmar Senha",
        confirmNewPassword: "Confirmar Nova Senha",
        birthDate: "Data de Nascimento",
        admissionDate: "Data de Admissão",
        mainEstablishment: "Estabelecimento Principal",
        observations: "Observações Gerais",
        preferredLanguage: "Idioma Preferido"
      },
      roles: {
        admin: "Administrador",
        manager: "Gerente",
        operator: "Operador",
        viewer: "Visualizador",
        custom: "Personalizado"
      },
      hints: {
        protectedUserTitle: "Usuário Protegido",
        protectedUserDesc: "Este é o usuário administrador principal. Algumas alterações podem ser restritas para manter a segurança do sistema.",
        autoCodeTitle: "Código Gerado Automaticamente",
        autoCodeDesc: "Os códigos são gerados automaticamente de forma sequencial, iniciando em 0001. Este campo não pode ser editado manualmente.",
        accessLevelsTitle: "Níveis de Acesso",
        accessAdmin: "Acesso total ao sistema",
        accessManager: "Acesso a relatórios e gestão de operações",
        accessOperator: "Acesso às funcionalidades operacionais",
        accessViewer: "Acesso apenas para consulta",
        accessCustom: "Acesso customizado por funcionalidade",
        customPermissionsTitle: "Configuração de Permissões Personalizadas",
        customPermissionsDesc: "Você selecionou o perfil \"Personalizado\". Acesse a aba \"Permissões\" para configurar as permissões de acesso específicas para este usuário.",
        customPermissionsExtra: "Selecione as opções de menu que este usuário terá acesso. Marque ou desmarque as caixas de seleção para configurar as permissões. Quando um menu pai é selecionado, todos os seus submenus são automaticamente incluídos.",
        languageSaveHint: "Ao salvar, o idioma selecionado será aplicado imediatamente em todo o sistema (menu, telas, botões, etc.)",
        languageUserHint: "Este idioma será usado para exibir o sistema para este usuário.",
        establishmentLimitations: "Apenas estabelecimentos permitidos são exibidos nesta lista.",
        autoZipSearch: "Busca Automática por CEP",
        autoZipDesc: "Informe o CEP para preencher automaticamente cidade, estado e bairro. Os campos cidade e estado não podem ser editados manualmente."
      }
    },
    view: {
      personalInfo: "Informações Pessoais",
      contact: "Contato",
      professional: "Informações Profissionais",
      system: "Acesso ao Sistema",
      lastLogin: "Último acesso",
      createdAt: "Criado em",
      noPhoto: "Sem foto",
      emptyPhone: "Não informado",
      emptyDept: "Não informado"
    },
    messages: {
      deleteConfirmTitle: "Excluir Usuário",
      deleteConfirmText: "Tem certeza que deseja excluir o usuário",
      deleteConfirmWarning: "Esta ação não pode ser desfeita e todas as configurações associadas a este usuário serão perdidas.",
      blockConfirmTitle: "Bloquear Usuário",
      blockConfirmText: "Tem certeza que deseja bloquear o usuário",
      blockConfirmWarning: "O usuário não poderá mais acessar o sistema.",
      unblockConfirmTitle: "Desbloquear Usuário",
      unblockConfirmText: "Tem certeza que deseja desbloquear o usuário",
      resetPasswordConfirmTitle: "Resetar Senha",
      resetPasswordConfirmText: "Tem certeza que deseja resetar a senha do usuário",
      resetPasswordConfirmWarning: "Um e-mail será enviado com as instruções para redefinição de senha.",
      impersonateConfirmTitle: "Acessar como",
      impersonateConfirmText: "Tem certeza que deseja acessar o sistema como o usuário",
      impersonateConfirmWarning: "Você precisará fazer login novamente para voltar à sua conta.",
      saveSuccess: "Usuário salvo com sucesso",
      deleteSuccess: "Usuário excluído com sucesso",
      error: "Ocorreu um erro na solicitação. Tente novamente."
    },
    stats: {
      total: "Total",
      showing: "Mostrando",
      of: "de",
      to: "a",
      users: "usuários",
      page: "Página",
      activeText: "ativos",
      blockedText: "bloqueados",
      securityAccessTitle: "Segurança e Controle de Acesso",
      securityAccessDesc: "O sistema possui controle rigoroso de acesso com diferentes níveis de permissão e monitoramento de atividades.",
      accessProfiles: "Perfis de Acesso",
      accessProfilesLen: "5 níveis de permissão",
      permissions: "Permissões",
      permissionsGranular: "Controle granular",
      autoBlock: "Bloqueio Automático",
      autoBlockAfter: "Após 5 tentativas",
      audit: "Auditoria",
      auditLog: "Log de atividades",
      adminProtect: "Proteção Admin",
      adminProtectUser: "Usuário protegido"
    },
    blocked: {
      title: "Usuários Bloqueados",
      subtitle: "Gerencie os usuários que estão com acesso bloqueado",
      reason: "Motivo do Bloqueio",
      date: "Data do Bloqueio",
      emptyState: "Nenhum usuário bloqueado no momento.",
      emptyDesc: "Os usuários que excederem o limite de tentativas de login ou forem bloqueados manualmente aparecerão aqui.",
      unlocking: "Desbloqueando...",
      unlockSuccess: "Usuário desbloqueado com sucesso",
      unlockError: "Erro ao desbloquear usuário"
    }
  }
};

const enKeys = {
  users: {
    title: "Users",
    subtitle: "Manage system users",
    buttons: {
      new: "New User",
      export: "Export",
      impersonate: "Impersonate",
      block: "Block",
      unblock: "Unblock",
      resetPassword: "Reset Password",
      edit: "Edit",
      delete: "Delete",
      cancel: "Cancel",
      save: "Save",
      back: "Back",
      update: "Update",
      choosePhoto: "Choose Photo",
      remove: "Remove"
    },
    filters: {
      searchPlaceholder: "Search by name, email or document...",
      allRoles: "All Roles",
      allStatuses: "All Statuses",
      active: "Active",
      blocked: "Blocked",
      pending: "Pending",
      inactive: "Inactive"
    },
    table: {
      name: "Name",
      contact: "Contact",
      role: "Role",
      status: "Status",
      actions: "Actions"
    },
    form: {
      newTitle: "New User",
      newSubtitle: "Fill in the new user details",
      editTitle: "Edit User",
      editSubtitle: "Update user details",
      tabs: {
        basic: "Basic Information",
        contact: "Contact",
        professional: "Professional",
        access: "Access",
        address: "Address",
        permissions: "Permissions",
        establishments: "Establishments"
      },
      fields: {
        name: "Full Name",
        email: "E-mail",
        cpf: "Document (CPF)",
        phone: "Phone",
        mobile: "Mobile",
        department: "Department",
        position: "Position",
        role: "Access Role",
        status: "Status",
        avatar: "Profile Photo",
        avatarHint: "JPG, PNG, GIF or WebP. Max 5MB.",
        code: "User Code",
        password: "Password",
        newPassword: "New Password",
        passwordHint: "Leave blank to keep current password",
        confirmPassword: "Confirm Password",
        confirmNewPassword: "Confirm New Password",
        birthDate: "Birth Date",
        admissionDate: "Admission Date",
        mainEstablishment: "Main Establishment",
        observations: "General Observations",
        preferredLanguage: "Preferred Language"
      },
      roles: {
        admin: "Administrator",
        manager: "Manager",
        operator: "Operator",
        viewer: "Viewer",
        custom: "Custom"
      },
      hints: {
        protectedUserTitle: "Protected User",
        protectedUserDesc: "This is the main administrator user. Some changes might be restricted to maintain system security.",
        autoCodeTitle: "Code Automatically Generated",
        autoCodeDesc: "Codes are automatically generated sequentially starting at 0001. This field cannot be manually edited.",
        accessLevelsTitle: "Access Levels",
        accessAdmin: "Full system access",
        accessManager: "Access to reports and operations management",
        accessOperator: "Access to operational features",
        accessViewer: "Read-only access",
        accessCustom: "Customized access by feature",
        customPermissionsTitle: "Custom Permissions Configuration",
        customPermissionsDesc: "You selected the \"Custom\" role. Go to the \"Permissions\" tab to configure specific access permissions for this user.",
        customPermissionsExtra: "Select the menu options this user can access. Check or uncheck boxes to configure permissions. Selecting a parent menu automatically includes all its submenus.",
        languageSaveHint: "When saving, the selected language will be applied immediately across the entire system (menus, screens, buttons, etc.)",
        languageUserHint: "This language will be used to display the system for this user.",
        establishmentLimitations: "Only permitted establishments are shown in this list.",
        autoZipSearch: "Automatic Zip Code Search",
        autoZipDesc: "Enter the Zip Code to automatically populate city, state, and neighborhood. City and state fields cannot be manually edited."
      }
    },
    view: {
      personalInfo: "Personal Information",
      contact: "Contact",
      professional: "Professional Information",
      system: "System Access",
      lastLogin: "Last login",
      createdAt: "Created at",
      noPhoto: "No photo",
      emptyPhone: "Not provided",
      emptyDept: "Not provided"
    },
    messages: {
      deleteConfirmTitle: "Delete User",
      deleteConfirmText: "Are you sure you want to delete user",
      deleteConfirmWarning: "This action cannot be undone and all settings associated with this user will be lost.",
      blockConfirmTitle: "Block User",
      blockConfirmText: "Are you sure you want to block user",
      blockConfirmWarning: "The user will no longer be able to access the system.",
      unblockConfirmTitle: "Unblock User",
      unblockConfirmText: "Are you sure you want to unblock user",
      resetPasswordConfirmTitle: "Reset Password",
      resetPasswordConfirmText: "Are you sure you want to reset the password for user",
      resetPasswordConfirmWarning: "An email will be sent with instructions for resetting the password.",
      impersonateConfirmTitle: "Impersonate",
      impersonateConfirmText: "Are you sure you want to access the system as user",
      impersonateConfirmWarning: "You will need to log back in to revert to your account.",
      saveSuccess: "User saved successfully",
      deleteSuccess: "User deleted successfully",
      error: "An error occurred. Please try again."
    },
    stats: {
      total: "Total",
      showing: "Showing",
      of: "of",
      to: "to",
      users: "users",
      page: "Page",
      activeText: "active",
      blockedText: "blocked",
      securityAccessTitle: "Security and Access Control",
      securityAccessDesc: "The system features strict access control with different permission levels and activity monitoring.",
      accessProfiles: "Access Profiles",
      accessProfilesLen: "5 permission levels",
      permissions: "Permissions",
      permissionsGranular: "Granular control",
      autoBlock: "Auto Block",
      autoBlockAfter: "After 5 attempts",
      audit: "Audit",
      auditLog: "Activity log",
      adminProtect: "Admin Protection",
      adminProtectUser: "Protected user"
    },
    blocked: {
      title: "Blocked Users",
      subtitle: "Manage users whose access has been blocked",
      reason: "Block Reason",
      date: "Block Date",
      emptyState: "No blocked users at the moment.",
      emptyDesc: "Users who exceed login attempts or are manually blocked will automatically appear here.",
      unlocking: "Unblocking...",
      unlockSuccess: "User unblocked successfully",
      unlockError: "Error unblocking user"
    }
  }
};

const esKeys = {
  users: {
    title: "Usuarios",
    subtitle: "Gestionar los usuarios del sistema",
    buttons: {
      new: "Nuevo Usuario",
      export: "Exportar",
      impersonate: "Acceder como",
      block: "Bloquear",
      unblock: "Desbloquear",
      resetPassword: "Restablecer Contraseña",
      edit: "Editar",
      delete: "Eliminar",
      cancel: "Cancelar",
      save: "Guardar",
      back: "Volver",
      update: "Actualizar",
      choosePhoto: "Elegir Foto",
      remove: "Eliminar"
    },
    filters: {
      searchPlaceholder: "Buscar por nombre, correo o documento...",
      allRoles: "Todos los Perfiles",
      allStatuses: "Todos los Estados",
      active: "Activo",
      blocked: "Bloqueado",
      pending: "Pendiente",
      inactive: "Inactivo"
    },
    table: {
      name: "Nombre",
      contact: "Contacto",
      role: "Perfil",
      status: "Estado",
      actions: "Acciones"
    },
    form: {
      newTitle: "Nuevo Usuario",
      newSubtitle: "Complete los datos del nuevo usuario",
      editTitle: "Editar Usuario",
      editSubtitle: "Actualice los datos del usuario",
      tabs: {
        basic: "Información Básica",
        contact: "Contacto",
        professional: "Profesional",
        access: "Acceso",
        address: "Dirección",
        permissions: "Permisos",
        establishments: "Establecimientos"
      },
      fields: {
        name: "Nombre Completo",
        email: "E-mail",
        cpf: "Documento (CPF)",
        phone: "Teléfono",
        mobile: "Celular",
        department: "Departamento",
        position: "Cargo",
        role: "Perfil de Acceso",
        status: "Estado",
        avatar: "Foto de Perfil",
        avatarHint: "JPG, PNG, GIF o WebP. Máximo 5MB.",
        code: "Código de Usuario",
        password: "Contraseña",
        newPassword: "Nueva Contraseña",
        passwordHint: "Deje en blanco para mantener la contraseña actual",
        confirmPassword: "Confirmar Contraseña",
        confirmNewPassword: "Confirmar Nueva Contraseña",
        birthDate: "Fecha de Nacimiento",
        admissionDate: "Fecha de Ingreso",
        mainEstablishment: "Establecimiento Principal",
        observations: "Observaciones Generales",
        preferredLanguage: "Idioma Preferido"
      },
      roles: {
        admin: "Administrador",
        manager: "Gerente",
        operator: "Operador",
        viewer: "Visualizador",
        custom: "Personalizado"
      },
      hints: {
        protectedUserTitle: "Usuario Protegido",
        protectedUserDesc: "Este es el usuario administrador principal. Algunas modificaciones podrían estar restringidas para mantener la seguridad.",
        autoCodeTitle: "Código Generado Automáticamente",
        autoCodeDesc: "Los códigos se generan automáticamente en forma secuencial iniciando en 0001. Este campo es de sólo lectura.",
        accessLevelsTitle: "Niveles de Acceso",
        accessAdmin: "Acceso total al sistema",
        accessManager: "Acceso a informes y gestión de operaciones",
        accessOperator: "Acceso a funciones operativas",
        accessViewer: "Acceso de sólo lectura",
        accessCustom: "Acceso personalizado por funcionalidad",
        customPermissionsTitle: "Configuración de Permisos Personalizados",
        customPermissionsDesc: "Seleccionaste el perfil \"Personalizado\". Dirígete a la pestaña \"Permisos\" para configurar las reglas específicas.",
        customPermissionsExtra: "Seleccione las opciones de menú a las que este usuario tendrá acceso. Marque o desmarque para configurar permisos. Seleccionar un menú principal automáticamente incluye todos sus submenús.",
        languageSaveHint: "Al guardar, el idioma seleccionado se aplicará de inmediato a nivel sistema (menús, pantallas, botones, etc.)",
        languageUserHint: "Este idioma se utilizará para mostrar el sistema a este usuario.",
        establishmentLimitations: "Sólo se muestran aquí los establecimientos permitidos.",
        autoZipSearch: "Búsqueda Automática por Código Postal",
        autoZipDesc: "Ingrese el Código Postal para auto-completar ciudad, estado y barrio. Ciudad y estado no se pueden editar manualmente."
      }
    },
    view: {
      personalInfo: "Información Personal",
      contact: "Contacto",
      professional: "Información Profesional",
      system: "Acceso al Sistema",
      lastLogin: "Último acceso",
      createdAt: "Creado en",
      noPhoto: "Sin foto",
      emptyPhone: "No informado",
      emptyDept: "No informado"
    },
    messages: {
      deleteConfirmTitle: "Eliminar Usuario",
      deleteConfirmText: "¿Estás seguro que deseas eliminar el usuario",
      deleteConfirmWarning: "Esta acción no se puede deshacer y se perderán todos los datos vinculados.",
      blockConfirmTitle: "Bloquear Usuario",
      blockConfirmText: "¿Estás seguro que deseas bloquear el usuario",
      blockConfirmWarning: "El usuario ya no podrá acceder al sistema.",
      unblockConfirmTitle: "Desbloquear Usuario",
      unblockConfirmText: "¿Estás seguro que deseas desbloquear el usuario",
      resetPasswordConfirmTitle: "Restablecer Contraseña",
      resetPasswordConfirmText: "¿Estás seguro que deseas restablecer la contraseña de",
      resetPasswordConfirmWarning: "Se enviará un correo electrónico con instrucciones para renovar su contraseña.",
      impersonateConfirmTitle: "Acceder como",
      impersonateConfirmText: "¿Estás seguro que deseas acceder al sistema como",
      impersonateConfirmWarning: "Deberás iniciar sesión nuevamente para volver a tu cuenta.",
      saveSuccess: "Usuario guardado exitosamente",
      deleteSuccess: "Usuario eliminado con éxito",
      error: "Ha ocurrido un error. Inténtalo nuevamente."
    },
    stats: {
      total: "Total",
      showing: "Mostrando",
      of: "de",
      to: "a",
      users: "usuarios",
      page: "Página",
      activeText: "activos",
      blockedText: "bloqueados",
      securityAccessTitle: "Seguridad y Control de Acceso",
      securityAccessDesc: "El sistema cuenta con un control de acceso riguroso con diferentes niveles de permisos y monitoreo de actividades.",
      accessProfiles: "Perfiles de Acceso",
      accessProfilesLen: "5 niveles de permisos",
      permissions: "Permisos",
      permissionsGranular: "Control granular",
      autoBlock: "Bloqueo Automático",
      autoBlockAfter: "Después de 5 intentos",
      audit: "Auditoría",
      auditLog: "Registro de actividad",
      adminProtect: "Protección de Administrador",
      adminProtectUser: "Usuario protegido"
    },
    blocked: {
      title: "Usuarios Bloqueados",
      subtitle: "Gestionar los usuarios que tienen acceso bloqueado",
      reason: "Motivo del Bloqueo",
      date: "Fecha del Bloqueo",
      emptyState: "No hay usuarios bloqueados en este momento.",
      emptyDesc: "Los usuarios que excedan intentos de inicio o sean bloqueados manualmente aparecerán aquí.",
      unlocking: "Desbloqueando...",
      unlockSuccess: "Usuario desbloqueado exitosamente",
      unlockError: "Error al desbloquear el usuario"
    }
  }
};

const mergeKeys = (locale, keyData) => {
  const jsonPath = path.join(baseDir, 'locales', locale, 'translation.json');
  let data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  
  if (!data.users) data.users = {};
  
  // deeply merge the existing users object with the new structured data
  // doing it carefully with object assignment
  Object.assign(data.users, keyData.users);

  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
  console.log(`Updated ${locale}/translation.json`);
};

mergeKeys('pt', ptKeys);
mergeKeys('en', enKeys);
mergeKeys('es', esKeys);

