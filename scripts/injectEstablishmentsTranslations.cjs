const fs = require('fs');
const path = require('path');

const pts = {
  establishments: {
    title: "Estabelecimentos",
    subtitle: "Gerencie o cadastro de estabelecimentos da empresa",
    searchPlaceholder: "Buscar por razão social, fantasia, CNPJ, código ou CEP...",
    stateFilter: "Todos os Estados",
    buttons: {
      new: "Novo Estabelecimento",
      export: "Exportar",
      save: "Salvar Cadastro",
      cancel: "Cancelar",
      edit: "Editar",
      delete: "Excluir",
      view: "Visualizar",
      close: "Fechar",
      back: "Voltar",
      changeLogo: "Trocar Logo",
      removeLogo: "Remover"
    },
    messages: {
      loadError: "Erro ao carregar estabelecimentos.",
      notFound: "Estabelecimento não encontrado.",
      deleteSuccess: "Estabelecimento excluído com sucesso!",
      deleteError: "Erro ao excluir estabelecimento.",
      updateSuccess: "Estabelecimento atualizado com sucesso!",
      updateError: "Erro ao atualizar estabelecimento.",
      createSuccess: "Estabelecimento criado com sucesso!",
      createError: "Erro ao criar estabelecimento.",
      saveError: "Erro ao salvar estabelecimento. Tente novamente.",
      exportWarning: "Funcionalidade de exportação em desenvolvimento"
    },
    confirmDialog: {
      deleteTitle: "Confirmar Exclusão",
      cantDeleteTitle: "Não é Possível Excluir",
      deleteMessage: "Tem certeza que deseja excluir o estabelecimento {{name}}? Esta ação não pode ser desfeita.",
      cantDeleteMessage: "Este estabelecimento não pode ser excluído.",
      confirmText: "Excluir"
    },
    emptyState: {
      loading: "Carregando estabelecimentos...",
      title: "Nenhum estabelecimento encontrado",
      desc: "Tente ajustar os filtros ou cadastrar um novo estabelecimento."
    },
    pagination: {
      showing: "Mostrando",
      to: "a",
      of: "de",
      establishments: "estabelecimentos",
      previous: "Anterior",
      next: "Próxima"
    },
    card: {
      active: "Ativo",
      inactive: "Inativo",
      code: "CÓD. {{code}}",
      createdIn: "Criado em {{date}}",
      viewDetails: "Ver Detalhes"
    },
    form: {
      newTitle: "Novo Estabelecimento",
      newSubtitle: "Preencha os dados do novo estabelecimento",
      editTitle: "Editar Estabelecimento",
      editSubtitle: "Atualize os dados do estabelecimento",
      tabs: {
        basic: "Dados Básicos",
        address: "Endereço",
        logos: "Logos e Identidade",
        email: "Configuração de E-mail"
      },
      fields: {
        code: "Código *",
        cnpj: "CNPJ *",
        ie: "Inscrição Estadual",
        companyName: "Razão Social *",
        tradeName: "Nome Fantasia *",
        type: "Tipo do Estabelecimento",
        typeOptions: {
          matriz: "Matriz",
          filial: "Filial"
        },
        trackingPrefix: "Prefixo Tracking (WhatsApp)",
        trackingPrefixDesc: "Usado para validar e formatar mensagens de rastreio",
        zipCode: "CEP *",
        address: "Endereço *",
        neighborhood: "Bairro *",
        city: "Cidade *",
        state: "Estado *",
        emailSmtp: "Servidor SMTP",
        emailSmtpPlaceholder: "smtp.exemplo.com",
        emailPort: "Porta SMTP",
        emailUser: "Usuário/E-mail",
        emailPass: "Senha",
        emailFromName: "Nome do Remetente",
        emailFromNamePlaceholder: "Ex: TMS Embarcador",
        emailFromAddress: "E-mail de Envio (Opcional)",
        emailFromAddressPlaceholder: "Ex: nao-responda@empresa.com"
      },
      logos: {
        lightTitle: "Logo Principal (Fundo Claro)",
        lightDesc: "Recomendado: fundo transparente, formato horizontal.",
        darkTitle: "Logo Alternativo (Fundo Escuro)",
        darkDesc: "Recomendado: cor clara/branca, fundo transparente.",
        npsTitle: "Logo Pesquisa NPS",
        npsDesc: "Usado em e-mails e páginas de pesquisa NPS. Formato preferencialmente quadrado.",
        uploadInstructions: "Clique ou arraste a imagem aqui",
        uploadFormats: "PNG, JPG ou SVG (Máx. 2MB)"
      },
      errors: {
        codeRequired: "Código é obrigatório",
        cnpjRequired: "CNPJ é obrigatório",
        companyNameRequired: "Razão Social é obrigatória",
        tradeNameRequired: "Nome Fantasia é obrigatório",
        zipCodeRequired: "CEP é obrigatório",
        addressRequired: "Endereço é obrigatório",
        neighborhoodRequired: "Bairro é obrigatório",
        cityRequired: "Cidade é obrigatória",
        stateRequired: "Estado é obrigatório"
      }
    },
    view: {
      detailsTitle: "Detalhes do Estabelecimento",
      detailsDesc: "Visualize todas as informações do estabelecimento.",
      sections: {
        general: "Informações Gerais",
        address: "Endereço",
        logos: "Logos e Identidade Visual",
        email: "Configuração de E-mail"
      },
      fields: {
        code: "Código",
        cnpj: "CNPJ",
        ie: "Inscrição Estadual",
        companyName: "Razão Social",
        tradeName: "Nome Fantasia",
        type: "Tipo",
        trackingPrefix: "Prefixo Tracking",
        zipCode: "CEP",
        address: "Endereço",
        neighborhood: "Bairro",
        city: "Cidade",
        state: "Estado",
        emailSmtp: "Servidor SMTP",
        emailPort: "Porta SMTP",
        emailUser: "Usuário/E-mail",
        emailFromName: "Nome do Remetente",
        emailFromAddress: "E-mail de Envio"
      },
      emptyMessages: {
        notInformed: "Não informado",
        noConfig: "Não configurado"
      },
      logoLabels: {
        light: "Fundo Claro",
        dark: "Fundo Escuro",
        nps: "Logo NPS"
      }
    }
  }
};

