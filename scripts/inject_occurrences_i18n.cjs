const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');
const languages = ['pt', 'en', 'es'];

const translations = {
  occurrences: {
    title: {
      pt: "Históricos de Ocorrências",
      en: "Occurrences History",
      es: "Historial de Ocurrencias"
    },
    subtitle: {
      pt: "Gerencie os códigos de ocorrências para integração EDI",
      en: "Manage occurrence codes for EDI integration",
      es: "Administre los códigos de ocurrencias para la integración EDI"
    },
    newButton: {
      pt: "Nova Ocorrência",
      en: "New Occurrence",
      es: "Nueva Ocurrencia"
    },
    breadcrumb: {
      pt: "Logística Reversa",
      en: "Reverse Logistics",
      es: "Logística Inversa"
    },
    stats: {
      total: {
        pt: "Total de Ocorrências",
        en: "Total Occurrences",
        es: "Total de Ocurrencias"
      },
      deliveries: {
        pt: "Ocorrências de Entrega",
        en: "Delivery Occurrences",
        es: "Ocurrencias de Entrega"
      },
      problems: {
        pt: "Ocorrências de Problema",
        en: "Problem Occurrences",
        es: "Ocurrencias de Problema"
      }
    },
    searchPlaceholder: {
      pt: "Buscar por código ou descrição...",
      en: "Search by code or description...",
      es: "Buscar por código o descripción..."
    },
    export: {
      pt: "Exportar",
      en: "Export",
      es: "Exportar"
    },
    summary: {
      pt: "Total: {{total}} ocorrências",
      en: "Total: {{total}} occurrences",
      es: "Total: {{total}} ocurrencias"
    },
    page: {
      pt: "Página {{current}} de {{total}}",
      en: "Page {{current}} of {{total}}",
      es: "Página {{current}} de {{total}}"
    },
    emptyTitle: {
      pt: "Nenhuma ocorrência encontrada",
      en: "No occurrences found",
      es: "No se encontraron ocurrencias"
    },
    emptyDesc: {
      pt: "Tente ajustar os filtros ou cadastrar uma nova ocorrência.",
      en: "Try adjusting the filters or registering a new occurrence.",
      es: "Intente ajustar los filtros o registrar una nueva ocurrencia."
    },
    about: {
      title: {
        pt: "Sobre Históricos de Ocorrências",
        en: "About Occurrence Histories",
        es: "Acerca del Historial de Ocurrencias"
      },
      desc: {
        pt: "Os códigos de ocorrência são utilizados para padronizar a comunicação com transportadores via EDI (OCOREN 5.0). Cada código representa um tipo de evento que pode ocorrer durante o processo de entrega.",
        en: "Occurrence codes are used to standardize communication with carriers via EDI (OCOREN 5.0). Each code represents a type of event that can occur during the delivery process.",
        es: "Los códigos de ocurrencia se utilizan para estandarizar la comunicación con los transportistas a través de EDI (OCOREN 5.0). Cada código representa un tipo de evento que puede ocurrir durante el proceso de entrega."
      },
      patternTitle: {
        pt: "Padrão OCOREN",
        en: "OCOREN Standard",
        es: "Estándar OCOREN"
      },
      patternDesc: {
        pt: "Compatível com EDI OCOREN 5.0",
        en: "Compatible with EDI OCOREN 5.0",
        es: "Compatible con EDI OCOREN 5.0"
      },
      trackingTitle: {
        pt: "Rastreamento",
        en: "Tracking",
        es: "Rastreo"
      },
      trackingDesc: {
        pt: "Integração com rastreamento",
        en: "Integration with tracking",
        es: "Integración con rastreo"
      },
      standardTitle: {
        pt: "Códigos Padrão",
        en: "Standard Codes",
        es: "Códigos Estándar"
      },
      standardDesc: {
        pt: "Pré-configurados para uso imediato",
        en: "Pre-configured for immediate use",
        es: "Preconfigurados para uso inmediato"
      },
      customTitle: {
        pt: "Personalização",
        en: "Customization",
        es: "Personalización"
      },
      customDesc: {
        pt: "Adicione códigos específicos",
        en: "Add specific codes",
        es: "Agregue códigos específicos"
      }
    },
    card: {
      problem: {
        pt: "Problema",
        en: "Problem",
        es: "Problema"
      },
      delivery: {
        pt: "Entrega",
        en: "Delivery",
        es: "Entrega"
      },
      view: {
        pt: "Visualizar",
        en: "View",
        es: "Ver"
      },
      edit: {
        pt: "Editar",
        en: "Edit",
        es: "Editar"
      },
      delete: {
        pt: "Excluir",
        en: "Delete",
        es: "Eliminar"
      },
      code: {
        pt: "Código",
        en: "Code",
        es: "Código"
      },
      type: {
        pt: "Tipo",
        en: "Type",
        es: "Tipo"
      }
    },
    form: {
      back: {
        pt: "Voltar para Históricos de Ocorrências",
        en: "Back to Occurrences History",
        es: "Volver a Historial de Ocurrencias"
      },
      titleNew: {
        pt: "Nova Ocorrência",
        en: "New Occurrence",
        es: "Nueva Ocurrencia"
      },
      titleEdit: {
        pt: "Editar Ocorrência",
        en: "Edit Occurrence",
        es: "Editar Ocurrencia"
      },
      subtitle: {
        pt: "Preencha os dados da ocorrência",
        en: "Fill in the occurrence data",
        es: "Complete los datos de la ocurrencia"
      },
      infoTitle: {
        pt: "Informações da Ocorrência",
        en: "Occurrence Information",
        es: "Información de la Ocurrencia"
      },
      codeLabel: {
        pt: "Código da Ocorrência *",
        en: "Occurrence Code *",
        es: "Código de Ocurrencia *"
      },
      codePlaceholder: {
        pt: "001",
        en: "001",
        es: "001"
      },
      descLabel: {
        pt: "Descrição da Ocorrência *",
        en: "Occurrence Description *",
        es: "Descripción de Ocurrencia *"
      },
      descPlaceholder: {
        pt: "Digite a descrição da ocorrência",
        en: "Enter the occurrence description",
        es: "Ingrese la descripción de la ocurrencia"
      },
      descCharCount: {
        pt: "Máximo de 100 caracteres. Restantes: {{count}}",
        en: "Maximum 100 characters. Remaining: {{count}}",
        es: "Máximo de 100 caracteres. Restantes: {{count}}"
      },
      codeRequired: {
        pt: "Código é obrigatório",
        en: "Code is required",
        es: "El código es obligatorio"
      },
      codeInvalid: {
        pt: "Código deve ter exatamente 3 dígitos numéricos (ex: 001)",
        en: "Code must have exactly 3 numeric digits (e.g.: 001)",
        es: "El código debe tener exactamente 3 dígitos numéricos (ej: 001)"
      },
      codeExists: {
        pt: "Este código já está sendo usado por outra ocorrência",
        en: "This code is already in use by another occurrence",
        es: "Este código ya está en uso por otra ocurrencia"
      },
      descRequired: {
        pt: "Por favor, informe a descrição da ocorrência.",
        en: "Please enter the occurrence description.",
        es: "Por favor, ingrese la descripción de la ocurrencia."
      },
      descLength: {
        pt: "A descrição deve ter no máximo 100 caracteres.",
        en: "The description must be at most 100 characters.",
        es: "La descripción debe tener un máximo de 100 caracteres."
      },
      aboutCodesTitle: {
        pt: "Sobre Códigos de Ocorrência",
        en: "About Occurrence Codes",
        es: "Sobre los Códigos de Ocurrencia"
      },
      aboutCodesDesc: {
        pt: "Os códigos de ocorrência são utilizados para padronizar a comunicação com transportadores via EDI (OCOREN 5.0). Cada código representa um tipo de evento que pode ocorrer durante o processo de entrega.",
        en: "Occurrence codes are used to standardize communication with carriers via EDI (OCOREN 5.0). Each code represents a type of event that can occur during the delivery process.",
        es: "Los códigos de ocurrencia se utilizan para estandarizar la comunicación con los transportistas a través de EDI (OCOREN 5.0). Cada código representa un tipo de evento que puede ocurrir durante el proceso de entrega."
      },
      codesDeliveryTitle: {
        pt: "Códigos 001-049",
        en: "Codes 001-049",
        es: "Códigos 001-049"
      },
      codesDeliveryDesc: {
        pt: "Ocorrências relacionadas a entregas",
        en: "Occurrences related to deliveries",
        es: "Ocurrencias relacionadas con entregas"
      },
      codesProblemTitle: {
        pt: "Códigos 050-099",
        en: "Codes 050-099",
        es: "Códigos 050-099"
      },
      codesProblemDesc: {
        pt: "Ocorrências relacionadas a problemas",
        en: "Occurrences related to problems",
        es: "Ocurrencias relacionadas a problemas"
      },
      cancel: {
        pt: "Cancelar",
        en: "Cancel",
        es: "Cancelar"
      },
      save: {
        pt: "Salvar Ocorrência",
        en: "Save Occurrence",
        es: "Guardar Ocurrencia"
      },
      update: {
        pt: "Atualizar Ocorrência",
        en: "Update Occurrence",
        es: "Actualizar Ocurrencia"
      },
      sequentialTitle: {
        pt: "Código Sequencial",
        en: "Sequential Code",
        es: "Código Secuencial"
      },
      sequentialDescNew: {
        pt: "Os códigos são gerados automaticamente em sequência numérica começando em 001. Clique no ícone # para gerar o próximo código disponível.",
        en: "Codes are automatically generated in numerical sequence starting at 001. Click the # icon to generate the next available code.",
        es: "Los códigos se generan automáticamente en secuencia numérica a partir de 001. Haga clic en el ícono # para generar el siguiente código disponible."
      },
      sequentialDescEdit: {
        pt: "Os códigos são gerados automaticamente em sequência numérica começando em 001. O código não pode ser alterado após o cadastro.",
        en: "Codes are automatically generated in numerical sequence starting at 001. The code cannot be changed after registration.",
        es: "Los códigos se generan automáticamente en secuencia numérica a partir del 001. El código no se puede modificar después del registro."
      }
    },
    view: {
      back: {
        pt: "Voltar para Históricos de Ocorrências",
        en: "Back to Occurrences History",
        es: "Volver al Historial de Ocurrencias"
      },
      title: {
        pt: "Visualizar Ocorrência",
        en: "View Occurrence",
        es: "Ver Ocurrencia"
      },
      subtitle: {
        pt: "Detalhes do código de ocorrência EDI",
        en: "Details of the EDI occurrence code",
        es: "Detalles del código de ocurrencia EDI"
      },
      edit: {
        pt: "Editar",
        en: "Edit",
        es: "Editar"
      },
      descTitle: {
        pt: "Descrição Completa",
        en: "Full Description",
        es: "Descripción Completa"
      },
      ediTitle: {
        pt: "Informações para EDI",
        en: "EDI Information",
        es: "Información EDI"
      },
      ediCode: {
        pt: "Código para EDI OCOREN",
        en: "Code for EDI OCOREN",
        es: "Código para EDI OCOREN"
      },
      ediFormat: {
        pt: "Formato no Arquivo",
        en: "Format in File",
        es: "Formato en el Archivo"
      },
      auditTitle: {
        pt: "Informações de Auditoria",
        en: "Audit Information",
        es: "Información de Auditoría"
      },
      createdAt: {
        pt: "Data de Criação",
        en: "Creation Date",
        es: "Fecha de Creación"
      },
      createdBy: {
        pt: "Criado por",
        en: "Created By",
        es: "Creado Por"
      },
      updatedAt: {
        pt: "Data da última alteração",
        en: "Last Update Date",
        es: "Fecha de Última Actualización"
      },
      updatedBy: {
        pt: "Última alteração por",
        en: "Last Update By",
        es: "Última Actualización Por"
      },
      userPrefix: {
        pt: "Usuário #{{id}}",
        en: "User #{{id}}",
        es: "Usuario #{{id}}"
      },
      usageTitle: {
        pt: "Utilização no Sistema",
        en: "Usage in the System",
        es: "Uso en el Sistema"
      },
      usageDesc: {
        pt: "Este código de ocorrência é utilizado para interpretar arquivos EDI OCOREN 5.0 recebidos dos transportadores. Quando um transportador envia uma atualização de status via EDI, o sistema utiliza este cadastro para identificar e processar corretamente a ocorrência.",
        en: "This occurrence code is used to interpret EDI OCOREN 5.0 files received from carriers. When a carrier sends a status update via EDI, the system uses this record to identify and process the occurrence correctly.",
        es: "Este código de ocurrencia se utiliza para interpretar los archivos EDI OCOREN 5.0 recibidos de los transportistas. Cuando un transportista envía una actualización de estado a través de EDI, el sistema utiliza este registro para identificar y procesar correctamente la ocurrencia."
      },
      integrationTitle: {
        pt: "Integração EDI",
        en: "EDI Integration",
        es: "Integración EDI"
      },
      integrationDesc: {
        pt: "Utilizado na leitura de arquivos OCOREN",
        en: "Used in reading OCOREN files",
        es: "Utilizado en la lectura de archivos OCOREN"
      },
      trackingTitle: {
        pt: "Rastreamento",
        en: "Tracking",
        es: "Rastreo"
      },
      trackingDesc: {
        pt: "Exibido no histórico de entregas",
        en: "Displayed in the delivery history",
        es: "Mostrado en el historial de entregas"
      },
      problem: {
        pt: "Problema",
        en: "Problem",
        es: "Problema"
      },
      delivery: {
        pt: "Entrega",
        en: "Delivery",
        es: "Entrega"
      },
      codeLabel: {
        pt: "Código",
        en: "Code",
        es: "Código"
      },
      typeLabel: {
        pt: "Tipo",
        en: "Type",
        es: "Tipo"
      }
    },
    messages: {
      loadError: {
        pt: "Erro ao carregar ocorrências.",
        en: "Error loading occurrences.",
        es: "Error al cargar las ocurrencias."
      },
      deleteSuccess: {
        pt: "Histórico de ocorrência excluído com sucesso!",
        en: "Occurrence history successfully deleted!",
        es: "¡Historial de ocurrencia eliminado con éxito!"
      },
      deleteError: {
        pt: "Erro ao excluir histórico de ocorrência.",
        en: "Error deleting occurrence history.",
        es: "Error al eliminar el historial de ocurrencia."
      },
      updateSuccess: {
        pt: "Histórico de ocorrência atualizado com sucesso!",
        en: "Occurrence history successfully updated!",
        es: "¡Historial de ocurrencia actualizado con éxito!"
      },
      updateError: {
        pt: "Erro ao atualizar histórico de ocorrência.",
        en: "Error updating occurrence history.",
        es: "Error al actualizar el historial de ocurrencia."
      },
      createSuccess: {
        pt: "Histórico de ocorrência criado com sucesso!",
        en: "Occurrence history effectively created!",
        es: "¡Historial de ocurrencia creado con éxito!"
      },
      saveError: {
        pt: "Erro ao salvar histórico de ocorrência. Tente novamente.",
        en: "Error saving occurrence history. Please try again.",
        es: "Error al guardar el historial de ocurrencia. Inténtelo de nuevo."
      },
      confirmDeleteTitle: {
        pt: "Confirmar Exclusão",
        en: "Confirm Deletion",
        es: "Confirmar Eliminación"
      },
      confirmDeleteMessage: {
        pt: "Tem certeza que deseja excluir este histórico de ocorrência? Esta ação não pode ser desfeita.",
        en: "Are you sure you want to delete this occurrence history? This action cannot be undone.",
        es: "¿Está seguro de que desea eliminar este historial de ocurrencia? Esta acción no se puede deshacer."
      },
      confirmDeleteBtn: {
        pt: "Excluir",
        en: "Delete",
        es: "Eliminar"
      },
      cancelBtn: {
        pt: "Cancelar",
        en: "Cancel",
        es: "Cancelar"
      },
      pagination: {
        pt: "Mostrando {{start}} a {{end}} de {{total}} ocorrências",
        en: "Showing {{start}} to {{end}} of {{total}} occurrences",
        es: "Mostrando {{start}} a {{end}} de {{total}} ocurrencias"
      },
      prev: {
        pt: "Anterior",
        en: "Previous",
        es: "Anterior"
      },
      next: {
        pt: "Próximo",
        en: "Next",
        es: "Siguiente"
      }
    }
  }
};

languages.forEach(lang => {
  const filePath = path.join(localesDir, lang, 'translation.json');
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  let d = JSON.parse(content);

  // Initialize if empty
  if (!d.occurrences) d.occurrences = {};
  
  // Recursively fill keys
  function fillTranslations(sourceObj, targetObj) {
    for (const key in sourceObj) {
      if (typeof sourceObj[key] === 'object' && sourceObj[key][lang] !== undefined) {
        targetObj[key] = sourceObj[key][lang];
      } else if (typeof sourceObj[key] === 'object') {
        if (!targetObj[key]) targetObj[key] = {};
        fillTranslations(sourceObj[key], targetObj[key]);
      }
    }
  }

  fillTranslations(translations.occurrences, d.occurrences);

  fs.writeFileSync(filePath, JSON.stringify(d, null, 2), 'utf8');
  console.log(`Updated ${lang}/translation.json successfully`);
});
