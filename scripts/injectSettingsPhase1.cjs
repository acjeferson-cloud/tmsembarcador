const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'src', 'locales');

const settingsTranslations = {
  pt: {
    countries: {
      title: "Países",
      subtitle: "Gerenciamento de países",
      searchPlaceholder: "Buscar país...",
      continentFilter: "Continente",
      allContinents: "Todos",
      continents: {
        northAmerica: "América do Norte",
        southAmerica: "América do Sul",
        centralAmerica: "América Central",
        europe: "Europa",
        asia: "Ásia",
        africa: "África",
        oceania: "Oceania",
        caribbean: "Caribe"
      },
      actions: {
        new: "Novo País",
        export: "Exportar CSV",
        back: "Voltar",
        save: "Salvar",
        edit: "Editar",
        delete: "Excluir",
        view: "Visualizar",
        cancel: "Cancelar"
      },
      messages: {
        loadError: "Erro ao carregar países.",
        deleteSuccess: "País excluído com sucesso!",
        deleteError: "Erro ao excluir país.",
        updateSuccess: "País atualizado com sucesso!",
        updateError: "Erro ao atualizar país.",
        createSuccess: "País criado com sucesso!",
        createError: "Erro ao salvar país. Tente novamente."
      },
      form: {
        code: "Código",
        name: "Nome",
        continent: "Continente",
        capital: "Capital",
        language: "Idioma",
        bacenCode: "Código BACEN",
        flag: "Bandeira (URL ou Emoji)"
      },
      deleteConfirm: {
        title: "Confirmar Exclusão",
        message: "Tem certeza que deseja excluir este país? Esta ação não pode ser desfeita."
      }
    },
    cities: {
      title: "Cidades",
      subtitle: "Gerenciamento de cidades",
      searchPlaceholder: "Buscar por nome...",
      stateFilter: "Selecione o Estado",
      regionFilter: "Selecione a Região",
      typeFilter: "Tipo de Cidade",
      allStates: "Todos os Estados",
      allRegions: "Todas as Regiões",
      allTypes: "Todos os Tipos",
      actions: {
        new: "Nova Cidade",
        syncCorreios: "Sincronizar Correios",
        importAlagoas: "Importar Alagoas",
        export: "Exportar CSV",
        back: "Voltar",
        save: "Salvar",
        edit: "Editar",
        delete: "Excluir",
        view: "Visualizar"
      },
      messages: {
        loadError: "Erro ao carregar cidades. Tente novamente.",
        deleteSuccess: "Cidade excluída com sucesso!",
        deleteError: "Erro ao excluir cidade. Tente novamente.",
        saveSuccess: "Cidade salva com sucesso!",
        syncStart: "Sincronização com API dos Correios iniciada com sucesso! Este processo pode levar alguns minutos para ser concluído.",
        syncError: "Erro ao sincronizar com API dos Correios. Tente novamente.",
        importSuccess: "Importação concluída! {{count}} cidades importadas com sucesso.",
        importError: "Erro ao importar cidades. Tente novamente."
      },
      form: {
        name: "Nome da Cidade",
        state: "Estado",
        ibgeCode: "Código IBGE",
        type: "Tipo",
        region: "Região"
      },
      deleteConfirm: {
        title: "Confirmar Exclusão",
        message: "Tem certeza que deseja excluir esta cidade? Esta ação não pode ser desfeita."
      }
    },
    holidays: {
      title: "Cadastro de Feriados",
      subtitle: "Gerencie feriados nacionais, estaduais e municipais",
      searchPlaceholder: "Buscar feriado...",
      types: {
        all: "Todos os tipos",
        national: "Nacional",
        state: "Estadual",
        municipal: "Municipal"
      },
      groups: {
        national: "Feriados Nacionais",
        state: "Feriados Estaduais",
        municipal: "Feriados Municipais"
      },
      empty: {
        national: "Nenhum feriado nacional cadastrado",
        state: "Nenhum feriado estadual cadastrado",
        municipal: "Nenhum feriado municipal cadastrado"
      },
      badges: {
        recurring: "Recorrente"
      },
      actions: {
        new: "Novo Feriado",
        newNational: "Novo Feriado Nacional",
        newState: "Novo Feriado Estadual",
        newMunicipal: "Novo Feriado Municipal",
        edit: "Editar",
        delete: "Excluir",
        save: "Salvar",
        cancel: "Cancelar",
        back: "Voltar"
      },
      messages: {
        loadError: "Erro ao carregar feriados.",
        deleteSuccess: "Feriado excluído com sucesso!",
        deleteError: "Erro ao excluir feriado.",
        saveSuccess: "Feriado salvo com sucesso!",
        saveError: "Erro ao salvar feriado."
      },
      form: {
        name: "Nome do Feriado",
        date: "Data",
        type: "Tipo (Nacional/Estadual/Municipal)",
        isRecurring: "Feriado Recorrente (Anual)",
        stateId: "Estado",
        cityId: "Cidade"
      },
      deleteConfirm: {
        title: "Confirmar Exclusão",
        message: "Tem certeza que deseja excluir este feriado?"
      }
    }
  },
  en: {
    countries: {
      title: "Countries",
      subtitle: "Country management",
      searchPlaceholder: "Search country...",
      continentFilter: "Continent",
      allContinents: "All",
      continents: {
        northAmerica: "North America",
        southAmerica: "South America",
        centralAmerica: "Central America",
        europe: "Europe",
        asia: "Asia",
        africa: "Africa",
        oceania: "Oceania",
        caribbean: "Caribbean"
      },
      actions: {
        new: "New Country",
        export: "Export CSV",
        back: "Back",
        save: "Save",
        edit: "Edit",
        delete: "Delete",
        view: "View",
        cancel: "Cancel"
      },
      messages: {
        loadError: "Error loading countries.",
        deleteSuccess: "Country deleted successfully!",
        deleteError: "Error deleting country.",
        updateSuccess: "Country updated successfully!",
        updateError: "Error updating country.",
        createSuccess: "Country created successfully!",
        createError: "Error saving country. Try again."
      },
      form: {
        code: "Code",
        name: "Name",
        continent: "Continent",
        capital: "Capital",
        language: "Language",
        bacenCode: "BACEN Code",
        flag: "Flag (URL or Emoji)"
      },
      deleteConfirm: {
        title: "Confirm Deletion",
        message: "Are you sure you want to delete this country? This action cannot be undone."
      }
    },
    cities: {
      title: "Cities",
      subtitle: "City management",
      searchPlaceholder: "Search by name...",
      stateFilter: "Select State",
      regionFilter: "Select Region",
      typeFilter: "City Type",
      allStates: "All States",
      allRegions: "All Regions",
      allTypes: "All Types",
      actions: {
        new: "New City",
        syncCorreios: "Sync Correios",
        importAlagoas: "Import Alagoas",
        export: "Export CSV",
        back: "Back",
        save: "Save",
        edit: "Edit",
        delete: "Delete",
        view: "View"
      },
      messages: {
        loadError: "Error loading cities. Try again.",
        deleteSuccess: "City deleted successfully!",
        deleteError: "Error deleting city. Try again.",
        saveSuccess: "City saved successfully!",
        syncStart: "Sync with Correios API started successfully! This process may take a few minutes to complete.",
        syncError: "Error syncing with Correios API. Try again.",
        importSuccess: "Import complete! {{count}} cities imported successfully.",
        importError: "Error importing cities. Try again."
      },
      form: {
        name: "City Name",
        state: "State",
        ibgeCode: "IBGE Code",
        type: "Type",
        region: "Region"
      },
      deleteConfirm: {
        title: "Confirm Deletion",
        message: "Are you sure you want to delete this city? This action cannot be undone."
      }
    },
    holidays: {
      title: "Holidays Registration",
      subtitle: "Manage national, state and municipal holidays",
      searchPlaceholder: "Search holiday...",
      types: {
        all: "All types",
        national: "National",
        state: "State",
        municipal: "Municipal"
      },
      groups: {
        national: "National Holidays",
        state: "State Holidays",
        municipal: "Municipal Holidays"
      },
      empty: {
        national: "No national holidays registered",
        state: "No state holidays registered",
        municipal: "No municipal holidays registered"
      },
      badges: {
        recurring: "Recurring"
      },
      actions: {
        new: "New Holiday",
        newNational: "New National Holiday",
        newState: "New State Holiday",
        newMunicipal: "New Municipal Holiday",
        edit: "Edit",
        delete: "Delete",
        save: "Save",
        cancel: "Cancel",
        back: "Back"
      },
      messages: {
        loadError: "Error loading holidays.",
        deleteSuccess: "Holiday deleted successfully!",
        deleteError: "Error deleting holiday.",
        saveSuccess: "Holiday saved successfully!",
        saveError: "Error saving holiday."
      },
      form: {
        name: "Holiday Name",
        date: "Date",
        type: "Type (National/State/Municipal)",
        isRecurring: "Recurring Holiday (Yearly)",
        stateId: "State",
        cityId: "City"
      },
      deleteConfirm: {
        title: "Confirm Deletion",
        message: "Are you sure you want to delete this holiday?"
      }
    }
  },
  es: {
    countries: {
      title: "Países",
      subtitle: "Gestión de países",
      searchPlaceholder: "Buscar país...",
      continentFilter: "Continente",
      allContinents: "Todos",
      continents: {
        northAmerica: "América del Norte",
        southAmerica: "América del Sur",
        centralAmerica: "América Central",
        europe: "Europa",
        asia: "Asia",
        africa: "África",
        oceania: "Oceanía",
        caribbean: "Caribe"
      },
      actions: {
        new: "Nuevo País",
        export: "Exportar CSV",
        back: "Volver",
        save: "Guardar",
        edit: "Editar",
        delete: "Eliminar",
        view: "Ver",
        cancel: "Cancelar"
      },
      messages: {
        loadError: "Error al cargar los países.",
        deleteSuccess: "¡País eliminado con éxito!",
        deleteError: "Error al eliminar país.",
        updateSuccess: "¡País actualizado con éxito!",
        updateError: "Error al actualizar país.",
        createSuccess: "¡País creado con éxito!",
        createError: "Error al guardar país. Inténtelo de nuevo."
      },
      form: {
        code: "Código",
        name: "Nombre",
        continent: "Continente",
        capital: "Capital",
        language: "Idioma",
        bacenCode: "Código BACEN",
        flag: "Bandera (URL o Emoji)"
      },
      deleteConfirm: {
        title: "Confirmar Eliminación",
        message: "¿Está seguro de que desea eliminar este país? Esta acción no se puede deshacer."
      }
    },
    cities: {
      title: "Ciudades",
      subtitle: "Gestión de ciudades",
      searchPlaceholder: "Buscar por nombre...",
      stateFilter: "Seleccione el Estado",
      regionFilter: "Seleccione la Región",
      typeFilter: "Tipo de Ciudad",
      allStates: "Todos los Estados",
      allRegions: "Todas las Regiones",
      allTypes: "Todos los Tipos",
      actions: {
        new: "Nueva Ciudad",
        syncCorreios: "Sincronizar Correios",
        importAlagoas: "Importar Alagoas",
        export: "Exportar CSV",
        back: "Volver",
        save: "Guardar",
        edit: "Editar",
        delete: "Eliminar",
        view: "Ver"
      },
      messages: {
        loadError: "Error al cargar las ciudades. Inténtelo de nuevo.",
        deleteSuccess: "¡Ciudad eliminada con éxito!",
        deleteError: "Error al eliminar ciudad. Inténtelo de nuevo.",
        saveSuccess: "¡Ciudad guardada con éxito!",
        syncStart: "¡Sincronización con la API de Correios iniciada con éxito! Este proceso puede tardar unos minutos en completarse.",
        syncError: "Error al sincronizar con la API de Correios. Inténtelo de nuevo.",
        importSuccess: "¡Importación completa! {{count}} ciudades importadas con éxito.",
        importError: "Error al importar ciudades. Inténtelo de nuevo."
      },
      form: {
        name: "Nombre de la Ciudad",
        state: "Estado",
        ibgeCode: "Código IBGE",
        type: "Tipo",
        region: "Región"
      },
      deleteConfirm: {
        title: "Confirmar Eliminación",
        message: "¿Está seguro de que desea eliminar esta ciudad? Esta acción no se puede deshacer."
      }
    },
    holidays: {
      title: "Registro de Festivos",
      subtitle: "Administre festivos nacionales, estatales y municipales",
      searchPlaceholder: "Buscar festivo...",
      types: {
        all: "Todos los tipos",
        national: "Nacional",
        state: "Estatal",
        municipal: "Municipal"
      },
      groups: {
        national: "Festivos Nacionales",
        state: "Festivos Estatales",
        municipal: "Festivos Municipales"
      },
      empty: {
        national: "No hay festivos nacionales registrados",
        state: "No hay festivos estatales registrados",
        municipal: "No hay festivos municipales registrados"
      },
      badges: {
        recurring: "Recurrente"
      },
      actions: {
        new: "Nuevo Festivo",
        newNational: "Nuevo Festivo Nacional",
        newState: "Nuevo Festivo Estatal",
        newMunicipal: "Nuevo Festivo Municipal",
        edit: "Editar",
        delete: "Eliminar",
        save: "Guardar",
        cancel: "Cancelar",
        back: "Volver"
      },
      messages: {
        loadError: "Error al cargar los festivos.",
        deleteSuccess: "¡Festivo eliminado con éxito!",
        deleteError: "Error al eliminar festivo.",
        saveSuccess: "¡Festivo guardado con éxito!",
        saveError: "Error al guardar festivo."
      },
      form: {
        name: "Nombre del Festivo",
        date: "Fecha",
        type: "Tipo (Nacional/Estatal/Municipal)",
        isRecurring: "Festivo Recurrente (Anual)",
        stateId: "Estado",
        cityId: "Ciudad"
      },
      deleteConfirm: {
        title: "Confirmar Eliminación",
        message: "¿Está seguro de que desea eliminar este festivo?"
      }
    }
  }
};

const languages = ['pt', 'en', 'es'];

languages.forEach(lang => {
  const filePath = path.join(localesDir, lang, 'translation.json');
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(fileContent);

    // Merge settings translations
    json.countries = { ...json.countries, ...settingsTranslations[lang].countries };
    json.cities = { ...json.cities, ...settingsTranslations[lang].cities };
    json.holidays = { ...json.holidays, ...settingsTranslations[lang].holidays };

    fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
    console.log(`Updated ${lang}/translation.json for Phase 1 (Cities, Countries, Holidays)`);
  }
});