const ens = {
  establishments: {
    title: "Establishments",
    subtitle: "Manage the company's establishment registry",
    searchPlaceholder: "Search by company name, trade name, CNPJ, code or zip...",
    stateFilter: "All States",
    buttons: {
      new: "New Establishment",
      export: "Export",
      save: "Save Registry",
      cancel: "Cancel",
      edit: "Edit",
      delete: "Delete",
      view: "View",
      close: "Close",
      back: "Back",
      changeLogo: "Change Logo",
      removeLogo: "Remove"
    },
    messages: {
      loadError: "Error loading establishments.",
      notFound: "Establishment not found.",
      deleteSuccess: "Establishment successfully deleted!",
      deleteError: "Error deleting establishment.",
      updateSuccess: "Establishment successfully updated!",
      updateError: "Error updating establishment.",
      createSuccess: "Establishment successfully created!",
      createError: "Error creating establishment.",
      saveError: "Error saving establishment. Please try again.",
      exportWarning: "Export feature in development"
    },
    confirmDialog: {
      deleteTitle: "Confirm Deletion",
      cantDeleteTitle: "Cannot Delete",
      deleteMessage: "Are you sure you want to delete the establishment {{name}}? This action cannot be undone.",
      cantDeleteMessage: "This establishment cannot be deleted.",
      confirmText: "Delete"
    },
    emptyState: {
      loading: "Loading establishments...",
      title: "No establishments found",
      desc: "Try adjusting filters or registering a new establishment."
    },
    pagination: {
      showing: "Showing",
      to: "to",
      of: "of",
      establishments: "establishments",
      previous: "Previous",
      next: "Next"
    },
    card: {
      active: "Active",
      inactive: "Inactive",
      code: "CODE {{code}}",
      createdIn: "Created in {{date}}",
      viewDetails: "View Details"
    },
    form: {
      newTitle: "New Establishment",
      newSubtitle: "Fill in the new establishment details",
      editTitle: "Edit Establishment",
      editSubtitle: "Update the establishment details",
      tabs: {
        basic: "Basic Data",
        address: "Address",
        logos: "Logos and Identity",
        email: "Email Configuration"
      },
      fields: {
        code: "Code *",
        cnpj: "CNPJ *",
        ie: "State Registration",
        companyName: "Company Name *",
        tradeName: "Trade Name *",
        type: "Establishment Type",
        typeOptions: {
          matriz: "Headquarters",
          filial: "Branch"
        },
        trackingPrefix: "Tracking Prefix (WhatsApp)",
        trackingPrefixDesc: "Used to validate and format tracking messages",
        zipCode: "Zip Code *",
        address: "Address *",
        neighborhood: "Neighborhood *",
        city: "City *",
        state: "State *",
        emailSmtp: "SMTP Server",
        emailSmtpPlaceholder: "smtp.example.com",
        emailPort: "SMTP Port",
        emailUser: "User/Email",
        emailPass: "Password",
        emailFromName: "Sender Name",
        emailFromNamePlaceholder: "Ex: TMS Shipper",
        emailFromAddress: "Sender Email (Optional)",
        emailFromAddressPlaceholder: "Ex: no-reply@company.com"
      },
      logos: {
        lightTitle: "Main Logo (Light Background)",
        lightDesc: "Recommended: transparent background, horizontal format.",
        darkTitle: "Alternative Logo (Dark Background)",
        darkDesc: "Recommended: light/white color, transparent background.",
        npsTitle: "NPS Survey Logo",
        npsDesc: "Used in emails and NPS survey pages. Preferably square format.",
        uploadInstructions: "Click or drag the image here",
        uploadFormats: "PNG, JPG or SVG (Max 2MB)"
      },
      errors: {
        codeRequired: "Code is required",
        cnpjRequired: "CNPJ is required",
        companyNameRequired: "Company Name is required",
        tradeNameRequired: "Trade Name is required",
        zipCodeRequired: "Zip Code is required",
        addressRequired: "Address is required",
        neighborhoodRequired: "Neighborhood is required",
        cityRequired: "City is required",
        stateRequired: "State is required"
      }
    },
    view: {
      detailsTitle: "Establishment Details",
      detailsDesc: "View all establishment information.",
      sections: {
        general: "General Information",
        address: "Address",
        logos: "Logos and Visual Identity",
        email: "Email Configuration"
      },
      fields: {
        code: "Code",
        cnpj: "CNPJ",
        ie: "State Registration",
        companyName: "Company Name",
        tradeName: "Trade Name",
        type: "Type",
        trackingPrefix: "Tracking Prefix",
        zipCode: "Zip Code",
        address: "Address",
        neighborhood: "Neighborhood",
        city: "City",
        state: "State",
        emailSmtp: "SMTP Server",
        emailPort: "SMTP Port",
        emailUser: "User/Email",
        emailFromName: "Sender Name",
        emailFromAddress: "Sender Email"
      },
      emptyMessages: {
        notInformed: "Not informed",
        noConfig: "Not configured"
      },
      logoLabels: {
        light: "Light Background",
        dark: "Dark Background",
        nps: "NPS Logo"
      }
    }
  }
};

