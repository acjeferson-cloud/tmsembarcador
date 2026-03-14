import fs from 'fs';
import path from 'path';

const localesDir = path.join(process.cwd(), 'src', 'locales');

const keys = {
  states: {
    pt: {
      title: "Estados do Brasil",
      subtitle: "Gerencie o cadastro de estados brasileiros",
      new_state: "Novo Estado",
      tabs: {
        list: "Lista",
        map: "Mapa"
      },
      filters: {
        search_placeholder: "Buscar por nome, sigla, capital ou código IBGE...",
        export: "Exportar",
        all_regions: "Todos"
      },
      regions: {
        norte: "Norte",
        nordeste: "Nordeste",
        centro_oeste: "Centro-Oeste",
        sudeste: "Sudeste",
        sul: "Sul"
      },
      list: {
        total: "Total: {{count}} estados",
        page_info: "Página {{current}} de {{total}}",
        loading: "Carregando estados...",
        showing: "Mostrando {{start}} a {{end}} de {{total}} estados",
        previous: "Anterior",
        next: "Próximo",
        empty_title: "Nenhum estado encontrado",
        empty_subtitle: "Tente ajustar os filtros ou cadastrar um novo estado.",
        not_informed: "Não informado",
        na: "N/A"
      },
      messages: {
        load_error: "Erro ao carregar estados.",
        delete_success: "Estado excluído com sucesso!",
        delete_error: "Erro ao excluir estado (Verifique chaves estrangeiras).",
        update_success: "Estado atualizado com sucesso!",
        update_error: "Erro ao atualizar estado.",
        create_success: "Estado criado com sucesso!",
        create_error: "Erro ao salvar estado. Tente novamente.",
        upload_error: "Erro ao fazer upload da imagem."
      },
      dialogs: {
        delete_title: "Confirmar Exclusão",
        delete_message: "Tem certeza que deseja excluir este estado? Esta ação não pode ser desfeita.",
        delete_confirm: "Excluir",
        delete_cancel: "Cancelar"
      },
      fields: {
        name: "Nome do Estado",
        abbreviation: "Sigla",
        ibge_code: "Código IBGE",
        capital: "Capital",
        region: "Região"
      },
      form: {
        back: "Voltar para Estados",
        title_new: "Novo Estado",
        title_edit: "Editar Estado",
        subtitle: "Preencha os dados do estado",
        basic_info: "Informações Básicas",
        name_label: "Nome do Estado *",
        name_placeholder: "Acre",
        abbreviation_label: "Sigla *",
        abbreviation_placeholder: "AC",
        ibge_label: "Código IBGE *",
        ibge_placeholder: "12",
        capital_label: "Capital *",
        capital_placeholder: "Rio Branco",
        region_label: "Região *",
        region_placeholder: "Selecione a região",
        flag_label: "Bandeira Oficial (Imagem)",
        no_flag: "Sem bandeira",
        uploading: "Enviando...",
        upload_text: "Fazer upload de um arquivo",
        upload_hint: "PNG, JPG, SVG ou WEBP até 2MB",
        cancel: "Cancelar",
        save: "Salvar Estado",
        update: "Atualizar Estado"
      },
      tooltips: {
        view: "Visualizar",
        edit: "Editar",
        delete: "Excluir"
      },
      view: {
        title: "Visualizar Estado",
        subtitle: "Detalhes completos do estado",
        edit_button: "Editar",
        location_info: "Informações de Localização",
        general_info: "Informações Gerais"
      },
      map: {
        title: "Mapa do Brasil",
        subtitle: "Visualize os estados brasileiros no mapa interativo",
        interactive_map: "Mapa Interativo:",
        tip_1: "• Clique em qualquer local do mapa para obter informações",
        tip_2: "• Use os controles de zoom para navegar",
        tip_3: "• O mapa mostra as divisões estaduais do Brasil"
      }
    },
    en: {
      title: "States of Brazil",
      subtitle: "Manage the registration of Brazilian states",
      new_state: "New State",
      tabs: {
        list: "List",
        map: "Map"
      },
      filters: {
        search_placeholder: "Search by name, abbreviation, capital, or IBGE code...",
        export: "Export",
        all_regions: "All"
      },
      regions: {
        norte: "North",
        nordeste: "Northeast",
        centro_oeste: "Midwest",
        sudeste: "Southeast",
        sul: "South"
      },
      list: {
        total: "Total: {{count}} states",
        page_info: "Page {{current}} of {{total}}",
        loading: "Loading states...",
        showing: "Showing {{start}} to {{end}} of {{total}} states",
        previous: "Previous",
        next: "Next",
        empty_title: "No states found",
        empty_subtitle: "Try adjusting the filters or registering a new state.",
        not_informed: "Not informed",
        na: "N/A"
      },
      messages: {
        load_error: "Error loading states.",
        delete_success: "State deleted successfully!",
        delete_error: "Error deleting state (Check foreign keys).",
        update_success: "State updated successfully!",
        update_error: "Error updating state.",
        create_success: "State created successfully!",
        create_error: "Error saving state. Try again.",
        upload_error: "Error uploading image."
      },
      dialogs: {
        delete_title: "Confirm Deletion",
        delete_message: "Are you sure you want to delete this state? This action cannot be undone.",
        delete_confirm: "Delete",
        delete_cancel: "Cancel"
      },
      fields: {
        name: "State Name",
        abbreviation: "Abbreviation",
        ibge_code: "IBGE Code",
        capital: "Capital",
        region: "Region"
      },
      form: {
        back: "Back to States",
        title_new: "New State",
        title_edit: "Edit State",
        subtitle: "Fill in the state details",
        basic_info: "Basic Information",
        name_label: "State Name *",
        name_placeholder: "Acre",
        abbreviation_label: "Abbreviation *",
        abbreviation_placeholder: "AC",
        ibge_label: "IBGE Code *",
        ibge_placeholder: "12",
        capital_label: "Capital *",
        capital_placeholder: "Rio Branco",
        region_label: "Region *",
        region_placeholder: "Select region",
        flag_label: "Official Flag (Image)",
        no_flag: "No flag",
        uploading: "Uploading...",
        upload_text: "Upload a file",
        upload_hint: "PNG, JPG, SVG or WEBP up to 2MB",
        cancel: "Cancel",
        save: "Save State",
        update: "Update State"
      },
      tooltips: {
        view: "View",
        edit: "Edit",
        delete: "Delete"
      },
      view: {
        title: "View State",
        subtitle: "Complete state details",
        edit_button: "Edit",
        location_info: "Location Information",
        general_info: "General Information"
      },
      map: {
        title: "Map of Brazil",
        subtitle: "View the Brazilian states on the interactive map",
        interactive_map: "Interactive Map:",
        tip_1: "• Click anywhere on the map to get information",
        tip_2: "• Use the zoom controls to navigate",
        tip_3: "• The map shows the state divisions of Brazil"
      }
    },
    es: {
      title: "Estados de Brasil",
      subtitle: "Gestione el registro de los estados brasileños",
      new_state: "Nuevo Estado",
      tabs: {
        list: "Lista",
        map: "Mapa"
      },
      filters: {
        search_placeholder: "Buscar por nombre, sigla, capital o código IBGE...",
        export: "Exportar",
        all_regions: "Todos"
      },
      regions: {
        norte: "Norte",
        nordeste: "Nordeste",
        centro_oeste: "Centro-Oeste",
        sudeste: "Sureste",
        sul: "Sur"
      },
      list: {
        total: "Total: {{count}} estados",
        page_info: "Página {{current}} de {{total}}",
        loading: "Cargando estados...",
        showing: "Mostrando {{start}} a {{end}} de {{total}} estados",
        previous: "Anterior",
        next: "Siguiente",
        empty_title: "Ningún estado encontrado",
        empty_subtitle: "Intente ajustar los filtros o registrar un nuevo estado.",
        not_informed: "No informado",
        na: "N/A"
      },
      messages: {
        load_error: "Error al cargar estados.",
        delete_success: "¡Estado eliminado con éxito!",
        delete_error: "Error al eliminar estado (Verifique claves foráneas).",
        update_success: "¡Estado actualizado con éxito!",
        update_error: "Error al actualizar estado.",
        create_success: "¡Estado creado con éxito!",
        create_error: "Error al guardar estado. Inténtelo de nuevo.",
        upload_error: "Error al subir imagen."
      },
      dialogs: {
        delete_title: "Confirmar Eliminación",
        delete_message: "¿Está seguro de que desea eliminar este estado? Esta acción no se puede deshacer.",
        delete_confirm: "Eliminar",
        delete_cancel: "Cancelar"
      },
      fields: {
        name: "Nombre del Estado",
        abbreviation: "Sigla",
        ibge_code: "Código IBGE",
        capital: "Capital",
        region: "Región"
      },
      form: {
        back: "Volver a Estados",
        title_new: "Nuevo Estado",
        title_edit: "Editar Estado",
        subtitle: "Rellene los datos del estado",
        basic_info: "Información Básica",
        name_label: "Nombre del Estado *",
        name_placeholder: "Acre",
        abbreviation_label: "Sigla *",
        abbreviation_placeholder: "AC",
        ibge_label: "Código IBGE *",
        ibge_placeholder: "12",
        capital_label: "Capital *",
        capital_placeholder: "Rio Branco",
        region_label: "Región *",
        region_placeholder: "Seleccione la región",
        flag_label: "Bandera Oficial (Imagen)",
        no_flag: "Sin bandera",
        uploading: "Subiendo...",
        upload_text: "Subir un archivo",
        upload_hint: "PNG, JPG, SVG o WEBP hasta 2MB",
        cancel: "Cancelar",
        save: "Guardar Estado",
        update: "Actualizar Estado"
      },
      tooltips: {
        view: "Visualizar",
        edit: "Editar",
        delete: "Eliminar"
      },
      view: {
        title: "Visualizar Estado",
        subtitle: "Detalles completos del estado",
        edit_button: "Editar",
        location_info: "Información de Localización",
        general_info: "Información General"
      },
      map: {
        title: "Mapa de Brasil",
        subtitle: "Vea los estados brasileños en el mapa interactivo",
        interactive_map: "Mapa Interactivo:",
        tip_1: "• Haga clic en cualquier lugar del mapa para obtener información",
        tip_2: "• Utilice los controles de zoom para navegar",
        tip_3: "• El mapa muestra las divisiones estatales de Brasil"
      }
    }
  }
};

const updateTranslations = () => {
  ['pt', 'en', 'es'].forEach(lang => {
    const filePath = path.join(localesDir, lang, 'translation.json');
    if (fs.existsSync(filePath)) {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      content.states = keys.states[lang];
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
      console.log(`Updated ${lang} translations for states.`);
    } else {
      console.log(`File not found: ${filePath}`);
    }
  });
};

updateTranslations();
