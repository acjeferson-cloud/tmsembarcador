const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, '..', 'src', 'locales');
const languages = ['pt', 'en', 'es'];

const viewTranslations = {
  pt: {
    "carrier": "Transportador:",
    "validity": "Validade",
    "to": "a",
    "status": "Status",
    "statusActive": "Ativo",
    "statusInactive": "Inativo",
    "ratesCount": "Quantidade de Tarifas",
    "registeredRates": "tarifas cadastradas",
    "situation": "Situação",
    "current": "Vigente",
    "notCurrent": "Não Vigente",
    "transportModal": "Modal de Transporte",
    "road": "Rodoviário",
    "air": "Aéreo",
    "water": "Aquaviário",
    "rail": "Ferroviário",
    "byCity": "Por Cidade",
    "byClient": "Por Cliente",
    "byProduct": "Por Produto",
    "rates": "Tarifas",
    "actions": "Ações",
    "code": "Código",
    "description": "Descrição",
    "type": "Tipo",
    "deadline": "Prazo",
    "value": "Valor",
    "noRates": "Nenhuma tarifa cadastrada",
    "viewAction": "Visualizar",
    "editAction": "Editar",
    "duplicateAction": "Duplicar Tarifa",
    "manageCitiesAction": "Gerenciar Cidades",
    "deleteAction": "Excluir",
    "summaryByType": "Resumo por Tipo de Aplicação",
    "creationDate": "Data de Criação",
    "lastAlteredBy": "Última Alteração Por",
    "user": "Usuário: ",
    "lastAlteredDate": "Data da Última Alteração",
    "aboutRatesTitle": "Sobre as Tarifas",
    "aboutRatesDesc": "As tarifas definem os valores e prazos de entrega para diferentes aplicações. Cada tarifa possui um código único e pode ser aplicada por cidade, cliente ou produto.",
    "aboutCityDesc": "Aplica-se apenas a cidades específicas.",
    "aboutClientDesc": "Direcionada para clientes específicos.",
    "aboutProductDesc": "Baseada no tipo de produto transportado."
  },
  en: {
    "carrier": "Carrier:",
    "validity": "Validity",
    "to": "to",
    "status": "Status",
    "statusActive": "Active",
    "statusInactive": "Inactive",
    "ratesCount": "Number of Rates",
    "registeredRates": "rates registered",
    "situation": "Situation",
    "current": "Current",
    "notCurrent": "Not Current",
    "transportModal": "Transport Mode",
    "road": "Road",
    "air": "Air",
    "water": "Water",
    "rail": "Rail",
    "byCity": "By City",
    "byClient": "By Client",
    "byProduct": "By Product",
    "rates": "Rates",
    "actions": "Actions",
    "code": "Code",
    "description": "Description",
    "type": "Type",
    "deadline": "Deadline",
    "value": "Value",
    "noRates": "No rates registered",
    "viewAction": "View",
    "editAction": "Edit",
    "duplicateAction": "Duplicate Rate",
    "manageCitiesAction": "Manage Cities",
    "deleteAction": "Delete",
    "summaryByType": "Summary by Application Type",
    "creationDate": "Creation Date",
    "lastAlteredBy": "Last Altered By",
    "user": "User: ",
    "lastAlteredDate": "Last Altered Date",
    "aboutRatesTitle": "About Rates",
    "aboutRatesDesc": "Rates define the values and delivery deadlines for different applications. Each rate has a unique code and can be applied by city, client, or product.",
    "aboutCityDesc": "Applies only to specific cities.",
    "aboutClientDesc": "Directed to specific clients.",
    "aboutProductDesc": "Based on the type of product transported."
  },
  es: {
    "carrier": "Transportista:",
    "validity": "Validez",
    "to": "a",
    "status": "Estado",
    "statusActive": "Activo",
    "statusInactive": "Inactivo",
    "ratesCount": "Cantidad de Tarifas",
    "registeredRates": "tarifas registradas",
    "situation": "Situación",
    "current": "Vigente",
    "notCurrent": "No Vigente",
    "transportModal": "Modo de Transporte",
    "road": "Terrestre",
    "air": "Aéreo",
    "water": "Marítimo",
    "rail": "Ferroviario",
    "byCity": "Por Ciudad",
    "byClient": "Por Cliente",
    "byProduct": "Por Producto",
    "rates": "Tarifas",
    "actions": "Acciones",
    "code": "Código",
    "description": "Descripción",
    "type": "Tipo",
    "deadline": "Plazo",
    "value": "Valor",
    "noRates": "Ninguna tarifa registrada",
    "viewAction": "Ver",
    "editAction": "Editar",
    "duplicateAction": "Duplicar Tarifa",
    "manageCitiesAction": "Gestionar Ciudades",
    "deleteAction": "Eliminar",
    "summaryByType": "Resumen por Tipo de Aplicación",
    "creationDate": "Fecha de Creación",
    "lastAlteredBy": "Última Modificación Por",
    "user": "Usuario: ",
    "lastAlteredDate": "Fecha de Última Modificación",
    "aboutRatesTitle": "Sobre las Tarifas",
    "aboutRatesDesc": "Las tarifas definen los valores y plazos de entrega para diferentes aplicaciones. Cada tarifa tiene un código único y puede ser aplicada por ciudad, cliente o producto.",
    "aboutCityDesc": "Se aplica solo a ciudades específicas.",
    "aboutClientDesc": "Dirigida a clientes específicos.",
    "aboutProductDesc": "Basada en el tipo de producto transportado."
  }
};

languages.forEach(lang => {
  const filePath = path.join(localesPath, lang, 'translation.json');

  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    let jsonContent = JSON.parse(fileContent);

    if (!jsonContent.carriers) jsonContent.carriers = {};
    if (!jsonContent.carriers.freightRates) jsonContent.carriers.freightRates = {};
    if (!jsonContent.carriers.freightRates.view) jsonContent.carriers.freightRates.view = {};

    jsonContent.carriers.freightRates.view = {
        ...jsonContent.carriers.freightRates.view,
        ...viewTranslations[lang]
    };

    fs.writeFileSync(filePath, JSON.stringify(jsonContent, null, 2), 'utf8');
    console.log(`Updated ${lang}/translation.json`);
  } else {
    console.log(`File not found: ${filePath}`);
  }
});
