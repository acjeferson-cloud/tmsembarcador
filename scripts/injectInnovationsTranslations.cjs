const fs = require('fs');
const path = require('path');

const pts = {
  innovations: {
    title: "Inovações & Sugestões",
    subtitle: "Descubra novos recursos para impulsionar seu negócio",
    searchPlaceholder: "Buscar por nome, descrição ou categoria...",
    buttons: {
      new: "Nova Inovação",
      save: "Salvar",
      update: "Atualizar",
      cancel: "Cancelar",
      edit: "Editar",
      delete: "Excluir",
      view: "Visualizar",
      close: "Fechar",
      confirm: "Confirmar",
      add: "Adicionar"
    },
    messages: {
      loadError: "Erro ao carregar inovações",
      deleteSuccess: "Inovação excluída com sucesso",
      deleteError: "Erro ao excluir inovação",
      createSuccess: "Inovação criada com sucesso",
      updateSuccess: "Inovação atualizada com sucesso",
      saveError: "Erro ao salvar inovação",
      deleteConfirmTitle: "Confirmar Exclusão",
      deleteConfirmText: "Tem certeza que deseja excluir a inovação \"{{name}}\"?"
    },
    emptyResult: {
      searchTitle: "Nenhuma inovação encontrada",
      searchDesc: "Tente buscar com outros termos",
      emptyTitle: "Nenhuma inovação cadastrada",
      emptyDesc: "Comece adicionando uma nova inovação"
    },
    card: {
      startingAt: "A partir de",
      perMonth: "por mês",
      perMonthShort: "/mês",
      active: "Ativo",
      inactive: "Inativo",
      addedToBill: "Será adicionado à sua mensalidade",
      about: "Sobre esta inovação",
      detailedDesc: "Descrição Detalhada",
      icon: "Ícone",
      displayOrder: "Ordem de Exibição",
      createdAt: "Criado em",
      updatedAt: "Atualizado em"
    },
    form: {
      newTitle: "Nova Inovação",
      editTitle: "Editar Inovação",
      subtitle: "Preencha os dados da inovação",
      name: "Nome da Inovação *",
      namePlaceholder: "Ex: Integração com OpenAI/ChatGPT",
      desc: "Descrição Curta *",
      descPlaceholder: "Ex: Inteligência artificial para análise de dados",
      detailedDesc: "Descrição Detalhada",
      detailedDescPlaceholder: "Descreva os benefícios e funcionalidades da inovação...",
      price: "Preço Mensal (R$) *",
      pricePlaceholder: "0.00",
      order: "Ordem de Exibição",
      orderPlaceholder: "0",
      icon: "Ícone",
      category: "Categoria",
      activeCheck: "Inovação ativa",
      errors: {
        nameRequired: "Nome é obrigatório",
        descRequired: "Descrição é obrigatória",
        priceNegative: "Preço não pode ser negativo"
      }
    },
    categories: {
      integracao: "Integração",
      automacao: "Automação",
      relatorios: "Relatórios",
      comunicacao: "Comunicação",
      financeiro: "Financeiro",
      geral: "Geral"
    }
  }
};

