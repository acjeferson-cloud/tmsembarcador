const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');
const languages = ['pt', 'en', 'es'];

const translations = {
  holidays: {
    breadcrumb: {
      pt: "Configurações",
      en: "Settings",
      es: "Configuración"
    },
    title: {
      pt: "Feriados",
      en: "Holidays",
      es: "Días Festivos"
    },
    subtitle: {
      pt: "Gerencie feriados nacionais, estaduais e municipais",
      en: "Manage national, state, and municipal holidays",
      es: "Administre días festivos nacionales, estatales y municipales"
    },
    searchPlaceholder: {
      pt: "Buscar feriado...",
      en: "Search holiday...",
      es: "Buscar día festivo..."
    },
    types: {
      all: {
        pt: "Todos os tipos",
        en: "All types",
        es: "Todos los tipos"
      },
      nacional: {
        pt: "Nacional",
        en: "National",
        es: "Nacional"
      },
      estadual: {
        pt: "Estadual",
        en: "State",
        es: "Estatal"
      },
      municipal: {
        pt: "Municipal",
        en: "Municipal",
        es: "Municipal"
      }
    },
    boards: {
      nacional: {
        pt: "Feriados Nacionais",
        en: "National Holidays",
        es: "Días Festivos Nacionales"
      },
      estadual: {
        pt: "Feriados Estaduais",
        en: "State Holidays",
        es: "Días Festivos Estatales"
      },
      municipal: {
        pt: "Feriados Municipais",
        en: "Municipal Holidays",
        es: "Días Festivos Municipales"
      }
    },
    emptyStates: {
      nacional: {
        pt: "Nenhum feriado nacional cadastrado",
        en: "No national holidays registered",
        es: "No hay días festivos nacionales registrados"
      },
      estadual: {
        pt: "Nenhum feriado estadual cadastrado",
        en: "No state holidays registered",
        es: "No hay días festivos estatales registrados"
      },
      municipal: {
        pt: "Nenhum feriado municipal cadastrado",
        en: "No municipal holidays registered",
        es: "No hay días festivos municipales registrados"
      }
    },
    card: {
      recurring: {
        pt: "Recorrente",
        en: "Recurring",
        es: "Recurrente"
      }
    },
    messages: {
      loading: {
        pt: "Carregando...",
        en: "Loading...",
        es: "Cargando..."
      },
      loadError: {
        pt: "Erro ao carregar feriados.",
        en: "Error loading holidays.",
        es: "Error al cargar los días festivos."
      },
      deleteSuccess: {
        pt: "Feriado excluído com sucesso!",
        en: "Holiday successfully deleted!",
        es: "¡Día festivo eliminado con éxito!"
      },
      deleteError: {
        pt: "Erro ao excluir feriado.",
        en: "Error deleting holiday.",
        es: "Error al eliminar el día festivo."
      },
      saveSuccess: {
        pt: "Feriado salvo com sucesso!",
        en: "Holiday effectively saved!",
        es: "¡Día festivo guardado con éxito!"
      },
      saveError: {
        pt: "Erro ao salvar feriado. Tente novamente.",
        en: "Error saving holiday. Please try again.",
        es: "Error al guardar el día festivo. Inténtelo de nuevo."
      },
      confirmDeleteTitle: {
        pt: "Confirmar Exclusão",
        en: "Confirm Deletion",
        es: "Confirmar Eliminación"
      },
      confirmDeleteMessage: {
        pt: "Tem certeza que deseja excluir este feriado? Esta ação não pode ser desfeita.",
        en: "Are you sure you want to delete this holiday? This action cannot be undone.",
        es: "¿Está seguro de que desea eliminar este día festivo? Esta acción no se puede deshacer."
      }
    },
    form: {
      newTitle: {
        pt: "Novo Feriado",
        en: "New Holiday",
        es: "Nuevo Día Festivo"
      },
      editTitle: {
        pt: "Editar Feriado",
        en: "Edit Holiday",
        es: "Editar Día Festivo"
      },
      nameLabel: {
        pt: "Nome do Feriado *",
        en: "Holiday Name *",
        es: "Nombre del Día Festivo *"
      },
      namePlaceholder: {
        pt: "Ex: Dia da Padroeira",
        en: "Ex: Patron Saint's Day",
        es: "Ej: Día de la Patrona"
      },
      dateLabel: {
        pt: "Data *",
        en: "Date *",
        es: "Fecha *"
      },
      typeLabel: {
        pt: "Tipo *",
        en: "Type *",
        es: "Tipo *"
      },
      recurringLabel: {
        pt: "Feriado recorrente (repete todo ano)",
        en: "Recurring holiday (repeats every year)",
        es: "Día festivo recurrente (se repite cada año)"
      },
      countryLabel: {
        pt: "País *",
        en: "Country *",
        es: "País *"
      },
      stateLabel: {
        pt: "Estado *",
        en: "State *",
        es: "Estado *"
      },
      cityLabel: {
        pt: "Cidade *",
        en: "City *",
        es: "Ciudad *"
      },
      selectPlaceholder: {
        pt: "Selecione...",
        en: "Select...",
        es: "Seleccione..."
      },
      stateRequired: {
        pt: "Selecione um estado primeiro",
        en: "Select a state first",
        es: "Seleccione un estado primero"
      },
      cancel: {
        pt: "Cancelar",
        en: "Cancel",
        es: "Cancelar"
      },
      save: {
        pt: "Salvar",
        en: "Save",
        es: "Guardar"
      },
      saving: {
        pt: "Salvando...",
        en: "Saving...",
        es: "Guardando..."
      },
      validations: {
        nameRequired: {
          pt: "Nome do feriado é obrigatório",
          en: "Holiday name is required",
          es: "El nombre del día festivo es obligatorio"
        },
        dateRequired: {
          pt: "Data é obrigatória",
          en: "Date is required",
          es: "La fecha es obligatoria"
        },
        countryRequired: {
          pt: "País é obrigatório",
          en: "Country is required",
          es: "El país es obligatorio"
        },
        stateRequiredForStateMsg: {
          pt: "Estado é obrigatório para feriados estaduais",
          en: "State is required for state holidays",
          es: "El estado es obligatorio para los días festivos estatales"
        },
        cityRequiredForCityMsg: {
          pt: "Cidade é obrigatória para feriados municipais",
          en: "City is required for municipal holidays",
          es: "La ciudad es obligatoria para los días festivos municipales"
        }
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
  if (!d.holidays) d.holidays = {};
  
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

  fillTranslations(translations.holidays, d.holidays);

  fs.writeFileSync(filePath, JSON.stringify(d, null, 2), 'utf8');
  console.log(`Updated ${lang}/translation.json successfully`);
});
