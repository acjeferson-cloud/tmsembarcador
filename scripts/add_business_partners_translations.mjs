import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.resolve(__dirname, '../src/locales');
const languages = ['pt', 'en', 'es'];

const translations = {
  pt: {
    title: "Parceiros de Negócios",
    subtitle: "Gerenciamento completo de parceiros de negócios",
    addPartner: "Novo Parceiro",
    searchPlaceholder: "Buscar por nome, documento ou email...",
    filterByType: "Filtrar por Tipo",
    filterByStatus: "Filtrar por Status",
    allTypes: "Todos os tipos",
    allStatuses: "Todos os status",
    typeCustomer: "Cliente",
    typeSupplier: "Fornecedor",
    typeBoth: "Ambos",
    statusActive: "Ativo",
    statusInactive: "Inativo",
    loading: "Carregando parceiros...",
    noPartners: "Nenhum parceiro encontrado",
    noPartnersDesc: "Tente ajustar os filtros de busca.",
    noPartnersInitial: "Comece adicionando seu primeiro parceiro de negócios.",
    addFirstPartner: "Adicionar Parceiro",
    stats: {
      total: "Total",
      clients: "Clientes",
      suppliers: "Fornecedores",
      active: "Ativos"
    },
    tabs: {
      list: "Lista",
      map: "Mapa"
    },
    pagination: {
      showing: "Mostrando",
      to: "até",
      of: "de",
      partners: "parceiros"
    },
    messages: {
      deleteSuccess: "Parceiro de negócios excluído com sucesso!",
      deleteError: "Erro ao excluir parceiro",
      updateSuccess: "Parceiro de negócios atualizado com sucesso!",
      updateError: "Erro ao atualizar parceiro",
      createSuccess: "Parceiro de negócios criado com sucesso!",
      createError: "Erro ao criar parceiro"
    },
    deleteConfirm: {
      title: "Confirmar Exclusão",
      message: "Tem certeza que deseja excluir {{name}}?\\n\\nEsta ação NÃO pode ser desfeita!"
    }
  },
  en: {
    title: "Business Partners",
    subtitle: "Complete management of business partners",
    addPartner: "New Partner",
    searchPlaceholder: "Search by name, document or email...",
    filterByType: "Filter by Type",
    filterByStatus: "Filter by Status",
    allTypes: "All types",
    allStatuses: "All statuses",
    typeCustomer: "Customer",
    typeSupplier: "Supplier",
    typeBoth: "Both",
    statusActive: "Active",
    statusInactive: "Inactive",
    loading: "Loading partners...",
    noPartners: "No partners found",
    noPartnersDesc: "Try adjusting the search filters.",
    noPartnersInitial: "Start by adding your first business partner.",
    addFirstPartner: "Add Partner",
    stats: {
      total: "Total",
      clients: "Clients",
      suppliers: "Suppliers",
      active: "Active"
    },
    tabs: {
      list: "List",
      map: "Map"
    },
    pagination: {
      showing: "Showing",
      to: "to",
      of: "of",
      partners: "partners"
    },
    messages: {
      deleteSuccess: "Business partner successfully deleted!",
      deleteError: "Error deleting partner",
      updateSuccess: "Business partner successfully updated!",
      updateError: "Error updating partner",
      createSuccess: "Business partner successfully created!",
      createError: "Error creating partner"
    },
    deleteConfirm: {
      title: "Confirm Deletion",
      message: "Are you sure you want to delete {{name}}?\\n\\nThis action CANNOT be undone!"
    }
  },
  es: {
    title: "Socios de Negocios",
    subtitle: "Gestión completa de socios de negocios",
    addPartner: "Nuevo Socio",
    searchPlaceholder: "Buscar por nombre, documento o email...",
    filterByType: "Filtrar por Tipo",
    filterByStatus: "Filtrar por Estado",
    allTypes: "Todos los tipos",
    allStatuses: "Todos los estados",
    typeCustomer: "Cliente",
    typeSupplier: "Proveedor",
    typeBoth: "Ambos",
    statusActive: "Activo",
    statusInactive: "Inactivo",
    loading: "Cargando socios...",
    noPartners: "No se encontraron socios",
    noPartnersDesc: "Intenta ajustar los filtros de búsqueda.",
    noPartnersInitial: "Comienza agregando tu primer socio de negocios.",
    addFirstPartner: "Añadir Socio",
    stats: {
      total: "Total",
      clients: "Clientes",
      suppliers: "Proveedores",
      active: "Activos"
    },
    tabs: {
      list: "Lista",
      map: "Mapa"
    },
    pagination: {
      showing: "Mostrando",
      to: "a",
      of: "de",
      partners: "socios"
    },
    messages: {
      deleteSuccess: "¡Socio de negocios eliminado con éxito!",
      deleteError: "Error al eliminar socio",
      updateSuccess: "¡Socio de negocios actualizado con éxito!",
      updateError: "Error al actualizar socio",
      createSuccess: "¡Socio de negocios creado con éxito!",
      createError: "Error al crear socio"
    },
    deleteConfirm: {
      title: "Confirmar Eliminación",
      message: "¿Estás seguro de que quieres eliminar a {{name}}?\\n\\n¡Esta acción NO se puede deshacer!"
    }
  }
};

languages.forEach(lang => {
  const filePath = path.join(localesDir, lang, 'translation.json');
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(fileContent);
    
    // Add or replace the businessPartners object
    json.businessPartners = {
      ...(json.businessPartners || {}),
      ...translations[lang]
    };

    fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
    console.log(`Updated translations for ${lang}`);
  } else {
    console.error(`File not found: ${filePath}`);
  }
});
