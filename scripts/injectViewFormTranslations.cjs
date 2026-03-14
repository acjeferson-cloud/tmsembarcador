const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, '..', 'src', 'locales');
const languages = ['pt', 'en', 'es'];

const translationsToAdd = {
  pt: {
    carriers: {
      freightRates: {
        view: {
          back: "Voltar para Tarifas",
          title: "Visualizar Tarifa",
          subtitle: "Detalhes completos da tarifa",
          edit: "Editar",
          cities: "Cidades",
          delete: "Excluir",
          code: "Código",
          value: "Valor",
          deliveryTime: "Prazo de Entrega",
          day_one: "dia",
          day_other: "dias",
          applicationDetails: "Detalhes de Aplicação",
          byCity: "Por Cidade",
          byClient: "Por Cliente",
          byProduct: "Por Produto",
          applicationCity: "Esta tarifa é aplicada com base na cidade de origem e destino.",
          applicationClient: "Esta tarifa é aplicada com base no cliente específico.",
          applicationProduct: "Esta tarifa é aplicada com base no tipo de produto transportado.",
          estimatedDelivery: "Prazo estimado para entrega",
          valueInfo: "Informações de Valor",
          tariffValue: "Valor da tarifa",
          observations: "Observações",
          aboutTariffs: "Sobre Tarifas",
          aboutTariffsDesc: "As tarifas definem os valores e prazos de entrega para diferentes aplicações. Cada tarifa possui um código único e pode ser aplicada por cidade, cliente ou produto.",
          valueDesc: "Custo do frete para esta aplicação",
          prazoDesc: "Tempo estimado para entrega",
          application: "Aplicação",
          applicationDesc: "Critério para aplicação da tarifa",
          confirmDelete: "Tem certeza que deseja excluir esta tarifa?"
        },
        form: {
          back: "Voltar para Tarifas",
          editTitle: "Editar Tarifa",
          newTitle: "Nova Tarifa",
          subtitle: "Preencha os dados da tarifa e defina os valores por faixa",
          cities: "Cidades",
          additionalFees: "Taxas Adicionais",
          tabValues: "Valores",
          tabDetails: "Detalhes",
          tariffValues: "Valores da Tarifa",
          establishment: "Estabelecimento",
          carrier: "Transportador",
          validityStart: "Início da validade",
          tariffCode: "Código da tarifa",
          description: "Descrição",
          tariffType: "Tipo de tarifa",
          type: "Tipo",
          quantVolumes: "Quantidade de Volumes",
          cubicMeters: "Metros Cúbicos (m³)",
          merchandiseValue: "Valor da Mercadoria (R$)",
          ex10: "Ex: 10",
          ex2500: "Ex: 2.500",
          ex15000: "Ex: 15000.00",
          atLeastOneRange: "É necessário manter pelo menos uma faixa de valor.",
          descRequired: "Descrição da tarifa é obrigatória",
          prazoMin: "Prazo de entrega deve ser pelo menos 1 dia",
          valueNotNegative: "Valor não pode ser negativo"
        }
      }
    }
  },
  en: {
    carriers: {
      freightRates: {
        view: {
          back: "Back to Rates",
          title: "View Tariff",
          subtitle: "Complete tariff details",
          edit: "Edit",
          cities: "Cities",
          delete: "Delete",
          code: "Code",
          value: "Value",
          deliveryTime: "Delivery Time",
          day_one: "day",
          day_other: "days",
          applicationDetails: "Application Details",
          byCity: "By City",
          byClient: "By Client",
          byProduct: "By Product",
          applicationCity: "This tariff is applied based on the origin and destination city.",
          applicationClient: "This tariff is applied based on the specific client.",
          applicationProduct: "This tariff is applied based on the type of product transported.",
          estimatedDelivery: "Estimated delivery time",
          valueInfo: "Value Information",
          tariffValue: "Tariff value",
          observations: "Observations",
          aboutTariffs: "About Tariffs",
          aboutTariffsDesc: "Tariffs define the values and delivery times for different applications. Each tariff has a unique code and can be applied by city, client, or product.",
          valueDesc: "Freight cost for this application",
          prazoDesc: "Estimated delivery time",
          application: "Application",
          applicationDesc: "Criteria for tariff application",
          confirmDelete: "Are you sure you want to delete this tariff?"
        },
        form: {
          back: "Back to Rates",
          editTitle: "Edit Tariff",
          newTitle: "New Tariff",
          subtitle: "Fill in the tariff details and define the range values",
          cities: "Cities",
          additionalFees: "Additional Fees",
          tabValues: "Values",
          tabDetails: "Details",
          tariffValues: "Tariff Values",
          establishment: "Establishment",
          carrier: "Carrier",
          validityStart: "Validity start",
          tariffCode: "Tariff code",
          description: "Description",
          tariffType: "Tariff type",
          type: "Type",
          quantVolumes: "Volumes Quantity",
          cubicMeters: "Cubic Meters (m³)",
          merchandiseValue: "Merchandise Value (R$)",
          ex10: "Ex: 10",
          ex2500: "Ex: 2.500",
          ex15000: "Ex: 15000.00",
          atLeastOneRange: "It is necessary to keep at least one price range.",
          descRequired: "Tariff description is required",
          prazoMin: "Delivery time must be at least 1 day",
          valueNotNegative: "Value cannot be negative"
        }
      }
    }
  },
  es: {
    carriers: {
      freightRates: {
        view: {
          back: "Volver a Tarifas",
          title: "Ver Tarifa",
          subtitle: "Detalles completos de la tarifa",
          edit: "Editar",
          cities: "Ciudades",
          delete: "Eliminar",
          code: "Código",
          value: "Valor",
          deliveryTime: "Tiempo de Entrega",
          day_one: "día",
          day_other: "días",
          applicationDetails: "Detalles de Aplicación",
          byCity: "Por Ciudad",
          byClient: "Por Cliente",
          byProduct: "Por Producto",
          applicationCity: "Esta tarifa se aplica en función de la ciudad de origen y destino.",
          applicationClient: "Esta tarifa se aplica en función del cliente específico.",
          applicationProduct: "Esta tarifa se aplica en función del tipo de producto transportado.",
          estimatedDelivery: "Tiempo estimado de entrega",
          valueInfo: "Información de Valor",
          tariffValue: "Valor de la tarifa",
          observations: "Observaciones",
          aboutTariffs: "Sobre las Tarifas",
          aboutTariffsDesc: "Las tarifas definen los valores y tiempos de entrega para diferentes aplicaciones. Cada tarifa tiene un código único y puede aplicarse por ciudad, cliente o producto.",
          valueDesc: "Costo del flete para esta aplicación",
          prazoDesc: "Tiempo estimado de entrega",
          application: "Aplicación",
          applicationDesc: "Criterio para aplicar la tarifa",
          confirmDelete: "¿Está seguro de que desea eliminar esta tarifa?"
        },
        form: {
          back: "Volver a Tarifas",
          editTitle: "Editar Tarifa",
          newTitle: "Nueva Tarifa",
          subtitle: "Complete los datos de la tarifa y defina los valores por rango",
          cities: "Ciudades",
          additionalFees: "Cargos Adicionales",
          tabValues: "Valores",
          tabDetails: "Detalles",
          tariffValues: "Valores de Tarifa",
          establishment: "Establecimiento",
          carrier: "Transportista",
          validityStart: "Inicio de validez",
          tariffCode: "Código de tarifa",
          description: "Descripción",
          tariffType: "Tipo de tarifa",
          type: "Tipo",
          quantVolumes: "Cantidad de Volúmenes",
          cubicMeters: "Metros Cúbicos (m³)",
          merchandiseValue: "Valor de la Mercancía (R$)",
          ex10: "Ej: 10",
          ex2500: "Ej: 2.500",
          ex15000: "Ej: 15000.00",
          atLeastOneRange: "Es necesario mantener por lo menos un rango de precio.",
          descRequired: "La descripción de la tarifa es obligatoria",
          prazoMin: "El tiempo de entrega debe ser al menos 1 día",
          valueNotNegative: "El valor no puede ser negativo"
        }
      }
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

    jsonContent.carriers.freightRates.view = translationsToAdd[lang].carriers.freightRates.view;
    jsonContent.carriers.freightRates.form = translationsToAdd[lang].carriers.freightRates.form;

    fs.writeFileSync(filePath, JSON.stringify(jsonContent, null, 2), 'utf8');
    console.log(`Updated ${lang}/translation.json`);
  } else {
    console.log(`File not found: ${filePath}`);
  }
});
