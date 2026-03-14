const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, '..', 'src', 'locales');
const languages = ['pt', 'en', 'es'];

const missingTranslations = {
  pt: {
    form: {
      "backToTables": "Voltar para Tabelas",
      "titleView": "Visualizar Tabela de Frete",
      "titleEdit": "Editar Tabela de Frete",
      "titleNew": "Nova Tabela de Frete",
      "subtitleView": "Detalhes da tabela de frete",
      "subtitleNew": "Preencha os dados básicos da tabela",
      "additionalFees": "Taxas Adicionais",
      "restrictedItems": "Itens Restritos",
      "basicInfo": "Informações Básicas",
      "tableName": "Nome da Tabela",
      "tableNamePlaceholder": "Ex: Tabela Padrão SP",
      "selectCarrier": "Selecione um transportador",
      "startDate": "Data de Início",
      "endDate": "Data de Fim",
      "status": "Status",
      "tableType": "Tipo de Tabela",
      "inbound": "Entrada",
      "outbound": "Saída",
      "transportModal": "Modal",
      "selectCarrierFirst": "Selecione o transportador primeiro",
      "noModalsConfigured": "Nenhum modal configurado",
      "selectModal": "Selecione um modal",
      "road": "Rodoviário",
      "air": "Aéreo",
      "water": "Aquaviário",
      "rail": "Ferroviário",
      "modalWarning": "Este transportador não possui modais configurados.",
      "rates": "Tarifas",
      "addRate": "Nova Tarifa",
      "editRate": "Editar Tarifa",
      "newRate": "Nova Tarifa",
      "rateDescription": "Descrição da Tarifa",
      "rateDescriptionPlaceholder": "Ex: Tarifa Padrão",
      "applicationType": "Tipo de Aplicação",
      "byCity": "Por Cidade",
      "byClient": "Por Cliente",
      "byProduct": "Por Produto",
      "deliveryTime": "Prazo de Entrega (dias)",
      "value": "Valor",
      "observations": "Observações",
      "observationsPlaceholder": "Observações adicionais...",
      "updateRate": "Atualizar Tarifa",
      "code": "Código",
      "description": "Descrição",
      "type": "Tipo",
      "deadline": "Prazo",
      "actions": "Ações",
      "values": "Valores",
      "cities": "Cidades",
      "duplicateConfirm": "Deseja realmente duplicar a tarifa",
      "duplicateSuccess": "Tarifa duplicada com sucesso!",
      "back": "Voltar",
      "cancel": "Cancelar",
      "updateTable": "Atualizar Tabela",
      "saveTable": "Salvar Tabela",
      "active": "Ativo",
      "inactive": "Inativo",
      "duplicateError": "Erro ao duplicar tarifa. Tente novamente.",
      "noRates": "Nenhuma tarifa cadastrada nesta tabela",
      "aboutRatesTitle": "Sobre as Tarifas",
      "aboutRatesDesc": "As tarifas podem ser aplicadas por cidade, cliente ou produto. Cada tarifa possui um prazo de entrega estimado e um valor específico. Você pode adicionar quantas tarifas forem necessárias para compor sua tabela de frete."
    },
    view: {
      "editTable": "Editar Tabela",
      "saveError": "Erro ao salvar, tente novamente.",
      "updateSuccess": "Tarifa atualizada!",
      "updateError": "Erro ao atualizar tarifa",
      "addSuccess": "Tarifa adicionada!",
      "addError": "Erro ao adicionar tarifa"
    }
  },
  en: {
    form: {
      "backToTables": "Back to Tables",
      "titleView": "View Freight Table",
      "titleEdit": "Edit Freight Table",
      "titleNew": "New Freight Table",
      "subtitleView": "Freight table details",
      "subtitleNew": "Fill in the basic table details",
      "additionalFees": "Additional Fees",
      "restrictedItems": "Restricted Items",
      "basicInfo": "Basic Information",
      "tableName": "Table Name",
      "tableNamePlaceholder": "Ex: Standard Table NY",
      "selectCarrier": "Select a carrier",
      "startDate": "Start Date",
      "endDate": "End Date",
      "status": "Status",
      "tableType": "Table Type",
      "inbound": "Inbound",
      "outbound": "Outbound",
      "transportModal": "Transport Mode",
      "selectCarrierFirst": "Select carrier first",
      "noModalsConfigured": "No transport modes configured",
      "selectModal": "Select a transport mode",
      "road": "Road",
      "air": "Air",
      "water": "Water",
      "rail": "Rail",
      "modalWarning": "This carrier has no transport modes configured.",
      "rates": "Rates",
      "addRate": "Add Rate",
      "editRate": "Edit Rate",
      "newRate": "New Rate",
      "rateDescription": "Rate Description",
      "rateDescriptionPlaceholder": "Ex: Standard Rate",
      "applicationType": "Application Type",
      "byCity": "By City",
      "byClient": "By Client",
      "byProduct": "By Product",
      "deliveryTime": "Delivery Time (days)",
      "value": "Value",
      "observations": "Observations",
      "observationsPlaceholder": "Additional observations...",
      "updateRate": "Update Rate",
      "code": "Code",
      "description": "Description",
      "type": "Type",
      "deadline": "Deadline",
      "actions": "Actions",
      "values": "Values",
      "cities": "Cities",
      "duplicateConfirm": "Do you really want to duplicate the rate",
      "duplicateSuccess": "Rate duplicated successfully!",
      "back": "Back",
      "cancel": "Cancel",
      "updateTable": "Update Table",
      "saveTable": "Save Table",
      "active": "Active",
      "inactive": "Inactive",
      "duplicateError": "Error duplicating rate. Please try again.",
      "noRates": "No rates registered in this table",
      "aboutRatesTitle": "About Rates",
      "aboutRatesDesc": "Rates can be applied by city, client, or product. Each rate has an estimated delivery time and a specific value. You can add as many rates as necessary to build your freight table."
    },
    view: {
      "editTable": "Edit Table",
      "saveError": "Error saving, please try again.",
      "updateSuccess": "Rate updated!",
      "updateError": "Error updating rate",
      "addSuccess": "Rate added!",
      "addError": "Error adding rate"
    }
  },
  es: {
    form: {
      "backToTables": "Volver a Tablas",
      "titleView": "Ver Tabla de Fletes",
      "titleEdit": "Editar Tabla de Fletes",
      "titleNew": "Nueva Tabla de Fletes",
      "subtitleView": "Detalles de la tabla de fletes",
      "subtitleNew": "Complete los datos básicos de la tabla",
      "additionalFees": "Cargos Adicionales",
      "restrictedItems": "Artículos Restringidos",
      "basicInfo": "Información Básica",
      "tableName": "Nombre de la Tabla",
      "tableNamePlaceholder": "Ej: Tabla Estándar Madrid",
      "selectCarrier": "Seleccione un transportista",
      "startDate": "Fecha de Inicio",
      "endDate": "Fecha de Fin",
      "status": "Estado",
      "tableType": "Tipo de Tabla",
      "inbound": "Entrada",
      "outbound": "Salida",
      "transportModal": "Modo de Transporte",
      "selectCarrierFirst": "Seleccione transportista primero",
      "noModalsConfigured": "Sin modos configurados",
      "selectModal": "Seleccione un modo",
      "road": "Terrestre",
      "air": "Aéreo",
      "water": "Marítimo",
      "rail": "Ferroviario",
      "modalWarning": "Este transportista no tiene modos de transporte configurados.",
      "rates": "Tarifas",
      "addRate": "Agregar Tarifa",
      "editRate": "Editar Tarifa",
      "newRate": "Nueva Tarifa",
      "rateDescription": "Descripción de Tarifa",
      "rateDescriptionPlaceholder": "Ej: Tarifa Estándar",
      "applicationType": "Tipo de Aplicación",
      "byCity": "Por Ciudad",
      "byClient": "Por Cliente",
      "byProduct": "Por Producto",
      "deliveryTime": "Tiempo de Entrega (días)",
      "value": "Valor",
      "observations": "Observaciones",
      "observationsPlaceholder": "Observaciones adicionales...",
      "updateRate": "Actualizar Tarifa",
      "code": "Código",
      "description": "Descripción",
      "type": "Tipo",
      "deadline": "Plazo",
      "actions": "Acciones",
      "values": "Valores",
      "cities": "Ciudades",
      "duplicateConfirm": "¿Realmente desea duplicar la tarifa",
      "duplicateSuccess": "¡Tarifa duplicada con éxito!",
      "back": "Volver",
      "cancel": "Cancelar",
      "updateTable": "Actualizar Tabla",
      "saveTable": "Guardar Tabla",
      "active": "Activo",
      "inactive": "Inactivo",
      "duplicateError": "Error al duplicar la tarifa. Inténtalo de nuevo.",
      "noRates": "Ninguna tarifa registrada en esta tabla",
      "aboutRatesTitle": "Sobre las Tarifas",
      "aboutRatesDesc": "Las tarifas se pueden aplicar por ciudad, cliente o producto. Cada tarifa cuenta con un plazo estimado de entrega y un valor específico. Puede agregar tantas tarifas como sean necesarias para componer su tabla de fletes."
    },
    view: {
      "editTable": "Editar Tabla",
      "saveError": "Error al guardar, por favor intente de nuevo.",
      "updateSuccess": "¡Tarifa actualizada!",
      "updateError": "Error al actualizar la tarifa",
      "addSuccess": "¡Tarifa agregada!",
      "addError": "Error al agregar la tarifa"
    }
  }
};

languages.forEach(lang => {
  const filePath = path.join(localesPath, lang, 'translation.json');

  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    let jsonContent = JSON.parse(fileContent);

    if (!jsonContent.carriers) jsonContent.carriers = {};
    if (!jsonContent.carriers.freightRates) jsonContent.carriers.freightRates = {};
    if (!jsonContent.carriers.freightRates.form) jsonContent.carriers.freightRates.form = {};
    if (!jsonContent.carriers.freightRates.view) jsonContent.carriers.freightRates.view = {};

    // Use Object.assign to merge carefully without overwriting existing keys from FreightRateForm.tsx!
    jsonContent.carriers.freightRates.form = {
        ...jsonContent.carriers.freightRates.form,
        ...missingTranslations[lang].form
    };

    jsonContent.carriers.freightRates.view = {
        ...jsonContent.carriers.freightRates.view,
        ...missingTranslations[lang].view
    };

    fs.writeFileSync(filePath, JSON.stringify(jsonContent, null, 2), 'utf8');
    console.log(`Updated ${lang}/translation.json`);
  } else {
    console.log(`File not found: ${filePath}`);
  }
});