const ess = {
  establishments: {
    title: "Establecimientos",
    subtitle: "Gestione el registro de establecimientos de la empresa",
    searchPlaceholder: "Buscar por razón social, nombre de fantasía, CNPJ, código o código postal...",
    stateFilter: "Todos los Estados",
    buttons: {
      new: "Nuevo Establecimiento",
      export: "Exportar",
      save: "Guardar Registro",
      cancel: "Cancelar",
      edit: "Editar",
      delete: "Eliminar",
      view: "Ver",
      close: "Cerrar",
      back: "Volver",
      changeLogo: "Cambiar Logo",
      removeLogo: "Eliminar"
    },
    messages: {
      loadError: "Error al cargar establecimientos.",
      notFound: "Establecimiento no encontrado.",
      deleteSuccess: "¡Establecimiento eliminado con éxito!",
      deleteError: "Error al eliminar establecimiento.",
      updateSuccess: "¡Establecimiento actualizado con éxito!",
      updateError: "Error al actualizar establecimiento.",
      createSuccess: "¡Establecimiento creado con éxito!",
      createError: "Error al crear establecimiento.",
      saveError: "Error al guardar establecimiento. Inténtelo de nuevo.",
      exportWarning: "Funcionalidad de exportación en desarrollo"
    },
    confirmDialog: {
      deleteTitle: "Confirmar Eliminación",
      cantDeleteTitle: "No se puede Eliminar",
      deleteMessage: "¿Está seguro de que desea eliminar el establecimiento {{name}}? Esta acción no se puede deshacer.",
      cantDeleteMessage: "Este establecimiento no se puede eliminar.",
      confirmText: "Eliminar"
    },
    emptyState: {
      loading: "Cargando establecimientos...",
      title: "No se encontraron establecimientos",
      desc: "Pruebe a ajustar los filtros o a registrar un nuevo establecimiento."
    },
    pagination: {
      showing: "Mostrando",
      to: "a",
      of: "de",
      establishments: "establecimientos",
      previous: "Anterior",
      next: "Siguiente"
    },
    card: {
      active: "Activo",
      inactive: "Inactivo",
      code: "CÓD. {{code}}",
      createdIn: "Creado el {{date}}",
      viewDetails: "Ver Detalles"
    },
    form: {
      newTitle: "Nuevo Establecimiento",
      newSubtitle: "Complete los datos del nuevo establecimiento",
      editTitle: "Editar Establecimiento",
      editSubtitle: "Actualice los datos del establecimiento",
      tabs: {
        basic: "Datos Básicos",
        address: "Dirección",
        logos: "Logos e Identidad",
        email: "Configuración de Correo Electrónico"
      },
      fields: {
        code: "Código *",
        cnpj: "CNPJ *",
        ie: "Registro Estatal",
        companyName: "Razón Social *",
        tradeName: "Nombre de Fantasía *",
        type: "Tipo de Establecimiento",
        typeOptions: {
          matriz: "Sede Principal",
          filial: "Sucursal"
        },
        trackingPrefix: "Prefijo de Seguimiento (WhatsApp)",
        trackingPrefixDesc: "Se utiliza para validar y dar formato a los mensajes de seguimiento",
        zipCode: "Código Postal *",
        address: "Dirección *",
        neighborhood: "Barrio *",
        city: "Ciudad *",
        state: "Estado *",
        emailSmtp: "Servidor SMTP",
        emailSmtpPlaceholder: "smtp.ejemplo.com",
        emailPort: "Puerto SMTP",
        emailUser: "Usuario/Correo Electrónico",
        emailPass: "Contraseña",
        emailFromName: "Nombre del Remitente",
        emailFromNamePlaceholder: "Ej: TMS Remitente",
        emailFromAddress: "Correo Electrónico de Envío (Opcional)",
        emailFromAddressPlaceholder: "Ej: no-responder@empresa.com"
      },
      logos: {
        lightTitle: "Logo Principal (Fondo Claro)",
        lightDesc: "Recomendado: fondo transparente, formato horizontal.",
        darkTitle: "Logo Alternativo (Fundo Oscuro)",
        darkDesc: "Recomendado: color claro/blanco, fondo transparente.",
        npsTitle: "Logo Encuesta NPS",
        npsDesc: "Se utiliza en correos electrónicos y páginas de encuestas NPS. Formato preferiblemente cuadrado.",
        uploadInstructions: "Haga clic o arrastre la imagen aquí",
        uploadFormats: "PNG, JPG o SVG (Máx. 2MB)"
      },
      errors: {
        codeRequired: "El código es obligatorio",
        cnpjRequired: "El CNPJ es obligatorio",
        companyNameRequired: "La Razón Social es obligatoria",
        tradeNameRequired: "El Nombre de Fantasía es obligatorio",
        zipCodeRequired: "El Código Postal es obligatorio",
        addressRequired: "La Dirección es obligatoria",
        neighborhoodRequired: "El Barrio es obligatorio",
        cityRequired: "La Ciudad es obligatoria",
        stateRequired: "El Estado es obligatorio"
      }
    },
    view: {
      detailsTitle: "Detalles del Establecimiento",
      detailsDesc: "Ver toda la información del establecimiento.",
      sections: {
        general: "Información General",
        address: "Dirección",
        logos: "Logos e Identidad Visual",
        email: "Configuración de Correo Electrónico"
      },
      fields: {
        code: "Código",
        cnpj: "CNPJ",
        ie: "Registro Estatal",
        companyName: "Razón Social",
        tradeName: "Nombre de Fantasía",
        type: "Tipo",
        trackingPrefix: "Prefijo de Seguimiento",
        zipCode: "Código Postal",
        address: "Dirección",
        neighborhood: "Barrio",
        city: "Ciudad",
        state: "Estado",
        emailSmtp: "Servidor SMTP",
        emailPort: "Puerto SMTP",
        emailUser: "Usuario/Correo Electrónico",
        emailFromName: "Nombre del Remitente",
        emailFromAddress: "Correo Electrónico de Envío"
      },
      emptyMessages: {
        notInformed: "No informado",
        noConfig: "No configurado"
      },
      logoLabels: {
        light: "Fondo Claro",
        dark: "Fondo Oscuro",
        nps: "Logo NPS"
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
    exist.establishments = { ...exist.establishments, ...data.establishments };
    writeJsonFile(p, exist);
    console.log(`Updated Establishments translations for ${lang}`);
  }
});