const ens = {
  innovations: {
    title: "Innovations & Suggestions",
    subtitle: "Discover new features to boost your business",
    searchPlaceholder: "Search by name, description or category...",
    buttons: {
      new: "New Innovation",
      save: "Save",
      update: "Update",
      cancel: "Cancel",
      edit: "Edit",
      delete: "Delete",
      view: "View",
      close: "Close",
      confirm: "Confirm",
      add: "Add"
    },
    messages: {
      loadError: "Error loading innovations",
      deleteSuccess: "Innovation deleted successfully",
      deleteError: "Error deleting innovation",
      createSuccess: "Innovation created successfully",
      updateSuccess: "Innovation updated successfully",
      saveError: "Error saving innovation",
      deleteConfirmTitle: "Confirm Deletion",
      deleteConfirmText: "Are you sure you want to delete the innovation \"{{name}}\"?"
    },
    emptyResult: {
      searchTitle: "No innovations found",
      searchDesc: "Try searching with different terms",
      emptyTitle: "No innovations registered",
      emptyDesc: "Start by adding a new innovation"
    },
    card: {
      startingAt: "Starting at",
      perMonth: "per month",
      perMonthShort: "/month",
      active: "Active",
      inactive: "Inactive",
      addedToBill: "Will be added to your monthly bill",
      about: "About this innovation",
      detailedDesc: "Detailed Description",
      icon: "Icon",
      displayOrder: "Display Order",
      createdAt: "Created at",
      updatedAt: "Updated at"
    },
    form: {
      newTitle: "New Innovation",
      editTitle: "Edit Innovation",
      subtitle: "Fill in the innovation details",
      name: "Innovation Name *",
      namePlaceholder: "Ex: OpenAI/ChatGPT Integration",
      desc: "Short Description *",
      descPlaceholder: "Ex: Artificial intelligence for data analysis",
      detailedDesc: "Detailed Description",
      detailedDescPlaceholder: "Describe the benefits and features of the innovation...",
      price: "Monthly Price (R$) *",
      pricePlaceholder: "0.00",
      order: "Display Order",
      orderPlaceholder: "0",
      icon: "Icon",
      category: "Category",
      activeCheck: "Active innovation",
      errors: {
        nameRequired: "Name is required",
        descRequired: "Description is required",
        priceNegative: "Price cannot be negative"
      }
    },
    categories: {
      integracao: "Integration",
      automacao: "Automation",
      relatorios: "Reports",
      comunicacao: "Communication",
      financeiro: "Financial",
      geral: "General"
    }
  }
};

const ess = {
  innovations: {
    title: "Innovaciones y Sugerencias",
    subtitle: "Descubra nuevas funciones para impulsar su negocio",
    searchPlaceholder: "Buscar por nombre, descripción o categoría...",
    buttons: {
      new: "Nueva Innovación",
      save: "Guardar",
      update: "Actualizar",
      cancel: "Cancelar",
      edit: "Editar",
      delete: "Eliminar",
      view: "Ver",
      close: "Cerrar",
      confirm: "Confirmar",
      add: "Añadir"
    },
    messages: {
      loadError: "Error al cargar innovaciones",
      deleteSuccess: "Innovación eliminada con éxito",
      deleteError: "Error al eliminar la innovación",
      createSuccess: "Innovación creada con éxito",
      updateSuccess: "Innovación actualizada con éxito",
      saveError: "Error al guardar la innovación",
      deleteConfirmTitle: "Confirmar Eliminación",
      deleteConfirmText: "¿Está seguro de que desea eliminar la innovación \"{{name}}\"?"
    },
    emptyResult: {
      searchTitle: "No se encontraron innovaciones",
      searchDesc: "Intente buscar con otros términos",
      emptyTitle: "No hay innovaciones registradas",
      emptyDesc: "Comience añadiendo una nueva innovación"
    },
    card: {
      startingAt: "A partir de",
      perMonth: "por mes",
      perMonthShort: "/mes",
      active: "Activo",
      inactive: "Inactivo",
      addedToBill: "Se añadirá a su factura mensual",
      about: "Sobre esta innovación",
      detailedDesc: "Descripción Detallada",
      icon: "Icono",
      displayOrder: "Orden de Visualización",
      createdAt: "Creado en",
      updatedAt: "Actualizado en"
    },
    form: {
      newTitle: "Nueva Innovación",
      editTitle: "Editar Innovación",
      subtitle: "Complete los detalles de la innovación",
      name: "Nombre de la Innovación *",
      namePlaceholder: "Ej: Integración OpenAI/ChatGPT",
      desc: "Descripción Corta *",
      descPlaceholder: "Ej: Inteligencia artificial para análisis de datos",
      detailedDesc: "Descripción Detallada",
      detailedDescPlaceholder: "Describa los beneficios y funciones de la innovación...",
      price: "Precio Mensual (R$) *",
      pricePlaceholder: "0.00",
      order: "Orden de Visualización",
      orderPlaceholder: "0",
      icon: "Icono",
      category: "Categoría",
      activeCheck: "Innovación activa",
      errors: {
        nameRequired: "El nombre es obligatorio",
        descRequired: "La descripción es obligatoria",
        priceNegative: "El precio no puede ser negativo"
      }
    },
    categories: {
      integracao: "Integración",
      automacao: "Automatización",
      relatorios: "Informes",
      comunicacao: "Comunicación",
      financeiro: "Financiero",
      geral: "General"
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
    exist.innovations = { ...exist.innovations, ...data.innovations };
    writeJsonFile(p, exist);
    console.log(`Updated Innovations translations for ${lang}`);
  }
});
