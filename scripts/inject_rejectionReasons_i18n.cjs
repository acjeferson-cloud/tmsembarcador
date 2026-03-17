const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');
const languages = ['pt', 'en', 'es'];

const translations = {
  rejectionReasons: {
    breadcrumb: {
      pt: "Configurações",
      en: "Settings",
      es: "Configuración"
    },
    title: {
      pt: "Motivos de Rejeições de Documentos",
      en: "Document Rejection Reasons",
      es: "Motivos de Rechazo de Documentos"
    },
    subtitle: {
      pt: "Gerencie os motivos de rejeição para conferência eletrônica de documentos",
      en: "Manage rejection reasons for electronic document conference",
      es: "Administre los motivos de rechazo para la conferencia electrónica de documentos"
    },
    newReasonBtn: {
      pt: "Novo Motivo",
      en: "New Reason",
      es: "Nuevo Motivo"
    },
    stats: {
      total: {
        pt: "Total de Motivos",
        en: "Total Reasons",
        es: "Total de Motivos"
      },
      active: {
        pt: "Motivos Ativos",
        en: "Active Reasons",
        es: "Motivos Activos"
      },
      inactive: {
        pt: "Motivos Inativos",
        en: "Inactive Reasons",
        es: "Motivos Inactivos"
      },
      distribution: {
        pt: "Distribuição por Categoria",
        en: "Distribution by Category",
        es: "Distribución por Categoría"
      }
    },
    filters: {
      searchPlaceholder: {
        pt: "Buscar por código, categoria ou descrição...",
        en: "Search by code, category or description...",
        es: "Buscar por código, categoría o descripción..."
      },
      statusAll: {
        pt: "Todos os Status",
        en: "All Statuses",
        es: "Todos los Estados"
      },
      statusActive: {
        pt: "Somente Ativos",
        en: "Only Active",
        es: "Solo Activos"
      },
      statusInactive: {
        pt: "Somente Inativos",
        en: "Only Inactive",
        es: "Solo Inactivos"
      },
      exportBtn: {
        pt: "Exportar",
        en: "Export",
        es: "Exportar"
      }
    },
    pagination: {
      total: {
        pt: "Total: {{count}} motivos",
        en: "Total: {{count}} reasons",
        es: "Total: {{count}} motivos"
      },
      page: {
        pt: "Página {{current}} de {{total}}",
        en: "Page {{current}} of {{total}}",
        es: "Página {{current}} de {{total}}"
      },
      showing: {
        pt: "Mostrando {{start}} a {{end}} de {{total}} motivos",
        en: "Showing {{start}} to {{end}} of {{total}} reasons",
        es: "Mostrando {{start}} a {{end}} de {{total}} motivos"
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
    },
    emptyState: {
      title: {
        pt: "Nenhum motivo de rejeição encontrado",
        en: "No rejection reason found",
        es: "No se encontró ningún motivo de rechazo"
      },
      description: {
        pt: "Tente ajustar os filtros ou cadastrar um novo motivo de rejeição.",
        en: "Try adjusting the filters or registering a new rejection reason.",
        es: "Intente ajustar los filtros o registrar un nuevo motivo de rechazo."
      }
    },
    infoBox: {
      title: {
        pt: "Sobre Motivos de Rejeição",
        en: "About Rejection Reasons",
        es: "Acerca de los Motivos de Rechazo"
      },
      description1: {
        pt: "Os motivos de rejeição são utilizados para padronizar o processo de conferência eletrônica de documentos fiscais.",
        en: "Rejection reasons are used to standardize the electronic conference process of tax documents.",
        es: "Los motivos de rechazo se utilizan para estandarizar el proceso de conferencia electrónica de documentos fiscales."
      },
      description2: {
        pt: "Quando uma inconsistência é identificada, o sistema associa um motivo padronizado de rejeição ao documento.",
        en: "When an inconsistency is identified, the system associates a standardized rejection reason to the document.",
        es: "Cuando se identifica una inconsistencia, el sistema asocia un motivo de rechazo estandarizado al documento."
      },
      description3: {
        pt: "Este motivo de rejeição é utilizado no processo de conferência eletrônica de documentos fiscais. Quando uma inconsistência é identificada, o sistema associa este motivo padronizado ao documento, facilitando a comunicação com o transportador e a geração de relatórios.",
        en: "This rejection reason is used in the electronic tax document conference process. When an inconsistency is identified, the system associates this standardized reason with the document, facilitating communication with the carrier and report generation.",
        es: "Este motivo de rechazo se utiliza en el proceso de conferencia electrónica de documentos fiscales. Cuando se identifica una inconsistencia, el sistema asocia este motivo estandarizado al documento, facilitando la comunicación con el transportista y la generación de informes."
      },
      features: {
        audit: {
          title: {
            pt: "Auditoria Automática",
            en: "Automatic Audit",
            es: "Auditoría Automática"
          },
          desc: {
            pt: "Validação de CT-es e Faturas",
            en: "Validation of CT-es and Invoices",
            es: "Validación de CT-es y Facturas"
          }
        },
        conciliation: {
          title: {
            pt: "Conciliação",
            en: "Conciliation",
            es: "Conciliación"
          },
          desc: {
            pt: "Processo de conciliação de fretes",
            en: "Freight conciliation process",
            es: "Proceso de conciliación de fletes"
          }
        },
        notifications: {
          title: {
            pt: "Notificações",
            en: "Notifications",
            es: "Notificaciones"
          },
          desc: {
            pt: "Alertas para transportadores",
            en: "Alerts for carriers",
            es: "Alertas para transportistas"
          }
        },
        categorization: {
          title: {
            pt: "Categorização",
            en: "Categorization",
            es: "Categorización"
          },
          desc: {
            pt: "Agrupamento por tipo de problema",
            en: "Grouping by problem type",
            es: "Agrupación por tipo de problema"
          }
        }
      }
    },
    messages: {
      loadError: {
        pt: "Erro ao carregar dados.",
        en: "Error loading data.",
        es: "Error al cargar los datos."
      },
      deleteSuccess: {
        pt: "Motivo de rejeição excluído com sucesso!",
        en: "Rejection reason successfully deleted!",
        es: "¡Motivo de rechazo eliminado con éxito!"
      },
      deleteError: {
        pt: "Erro ao excluir motivo de rejeição.",
        en: "Error deleting rejection reason.",
        es: "Error al eliminar el motivo de rechazo."
      },
      updateSuccess: {
        pt: "Motivo de rejeição atualizado com sucesso!",
        en: "Rejection reason successfully updated!",
        es: "¡Motivo de rechazo actualizado con éxito!"
      },
      updateError: {
        pt: "Erro ao atualizar motivo de rejeição.",
        en: "Error updating rejection reason.",
        es: "Error al actualizar el motivo de rechazo."
      },
      createSuccess: {
        pt: "Motivo de rejeição criado com sucesso!",
        en: "Rejection reason successfully created!",
        es: "¡Motivo de rechazo creado con éxito!"
      },
      saveError: {
        pt: "Erro ao salvar motivo de rejeição. Tente novamente.",
        en: "Error saving rejection reason. Please try again.",
        es: "Error al guardar el motivo de rechazo. Inténtelo de nuevo."
      },
      confirmDeleteTitle: {
        pt: "Confirmar Exclusão",
        en: "Confirm Deletion",
        es: "Confirmar Eliminación"
      },
      confirmDeleteMessage: {
        pt: "Tem certeza que deseja excluir este motivo de rejeição? Esta ação não pode ser desfeita.",
        en: "Are you sure you want to delete this rejection reason? This action cannot be undone.",
        es: "¿Está seguro de que desea eliminar este motivo de rechazo? Esta acción no se puede deshacer."
      },
      deleteConfirmBtn: {
        pt: "Excluir",
        en: "Delete",
        es: "Eliminar"
      },
      cancelBtn: {
        pt: "Cancelar",
        en: "Cancel",
        es: "Cancelar"
      }
    },
    form: {
      backBtn: {
        pt: "Voltar para Motivos de Rejeições",
        en: "Back to Rejection Reasons",
        es: "Volver a Motivos de Rechazo"
      },
      newTitle: {
        pt: "Novo Motivo de Rejeição",
        en: "New Rejection Reason",
        es: "Nuevo Motivo de Rechazo"
      },
      editTitle: {
        pt: "Editar Motivo de Rejeição",
        en: "Edit Rejection Reason",
        es: "Editar Motivo de Rechazo"
      },
      subtitle: {
        pt: "Preencha os dados do motivo de rejeição de documentos",
        en: "Fill in the details for the document rejection reason",
        es: "Complete los datos del motivo de rechazo de documentos"
      },
      infoSection: {
        title: {
          pt: "Informações do Motivo",
          en: "Reason Information",
          es: "Información del Motivo"
        }
      },
      codeLabel: {
        pt: "Código do Motivo *",
        en: "Reason Code *",
        es: "Código del Motivo *"
      },
      generateCodeTooltip: {
        pt: "Gerar próximo código",
        en: "Generate next code",
        es: "Generar siguiente código"
      },
      codeGuideTitle: {
        pt: "Código Sequencial",
        en: "Sequential Code",
        es: "Código Secuencial"
      },
      codeGuideNew: {
        pt: "Os códigos são gerados automaticamente em sequência numérica começando em 001. Clique no ícone # para gerar o próximo código disponível.",
        en: "Codes are automatically generated in numerical sequence starting from 001. Click the # icon to generate the next available code.",
        es: "Los códigos se generan automáticamente en secuencia numérica a partir de 001. Haga clic en el ícono # para generar el siguiente código disponible."
      },
      codeGuideEdit: {
        pt: "Os códigos são gerados automaticamente em sequência numérica começando em 001. O código não pode ser alterado após o cadastro.",
        en: "Codes are automatically generated in numerical sequence starting from 001. The code cannot be changed after registration.",
        es: "Los códigos se generan automáticamente en secuencia numérica a partir de 001. El código no se puede modificar tras el registro."
      },
      categoryLabel: {
        pt: "Categoria da Inconsistência *",
        en: "Inconsistency Category *",
        es: "Categoría de la Inconsistencia *"
      },
      newCategoryPlaceholder: {
        pt: "Nova categoria",
        en: "New category",
        es: "Nueva categoría"
      },
      addBtn: {
        pt: "Adicionar",
        en: "Add",
        es: "Añadir"
      },
      categoryGuideTitle: {
        pt: "Categorias",
        en: "Categories",
        es: "Categorías"
      },
      categoryGuideDesc: {
        pt: "As categorias ajudam a agrupar os motivos de rejeição por tipo de problema, facilitando a análise e geração de relatórios.",
        en: "Categories help group rejection reasons by problem type, making analysis and reporting easier.",
        es: "Las categorías ayudan a agrupar los motivos de rechazo por tipo de problema, facilitando el análisis y la generación de informes."
      },
      descriptionLabel: {
        pt: "Descrição da Rejeição *",
        en: "Rejection Description *",
        es: "Descripción del Rechazo *"
      },
      descriptionPlaceholder: {
        pt: "Digite a descrição detalhada do motivo de rejeição",
        en: "Enter the detailed description of the rejection reason",
        es: "Escriba la descripción detallada del motivo de rechazo"
      },
      descriptionLimit: {
        pt: "Máximo de 200 caracteres. Restantes: {{count}}",
        en: "Maximum 200 characters. Remaining: {{count}}",
        es: "Máximo 200 caracteres. Restantes: {{count}}"
      },
      activeLabel: {
        pt: "Ativo",
        en: "Active",
        es: "Activo"
      },
      activeDesc: {
        pt: "Motivos inativos não serão exibidos nas integrações e telas de validação.",
        en: "Inactive reasons will not be displayed in integrations and validation screens.",
        es: "Los motivos inactivos no se mostrarán en integraciones ni en las pantallas de validación."
      },
      cancelBtn: {
        pt: "Cancelar",
        en: "Cancel",
        es: "Cancelar"
      },
      saveBtn: {
        pt: "Salvar Motivo",
        en: "Save Reason",
        es: "Guardar Motivo"
      },
      updateBtn: {
        pt: "Atualizar Motivo",
        en: "Update Reason",
        es: "Actualizar Motivo"
      },
      validations: {
        codeRequired: {
          pt: "Código é obrigatório",
          en: "Code is required",
          es: "El código es obligatorio"
        },
        codeFormat: {
          pt: "Código deve ter exatamente 3 dígitos numéricos (ex: 001)",
          en: "Code must have exactly 3 numeric digits (e.g. 001)",
          es: "El código debe tener exactamente 3 dígitos numéricos (ej: 001)"
        },
        codeUnique: {
          pt: "Este código já está sendo usado por outro motivo de rejeição",
          en: "This code is already being used by another rejection reason",
          es: "Este código ya está siendo utilizado por otro motivo de rechazo"
        },
        newCategoryRequired: {
          pt: "Por favor, informe o nome da nova categoria.",
          en: "Please enter the name of the new category.",
          es: "Por favor, introduzca el nombre de la nueva categoría."
        },
        descriptionRequired: {
          pt: "Por favor, informe a descrição do motivo de rejeição.",
          en: "Please provide the description of the rejection reason.",
          es: "Por favor, proporcione la descripción del motivo de rechazo."
        },
        descriptionMaxLength: {
          pt: "A descrição deve ter no máximo 200 caracteres.",
          en: "The description must have a maximum of 200 characters.",
          es: "La descripción debe tener un máximo de 200 caracteres."
        },
        categoryRequired: {
          pt: "Por favor, selecione ou informe uma categoria.",
          en: "Please select or inform a category.",
          es: "Por favor, seleccione o informe una categoría."
        }
      }
    },
    view: {
      title: {
        pt: "Visualizar Motivo de Rejeição",
        en: "View Rejection Reason",
        es: "Ver Motivo de Rechazo"
      },
      subtitle: {
        pt: "Detalhes completos do motivo de rejeição",
        en: "Complete details of the rejection reason",
        es: "Detalles completos del motivo de rechazo"
      },
      editBtn: {
        pt: "Editar",
        en: "Edit",
        es: "Editar"
      },
      statusActive: {
        pt: "Ativo",
        en: "Active",
        es: "Activo"
      },
      statusInactive: {
        pt: "Inativo",
        en: "Inactive",
        es: "Inactivo"
      },
      codeLabel: {
        pt: "Código",
        en: "Code",
        es: "Código"
      },
      statusLabel: {
        pt: "Status",
        en: "Status",
        es: "Estado"
      },
      categoryTitle: {
        pt: "Categoria",
        en: "Category",
        es: "Categoría"
      },
      descriptionTitle: {
        pt: "Descrição Completa",
        en: "Full Description",
        es: "Descripción Completa"
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
        en: "Created by",
        es: "Creado por"
      },
      updatedAt: {
        pt: "Data da última alteração",
        en: "Last update date",
        es: "Fecha de la última modificación"
      },
      updatedBy: {
        pt: "Última alteração por",
        en: "Last edit by",
        es: "Última modificación por"
      },
      userPrefix: {
        pt: "Usuário #{{id}}",
        en: "User #{{id}}",
        es: "Usuario #{{id}}"
      },
      usageTitle: {
        pt: "Utilização no Sistema",
        en: "System Usage",
        es: "Uso en el Sistema"
      }
    },
    card: {
      viewTooltip: {
        pt: "Visualizar",
        en: "View",
        es: "Ver"
      },
      editTooltip: {
        pt: "Editar",
        en: "Edit",
        es: "Editar"
      },
      deleteTooltip: {
        pt: "Excluir",
        en: "Delete",
        es: "Eliminar"
      },
      codePrefix: {
        pt: "Código:",
        en: "Code:",
        es: "Código:"
      },
      statusPrefix: {
        pt: "Status:",
        en: "Status:",
        es: "Estado:"
      },
      statusActive: {
        pt: "Ativo",
        en: "Active",
        es: "Activo"
      },
      statusInactive: {
        pt: "Inativo",
        en: "Inactive",
        es: "Inactivo"
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
  if (!d.rejectionReasons) d.rejectionReasons = {};
  
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

  fillTranslations(translations.rejectionReasons, d.rejectionReasons);

  fs.writeFileSync(filePath, JSON.stringify(d, null, 2), 'utf8');
  console.log(`Updated ${lang}/translation.json successfully`);
});
