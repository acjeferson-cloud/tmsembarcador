const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');
const languages = ['pt', 'en', 'es'];

const usersTranslations = {
  title: {
    pt: 'Usuários',
    en: 'Users',
    es: 'Usuarios'
  },
  subtitle: {
    pt: 'Gerencie os usuários do sistema',
    en: 'Manage system users',
    es: 'Gestione los usuarios del sistema'
  },
  buttons: {
    new: {
      pt: 'Novo Usuário',
      en: 'New User',
      es: 'Nuevo Usuario'
    },
    export: {
      pt: 'Exportar',
      en: 'Export',
      es: 'Exportar'
    },
    impersonate: {
      pt: 'Acessar como',
      en: 'Impersonate',
      es: 'Acceder como'
    },
    block: {
      pt: 'Bloquear',
      en: 'Block',
      es: 'Bloquear'
    },
    unblock: {
      pt: 'Desbloquear',
      en: 'Unblock',
      es: 'Desbloquear'
    },
    resetPassword: {
      pt: 'Resetar Senha',
      en: 'Reset Password',
      es: 'Restablecer Contraseña'
    },
    edit: {
      pt: 'Editar',
      en: 'Edit',
      es: 'Editar'
    },
    delete: {
      pt: 'Excluir',
      en: 'Delete',
      es: 'Eliminar'
    },
    cancel: {
      pt: 'Cancelar',
      en: 'Cancel',
      es: 'Cancelar'
    },
    save: {
      pt: 'Salvar',
      en: 'Save',
      es: 'Guardar'
    },
    back: {
      pt: 'Voltar',
      en: 'Back',
      es: 'Volver'
    },
    update: {
      pt: 'Atualizar',
      en: 'Update',
      es: 'Actualizar'
    }
  },
  filters: {
    searchPlaceholder: {
      pt: 'Buscar por nome, email ou CPF...',
      en: 'Search by name, email or CPF...',
      es: 'Buscar por nombre, correo electrónico o CPF...'
    },
    allRoles: {
      pt: 'Todos os Perfis',
      en: 'All Roles',
      es: 'Todos los Perfiles'
    },
    allStatuses: {
      pt: 'Todos os Status',
      en: 'All Statuses',
      es: 'Todos los Estados'
    },
    active: {
      pt: 'Ativo',
      en: 'Active',
      es: 'Activo'
    },
    blocked: {
      pt: 'Bloqueado',
      en: 'Blocked',
      es: 'Bloqueado'
    },
    pending: {
      pt: 'Pendente',
      en: 'Pending',
      es: 'Pendiente'
    }
  },
  table: {
    name: {
      pt: 'Nome',
      en: 'Name',
      es: 'Nombre'
    },
    contact: {
      pt: 'Contato',
      en: 'Contact',
      es: 'Contacto'
    },
    role: {
      pt: 'Perfil',
      en: 'Role',
      es: 'Perfil'
    },
    status: {
      pt: 'Status',
      en: 'Status',
      es: 'Estado'
    },
    actions: {
      pt: 'Ações',
      en: 'Actions',
      es: 'Acciones'
    }
  },
  form: {
    newTitle: {
      pt: 'Novo Usuário',
      en: 'New User',
      es: 'Nuevo Usuario'
    },
    newSubtitle: {
      pt: 'Preencha os dados do novo usuário',
      en: 'Fill in the new user data',
      es: 'Complete los datos del nuevo usuario'
    },
    editTitle: {
      pt: 'Editar Usuário',
      en: 'Edit User',
      es: 'Editar Usuario'
    },
    editSubtitle: {
      pt: 'Atualize os dados do usuário',
      en: 'Update the user data',
      es: 'Actualice los datos del usuario'
    },
    tabs: {
      basic: {
        pt: 'Dados Básicos',
        en: 'Basic Data',
        es: 'Datos Básicos'
      },
      permissions: {
        pt: 'Permissões',
        en: 'Permissions',
        es: 'Permisos'
      },
      establishments: {
        pt: 'Estabelecimentos',
        en: 'Establishments',
        es: 'Establecimientos'
      }
    },
    fields: {
      name: {
        pt: 'Nome Completo',
        en: 'Full Name',
        es: 'Nombre Completo'
      },
      email: {
        pt: 'E-mail',
        en: 'Email',
        es: 'Correo Electrónico'
      },
      cpf: {
        pt: 'CPF',
        en: 'CPF',
        es: 'CPF'
      },
      phone: {
        pt: 'Telefone',
        en: 'Phone',
        es: 'Teléfono'
      },
      department: {
        pt: 'Departamento',
        en: 'Department',
        es: 'Departamento'
      },
      position: {
        pt: 'Cargo',
        en: 'Position',
        es: 'Cargo'
      },
      role: {
        pt: 'Perfil de Acesso',
        en: 'Access Role',
        es: 'Perfil de Acceso'
      },
      status: {
        pt: 'Status',
        en: 'Status',
        es: 'Estado'
      },
      avatar: {
        pt: 'Foto de Perfil',
        en: 'Profile Photo',
        es: 'Foto de Perfil'
      }
    },
    roles: {
      admin: {
        pt: 'Administrador (Acesso total)',
        en: 'Administrator (Full access)',
        es: 'Administrador (Acceso total)'
      },
      manager: {
        pt: 'Gerente (Acesso gerencial)',
        en: 'Manager (Managerial access)',
        es: 'Gerente (Acceso gerencial)'
      },
      operator: {
        pt: 'Operador (Acesso operacional)',
        en: 'Operator (Operational access)',
        es: 'Operador (Acceso operacional)'
      },
      viewer: {
        pt: 'Visualizador (Apenas leitura)',
        en: 'Viewer (Read only)',
        es: 'Visualizador (Solo lectura)'
      }
    }
  },
  view: {
    personalInfo: {
      pt: 'Informações Pessoais',
      en: 'Personal Information',
      es: 'Información Personal'
    },
    contact: {
      pt: 'Contato',
      en: 'Contact',
      es: 'Contacto'
    },
    professional: {
      pt: 'Informações Profissionais',
      en: 'Professional Information',
      es: 'Información Profesional'
    },
    system: {
      pt: 'Acesso ao Sistema',
      en: 'System Access',
      es: 'Acceso al Sistema'
    },
    lastLogin: {
      pt: 'Último acesso',
      en: 'Last login',
      es: 'Último acceso'
    },
    createdAt: {
      pt: 'Criado em',
      en: 'Created at',
      es: 'Creado en'
    }
  },
  messages: {
    deleteConfirmTitle: {
      pt: 'Excluir Usuário',
      en: 'Delete User',
      es: 'Eliminar Usuario'
    },
    deleteConfirmText: {
      pt: 'Tem certeza que deseja excluir o usuário',
      en: 'Are you sure you want to delete the user',
      es: '¿Estás seguro de que deseas eliminar al usuario'
    },
    deleteConfirmWarning: {
      pt: 'Esta ação não pode ser desfeita e todas as configurações associadas a este usuário serão perdidas.',
      en: 'This action cannot be undone and all settings associated with this user will be lost.',
      es: 'Esta acción no se puede deshacer y todas las configuraciones asociadas a este usuario se perderán.'
    },
    blockConfirmTitle: {
      pt: 'Bloquear Usuário',
      en: 'Block User',
      es: 'Bloquear Usuario'
    },
    blockConfirmText: {
      pt: 'Tem certeza que deseja bloquear o usuário',
      en: 'Are you sure you want to block the user',
      es: '¿Estás seguro de que deseas bloquear al usuario'
    },
    blockConfirmWarning: {
      pt: 'O usuário não poderá mais acessar o sistema.',
      en: 'The user will no longer be able to access the system.',
      es: 'El usuario ya no podrá acceder al sistema.'
    },
    unblockConfirmTitle: {
      pt: 'Desbloquear Usuário',
      en: 'Unblock User',
      es: 'Desbloquear Usuario'
    },
    unblockConfirmText: {
      pt: 'Tem certeza que deseja desbloquear o usuário',
      en: 'Are you sure you want to unblock the user',
      es: '¿Estás seguro de que deseas desbloquear al usuario'
    },
    resetPasswordConfirmTitle: {
      pt: 'Resetar Senha',
      en: 'Reset Password',
      es: 'Restablecer Contraseña'
    },
    resetPasswordConfirmText: {
      pt: 'Tem certeza que deseja resetar a senha do usuário',
      en: 'Are you sure you want to reset the password for the user',
      es: '¿Estás seguro de que deseas restablecer la contraseña para el usuario'
    },
    resetPasswordConfirmWarning: {
      pt: 'Um e-mail será enviado com as instruções para redefinição de senha.',
      en: 'An email will be sent with instructions for resetting the password.',
      es: 'Se enviará un correo electrónico con instrucciones para restablecer la contraseña.'
    },
    impersonateConfirmTitle: {
      pt: 'Acessar como',
      en: 'Impersonate',
      es: 'Acceder como'
    },
    impersonateConfirmText: {
      pt: 'Tem certeza que deseja acessar o sistema como o usuário',
      en: 'Are you sure you want to access the system as the user',
      es: '¿Estás seguro de que deseas acceder al sistema como el usuario'
    },
    impersonateConfirmWarning: {
      pt: 'Você precisará fazer login novamente para voltar à sua conta.',
      en: 'You will need to log in again to return to your account.',
      es: 'Deberá iniciar sesión nuevamente para volver a su cuenta.'
    },
    saveSuccess: {
      pt: 'Usuário salvo com sucesso',
      en: 'User saved successfully',
      es: 'Usuario guardado con éxito'
    },
    deleteSuccess: {
      pt: 'Usuário excluído com sucesso',
      en: 'User deleted successfully',
      es: 'Usuario eliminado con éxito'
    },
    blockSuccess: {
      pt: 'Usuário bloqueado com sucesso',
      en: 'User blocked successfully',
      es: 'Usuario bloqueado con éxito'
    },
    unblockSuccess: {
      pt: 'Usuário desbloqueado com sucesso',
      en: 'User unblocked successfully',
      es: 'Usuario desbloqueado con éxito'
    },
    resetPasswordSuccess: {
      pt: 'E-mail de redefinição de senha enviado com sucesso',
      en: 'Password reset email sent successfully',
      es: 'Correo electrónico de restablecimiento de contraseña enviado con éxito'
    },
    error: {
      pt: 'Ocorreu um erro. Tente novamente.',
      en: 'An error occurred. Please try again.',
      es: 'Ocurrió un error. Inténtalo de nuevo.'
    }
  }
};

const buildTranslationsObj = (translationsSource, lang) => {
  const result = {};
  for (const key in translationsSource) {
    if (typeof translationsSource[key] === 'object' && translationsSource[key][lang] === undefined) {
      result[key] = buildTranslationsObj(translationsSource[key], lang);
    } else {
      result[key] = translationsSource[key][lang];
    }
  }
  return result;
};

const injectTranslations = () => {
  languages.forEach((lang) => {
    const localeFilePath = path.join(localesDir, lang, 'translation.json');
    if (fs.existsSync(localeFilePath)) {
      const localeData = JSON.parse(fs.readFileSync(localeFilePath, 'utf-8'));
      
      const generatedTranslations = buildTranslationsObj(usersTranslations, lang);
      localeData.users = { ...localeData.users, ...generatedTranslations };
      
      fs.writeFileSync(localeFilePath, JSON.stringify(localeData, null, 2));
      console.log(`Injected translations for ${lang}`);
    } else {
      console.warn(`Could not find ${localeFilePath}`);
    }
  });
};

injectTranslations();
