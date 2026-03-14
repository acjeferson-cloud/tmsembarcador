const fs = require('fs');
const path = require('path');

const ptPath = path.resolve(__dirname, '../src/locales/pt/translation.json');
const enPath = path.resolve(__dirname, '../src/locales/en/translation.json');
const esPath = path.resolve(__dirname, '../src/locales/es/translation.json');

const translationsToAdd = {
  pt: {
    countries: {
      title: "Países",
      subtitle: "Gerenciamento completo de países",
      searchPlaceholder: "Buscar por nome, código ou capital...",
      allContinents: "Todos os Continentes",
      codesAndIdentifiers: "Códigos e Identificadores",
      generalInfo: "Informações Gerais",
      locationInfo: "Informações de Localização",
      viewSubtitle: "Detalhes completos do país",
      actions: {
        new: "Novo País",
        edit: "Editar",
        view: "Visualizar",
        delete: "Excluir",
        cancel: "Cancelar",
        save: "Salvar",
        export: "Exportar",
        back: "Voltar para Países"
      },
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
      form: {
        basicInfo: "Informações Básicas",
        code: "Código",
        name: "Nome",
        flag: "Bandeira",
        continent: "Continente",
        capital: "Capital",
        language: "Idioma(s)",
        bacenCode: "Código BACEN",
        selectContinent: "Selecione o continente",
        officialFlag: "Bandeira Oficial (Imagem)",
        subtitle: "Preencha os dados do país"
      },
      messages: {
        loadError: "Erro ao carregar países.",
        createSuccess: "País criado com sucesso!",
        createError: "Erro ao salvar país.",
        updateSuccess: "País atualizado com sucesso!",
        updateError: "Erro ao atualizar país.",
        deleteSuccess: "País excluído com sucesso!",
        deleteError: "Erro ao excluir país."
      },
      deleteConfirm: {
        title: "Excluir País",
        message: "Tem certeza que deseja excluir este país? Esta ação não pode ser desfeita."
      }
    }
  },
  en: {
    countries: {
      title: "Countries",
      subtitle: "Comprehensive country management",
      searchPlaceholder: "Search by name, code or capital...",
      allContinents: "All Continents",
      codesAndIdentifiers: "Codes and Identifiers",
      generalInfo: "General Information",
      locationInfo: "Location Information",
      viewSubtitle: "Complete country details",
      actions: {
        new: "New Country",
        edit: "Edit",
        view: "View",
        delete: "Delete",
        cancel: "Cancel",
        save: "Save",
        export: "Export",
        back: "Back to Countries"
      },
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
      form: {
        basicInfo: "Basic Information",
        code: "Code",
        name: "Name",
        flag: "Flag",
        continent: "Continent",
        capital: "Capital",
        language: "Language(s)",
        bacenCode: "BACEN Code",
        selectContinent: "Select continent",
        officialFlag: "Official Flag (Image)",
        subtitle: "Fill in the country details"
      },
      messages: {
        loadError: "Error loading countries.",
        createSuccess: "Country created successfully!",
        createError: "Error saving country.",
        updateSuccess: "Country updated successfully!",
        updateError: "Error updating country.",
        deleteSuccess: "Country deleted successfully!",
        deleteError: "Error deleting country."
      },
      deleteConfirm: {
        title: "Delete Country",
        message: "Are you sure you want to delete this country? This action cannot be undone."
      }
    }
  },
  es: {
    countries: {
      title: "Países",
      subtitle: "Gestión completa de países",
      searchPlaceholder: "Buscar por nombre, código o capital...",
      allContinents: "Todos los Continentes",
      codesAndIdentifiers: "Códigos e Identificadores",
      generalInfo: "Información General",
      locationInfo: "Información de Localización",
      viewSubtitle: "Detalles completos del país",
      actions: {
        new: "Nuevo País",
        edit: "Editar",
        view: "Ver",
        delete: "Eliminar",
        cancel: "Cancelar",
        save: "Guardar",
        export: "Exportar",
        back: "Volver a Países"
      },
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
      form: {
        basicInfo: "Información Básica",
        code: "Código",
        name: "Nombre",
        flag: "Bandera",
        continent: "Continente",
        capital: "Capital",
        language: "Idioma(s)",
        bacenCode: "Código BACEN",
        selectContinent: "Seleccione el continente",
        officialFlag: "Bandera Oficial (Imagen)",
        subtitle: "Complete los detalles del país"
      },
      messages: {
        loadError: "Error al cargar países.",
        createSuccess: "¡País creado con éxito!",
        createError: "Error al guardar país.",
        updateSuccess: "¡País actualizado con éxito!",
        updateError: "Error al actualizar país.",
        deleteSuccess: "¡País eliminado con éxito!",
        deleteError: "Error al eliminar país."
      },
      deleteConfirm: {
        title: "Eliminar País",
        message: "¿Está seguro de que desea eliminar este país? Esta acción no se puede deshacer."
      }
    }
  }
};

function readJsonFile(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return null;
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Successfully updated ${filePath}`);
  } catch (err) {
    console.error(`Error writing to ${filePath}:`, err);
  }
}

function updateTranslations() {
  const paths = { pt: ptPath, en: enPath, es: esPath };

  Object.keys(paths).forEach((lang) => {
    const filePath = paths[lang];
    const data = readJsonFile(filePath);

    if (data) {
      if (!data.countries) {
         data.countries = {};
      }
      
      data.countries = { ...data.countries, ...translationsToAdd[lang].countries };
      writeJsonFile(filePath, data);
    }
  });
}

updateTranslations();
