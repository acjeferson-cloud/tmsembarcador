const fs = require('fs');

const translations = {
  pt: {
    freightRates: {
      view: {
        title: "Visualizar Tabela de Frete",
        subtitle: "Detalhes completos da tabela e suas tarifas",
        editTable: "Editar Tabela",
        carrier: "Transportador:",
        validity: "Vigência",
        to: "a",
        status: "Status",
        statusActive: "Ativo",
        statusInactive: "Inativo",
        ratesCount: "Tarifas",
        registeredRates: "tarifas cadastradas",
        situation: "Situação",
        current: "Vigente",
        notCurrent: "Fora de Vigência",
        transportModal: "Modal de Transporte",
        road: "Rodoviário",
        air: "Aéreo",
        water: "Aquaviário",
        rail: "Ferroviário",
        summaryByApplication: "Resumo por Tipo de Aplicação",
        byCity: "Por Cidade",
        byClient: "Por Cliente",
        byProduct: "Por Produto",
        auditInfo: "Informações de Auditoria",
        createdBy: "Criado por",
        user: "Usuário #",
        creationDate: "Data de Criação",
        lastAlteredBy: "Última alteração por",
        lastAlteredDate: "Data da última alteração",
        aboutRatesTitle: "Sobre Tarifas",
        aboutRatesDesc: "As tarifas definem os valores e prazos de entrega para diferentes aplicações. Cada tarifa possui um código único e pode ser aplicada por cidade, cliente ou produto.",
        aboutCityDesc: "Baseado na origem e destino",
        aboutClientDesc: "Específico para um cliente",
        aboutProductDesc: "Baseado no tipo de produto",
        noRates: "Nenhuma tarifa cadastrada nesta tabela",
        confirmDelete: "Tem certeza que deseja excluir esta tarifa?",
        deleteSuccess: "Tarifa excluída com sucesso!",
        deleteError: "Erro ao excluir tarifa.",
        updateSuccess: "Tarifa atualizada com sucesso!",
        updateError: "Erro ao atualizar tarifa.",
        addSuccess: "Tarifa adicionada com sucesso!",
        addError: "Erro ao adicionar tarifa.",
        saveError: "Erro ao salvar tarifa. Tente novamente."
      }
    }
  },
  en: {
    freightRates: {
      view: {
        title: "View Freight Table",
        subtitle: "Complete table details and its rates",
        editTable: "Edit Table",
        carrier: "Carrier:",
        validity: "Validity",
        to: "to",
        status: "Status",
        statusActive: "Active",
        statusInactive: "Inactive",
        ratesCount: "Rates",
        registeredRates: "registered rates",
        situation: "Situation",
        current: "Current",
        notCurrent: "Expired",
        transportModal: "Transport Modal",
        road: "Road",
        air: "Air",
        water: "Water",
        rail: "Rail",
        summaryByApplication: "Summary by Application Type",
        byCity: "By City",
        byClient: "By Client",
        byProduct: "By Product",
        auditInfo: "Audit Information",
        createdBy: "Created by",
        user: "User #",
        creationDate: "Creation Date",
        lastAlteredBy: "Last altered by",
        lastAlteredDate: "Last altered date",
        aboutRatesTitle: "About Rates",
        aboutRatesDesc: "Rates define the values and delivery times for different applications. Each rate has a unique code and can be applied by city, client, or product.",
        aboutCityDesc: "Based on origin and destination",
        aboutClientDesc: "Specific to a client",
        aboutProductDesc: "Based on product type",
        noRates: "No rates registered in this table",
        confirmDelete: "Are you sure you want to delete this rate?",
        deleteSuccess: "Rate deleted successfully!",
        deleteError: "Error deleting rate.",
        updateSuccess: "Rate updated successfully!",
        updateError: "Error updating rate.",
        addSuccess: "Rate added successfully!",
        addError: "Error adding rate.",
        saveError: "Error saving rate. Try again."
      }
    }
  },
  es: {
    freightRates: {
      view: {
        title: "Ver Tabla de Fletes",
        subtitle: "Detalles completos de la tabla y sus tarifas",
        editTable: "Editar Tabla",
        carrier: "Transportista:",
        validity: "Vigencia",
        to: "a",
        status: "Estado",
        statusActive: "Activo",
        statusInactive: "Inactivo",
        ratesCount: "Tarifas",
        registeredRates: "tarifas registradas",
        situation: "Situación",
        current: "Vigente",
        notCurrent: "Vencida",
        transportModal: "Modalidad de Transporte",
        road: "Carretera",
        air: "Aéreo",
        water: "Marítimo",
        rail: "Ferroviario",
        summaryByApplication: "Resumen por Tipo de Aplicación",
        byCity: "Por Ciudad",
        byClient: "Por Cliente",
        byProduct: "Por Producto",
        auditInfo: "Información de Auditoría",
        createdBy: "Creado por",
        user: "Usuario #",
        creationDate: "Fecha de Creación",
        lastAlteredBy: "Última alteración por",
        lastAlteredDate: "Fecha de la última alteración",
        aboutRatesTitle: "Sobre las Tarifas",
        aboutRatesDesc: "Las tarifas definen los valores y plazos de entrega para diferentes aplicaciones. Cada tarifa tiene un código único y puede aplicarse por ciudad, cliente o producto.",
        aboutCityDesc: "Basado en origen y destino",
        aboutClientDesc: "Específico para un cliente",
        aboutProductDesc: "Basado en el tipo de producto",
        noRates: "No hay tarifas registradas en esta tabla",
        confirmDelete: "¿Está seguro de que desea eliminar esta tarifa?",
        deleteSuccess: "¡Tarifa eliminada con éxito!",
        deleteError: "Error al eliminar la tarifa.",
        updateSuccess: "¡Tarifa actualizada con éxito!",
        updateError: "Error al actualizar la tarifa.",
        addSuccess: "¡Tarifa agregada con éxito!",
        addError: "Error al agregar tarifa.",
        saveError: "Error al guardar la tarifa. Inténtelo de nuevo."
      }
    }
  }
};

const langs = ['pt', 'en', 'es'];

for (const lang of langs) {
  const path = 'c:/Users/usuário/Desktop/TmsEmbarcador/tmsembarcador/src/locales/' + lang + '/translation.json';
  if (fs.existsSync(path)) {
    let raw = fs.readFileSync(path, 'utf8');
    let json = JSON.parse(raw);
    
    if (!json.carriers.freightRates.view) {
       json.carriers.freightRates.view = {};
    }
    json.carriers.freightRates.view = Object.assign({}, json.carriers.freightRates.view, translations[lang].freightRates.view);
    
    fs.writeFileSync(path, JSON.stringify(json, null, 2));
    console.log('Merged ' + lang);
  }
}
