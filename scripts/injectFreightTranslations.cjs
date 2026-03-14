const fs = require('fs');

const translations = {
  pt: {
    freightRates: {
      title: "Tabelas de Frete",
      manageTables: "Gerencie as tabelas de frete deste transportador",
      allTables: "Todas as Tabelas de Frete",
      manageTariffs: "Gerencie as tabelas de frete e tarifas",
      newTable: "Nova Tabela",
      searchPlaceholder: "Buscar por nome da tabela ou transportador...",
      allStatuses: "Todos os Status",
      activeText: "Ativo",
      inactiveText: "Inativo",
      export: "Exportar",
      totalTables: "Total: {{count}} tabelas",
      activeCount: "{{count}} ativas",
      inactiveCount: "{{count}} inativas",
      viewAction: "Visualizar",
      copyTable: "Copiar Tabela",
      editAction: "Editar",
      deleteAction: "Excluir",
      validity: "Vigência: {{start}} a {{end}}",
      registeredTariffs: "{{count}} tarifas cadastradas",
      createdAt: "Criada em: {{date}}",
      inbound: "Entrada (Frete de Compra)",
      outbound: "Saída (Frete de Venda)",
      statusLabel: "Status:",
      current: "Vigente",
      notCurrent: "Fora de Vigência",
      notFound: "Nenhuma tabela de frete encontrada",
      noTablesCarrier: "Este transportador ainda não possui tabelas de frete cadastradas.",
      noTablesFilter: "Nenhuma tabela de frete corresponde aos filtros aplicados.",
      createTable: "Criar Nova Tabela",
      deleteConfirm: "Tem certeza que deseja excluir esta tabela de frete?",
      deleteSuccess: "Tabela de frete excluída com sucesso!",
      deleteError: "Erro ao excluir tabela de frete."
    }
  },
  en: {
    freightRates: {
      title: "Freight Rates",
      manageTables: "Manage freight rate tables for this carrier",
      allTables: "All Freight Rate Tables",
      manageTariffs: "Manage freight tables and tariffs",
      newTable: "New Table",
      searchPlaceholder: "Search by table name or carrier...",
      allStatuses: "All Statuses",
      activeText: "Active",
      inactiveText: "Inactive",
      export: "Export",
      totalTables: "Total: {{count}} tables",
      activeCount: "{{count}} active",
      inactiveCount: "{{count}} inactive",
      viewAction: "View",
      copyTable: "Copy Table",
      editAction: "Edit",
      deleteAction: "Delete",
      validity: "Validity: {{start}} to {{end}}",
      registeredTariffs: "{{count}} registered tariffs",
      createdAt: "Created at: {{date}}",
      inbound: "Inbound (Purchase Freight)",
      outbound: "Outbound (Sales Freight)",
      statusLabel: "Status:",
      current: "Current",
      notCurrent: "Expired",
      notFound: "No freight tables found",
      noTablesCarrier: "This carrier has no freight tables registered yet.",
      noTablesFilter: "No freight tables match the applied filters.",
      createTable: "Create New Table",
      deleteConfirm: "Are you sure you want to delete this freight table?",
      deleteSuccess: "Freight table deleted successfully!",
      deleteError: "Error deleting freight table."
    }
  },
  es: {
    freightRates: {
      title: "Tablas de Fletes",
      manageTables: "Administre las tablas de fletes para este transportista",
      allTables: "Todas las Tablas de Fletes",
      manageTariffs: "Administre las tablas de fletes y tarifas",
      newTable: "Nueva Tabla",
      searchPlaceholder: "Buscar por nombre de tabla o transportista...",
      allStatuses: "Todos los Estados",
      activeText: "Activo",
      inactiveText: "Inactivo",
      export: "Exportar",
      totalTables: "Total: {{count}} tablas",
      activeCount: "{{count}} activas",
      inactiveCount: "{{count}} inactivas",
      viewAction: "Ver",
      copyTable: "Copiar Tabla",
      editAction: "Editar",
      deleteAction: "Eliminar",
      validity: "Vigencia: {{start}} a {{end}}",
      registeredTariffs: "{{count}} tarifas registradas",
      createdAt: "Creado en: {{date}}",
      inbound: "Entrada (Flete de Compra)",
      outbound: "Salida (Flete de Venta)",
      statusLabel: "Estado:",
      current: "Vigente",
      notCurrent: "Vencida",
      notFound: "No se encontraron tablas de fletes",
      noTablesCarrier: "Este transportista aún no tiene tablas de fletes registradas.",
      noTablesFilter: "Ninguna tabla de fletes coincide con los filtros aplicados.",
      createTable: "Crear Nueva Tabla",
      deleteConfirm: "¿Está seguro de que desea eliminar esta tabla de fletes?",
      deleteSuccess: "¡Tabla de fletes eliminada con éxito!",
      deleteError: "Error al eliminar la tabla de fletes."
    }
  }
};

const langs = ['pt', 'en', 'es'];

for (const lang of langs) {
  const path = 'c:/Users/usuário/Desktop/TmsEmbarcador/tmsembarcador/src/locales/' + lang + '/translation.json';
  if (fs.existsSync(path)) {
    let raw = fs.readFileSync(path, 'utf8');
    let json = JSON.parse(raw);
    
    // Merge new freightRates keeping old keys
    if (!json.carriers.freightRates) {
       json.carriers.freightRates = {};
    }
    json.carriers.freightRates = Object.assign({}, json.carriers.freightRates, translations[lang].freightRates);
    
    // Some older keys in the file might exist like "title" and "manageTables", we successfully merged them.
    fs.writeFileSync(path, JSON.stringify(json, null, 2));
    console.log('Merged ' + lang);
  }
}
