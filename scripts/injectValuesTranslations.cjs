const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, '..', 'src', 'locales');
const languages = ['pt', 'en', 'es'];

const translationsToAdd = {
  pt: {
    carriers: {
      freightRates: {
        values: {
          title: "Valores da Tarifa",
          sectionValues: "Valores",
          sectionDetails: "Detalhes",
          pedagioMinimo: "Pedágio mínimo",
          pedagioPorKg: "Pedágio por KG",
          pedagioCadaKg: "Pedágio a cada KG",
          pedagioTipoKg: "Pedágio tipo KG",
          icmsEmbutido: "ICMS embutido na tabela",
          aliquotaIcms: "Alíquota ICMS",
          fatorM3: "Fator m³",
          fatorM3ApartirKg: "Fator m³ apartir Kg",
          fatorM3ApartirM3: "Fator m³ apartir M³",
          fatorM3ApartirValor: "Fator m³ a partir do valor",
          percentualGris: "% GRIS (até 5 casas decimais)",
          grisMinimo: "GRIS mínimo",
          seccat: "SECCAT",
          despacho: "Despacho",
          itr: "ITR",
          taxaAdicional: "Taxa adicional",
          coletaEntrega: "Coleta/Entrega",
          tdeTrt: "TDE/TRT",
          tas: "TAS",
          taxaSuframa: "Taxa SUFRAMA",
          valorOutrosPercent: "Valor outros %",
          valorOutrosMinimo: "Valor outros mínimo",
          taxaOutrosValor: "Taxa outros valor",
          taxaOutrosTipoValor: "Taxa outros tipo valor",
          taxaApartirDe: "Taxa a partir de",
          taxaApartirDeTipo: "Taxa a partir de tipo",
          taxaOutrosACada: "Taxa outros a cada",
          taxaOutrosMinima: "Taxa outros mínima",
          fretePesoMinimo: "Frete peso mínimo",
          freteValorMinimo: "Frete valor mínimo",
          freteToneladaMinima: "Frete tonelada mínima",
          fretePercentualMinimo: "Frete percentual mínimo",
          freteM3Minimo: "Frete m³ mínimo",
          valorTotalMinimo: "Valor total mínimo",
          addDetailRow: "Adicionar linha",
          detailsNoData: "Nenhum detalhe cadastrado",
          cancel: "Cancelar",
          saveValues: "Salvar Valores",
          pesoCalculo: "Peso cálculo",
          pesoReal: "Peso real",
          naoEmbutido: "Não embutido no valor",
          embutido: "Embutido no valor",
          valor: "Valor",
          percentual: "Percentual",
          semApartir: "Sem a partir",
          comApartir: "Com a partir",
          valorFaixa: "Valor faixa",
          excedente: "Excedente",
          normal: "Normal",
          expresso: "Expresso",
          comTaxas: "Com taxas",
          semTaxas: "Sem taxas",
          detailsTable: {
            ordem: "Ordem",
            pesoAte: "Peso até",
            m3Ate: "M³ até",
            volumeAte: "Volume até",
            valorAte: "Valor até",
            valorFaixaCol: "Valor da faixa",
            tipoCalculo: "Tipo de cálculo",
            tipoFrete: "Tipo frete",
            freteValor: "Frete valor",
            freteMinimo: "Frete mínimo",
            tipoTaxa: "Tipo taxa",
            taxaMinima: "Taxa mínima",
            acoes: "Ações"
          },
          infoExcedente: {
            title: "Tipo de Cálculo: Excedente",
            subtitle: "Como funciona:",
            desc1: "No tipo \"Excedente\", o valor final é calculado somando o valor da faixa anterior com o excedente multiplicado pelo valor por KG.",
            exampleTitle: "Exemplo: ",
            exampleDesc: "Peso da NF = 308 KG",
            li1: "Faixa anterior (até 200 KG): R$ 192,38",
            li2: "Peso excedente: 308 - 200 = 108 KG",
            li3: "Valor por KG excedente: R$ 0,84150",
            li4: "Cálculo: R$ 192,38 + (108 × R$ 0,84150) = R$ 283,26"
          },
          infoSemTaxas: {
            title: "Tipo Taxa: Sem Taxas",
            subtitle: "Atenção:",
            desc1: "Quando uma linha tiver Tipo taxa = \"Sem taxas\", o sistema irá IGNORAR todas as taxas adicionais configuradas nos campos acima (GRIS, Pedágio, SECCAT, Despacho, ITR, TAS, Coleta/Entrega, Taxa SUFRAMA, etc.).",
            desc2: "O cálculo considerará APENAS o valor da faixa (Frete Peso + Frete Valor)."
          }
        }
      }
    }
  },
  en: {
    carriers: {
      freightRates: {
        values: {
          title: "Tariff Values",
          sectionValues: "Values",
          sectionDetails: "Details",
          pedagioMinimo: "Minimum Toll",
          pedagioPorKg: "Toll per KG",
          pedagioCadaKg: "Toll every KG",
          pedagioTipoKg: "Toll KG Type",
          icmsEmbutido: "ICMS embedded in table",
          aliquotaIcms: "ICMS Rate",
          fatorM3: "Factor m³",
          fatorM3ApartirKg: "Factor m³ from Kg",
          fatorM3ApartirM3: "Factor m³ from M³",
          fatorM3ApartirValor: "Factor m³ from value",
          percentualGris: "% GRIS (up to 5 decimal places)",
          grisMinimo: "Minimum GRIS",
          seccat: "SECCAT",
          despacho: "Dispatch",
          itr: "ITR",
          taxaAdicional: "Additional Tax",
          coletaEntrega: "Collection/Delivery",
          tdeTrt: "TDE/TRT",
          tas: "TAS",
          taxaSuframa: "SUFRAMA Tax",
          valorOutrosPercent: "Other value %",
          valorOutrosMinimo: "Other value minimum",
          taxaOutrosValor: "Other tax value",
          taxaOutrosTipoValor: "Other tax value type",
          taxaApartirDe: "Tax starting from",
          taxaApartirDeTipo: "Tax starting from type",
          taxaOutrosACada: "Other tax every",
          taxaOutrosMinima: "Other tax minimum",
          fretePesoMinimo: "Minimum weight freight",
          freteValorMinimo: "Minimum value freight",
          freteToneladaMinima: "Minimum ton freight",
          fretePercentualMinimo: "Minimum percentage freight",
          freteM3Minimo: "Minimum m³ freight",
          valorTotalMinimo: "Minimum total value",
          addDetailRow: "Add row",
          detailsNoData: "No details registered",
          cancel: "Cancel",
          saveValues: "Save Values",
          pesoCalculo: "Calculation weight",
          pesoReal: "Real weight",
          naoEmbutido: "Not embedded in value",
          embutido: "Embedded in value",
          valor: "Value",
          percentual: "Percentage",
          semApartir: "Without starting from",
          comApartir: "With starting from",
          valorFaixa: "Range value",
          excedente: "Surplus",
          normal: "Normal",
          expresso: "Express",
          comTaxas: "With taxes",
          semTaxas: "Without taxes",
          detailsTable: {
            ordem: "Order",
            pesoAte: "Weight up to",
            m3Ate: "M³ up to",
            volumeAte: "Volume up to",
            valorAte: "Value up to",
            valorFaixaCol: "Range value",
            tipoCalculo: "Calculation type",
            tipoFrete: "Freight type",
            freteValor: "Freight value",
            freteMinimo: "Minimum freight",
            tipoTaxa: "Tax type",
            taxaMinima: "Minimum tax",
            acoes: "Actions"
          },
          infoExcedente: {
            title: "Calculation Type: Surplus",
            subtitle: "How it works:",
            desc1: "In the \"Surplus\" type, the final value is calculated by adding the value of the previous range to the surplus multiplied by the value per KG.",
            exampleTitle: "Example: ",
            exampleDesc: "Invoice Weight = 308 KG",
            li1: "Previous range (up to 200 KG): R$ 192.38",
            li2: "Surplus weight: 308 - 200 = 108 KG",
            li3: "Value per surplus KG: R$ 0.84150",
            li4: "Calculation: R$ 192.38 + (108 × R$ 0.84150) = R$ 283.26"
          },
          infoSemTaxas: {
            title: "Tax Type: Without Taxes",
            subtitle: "Attention:",
            desc1: "When a line has Tax Type = \"Without taxes\", the system will IGNORE all additional taxes configured in the fields above (GRIS, Toll, SECCAT, Dispatch, ITR, TAS, Collection/Delivery, SUFRAMA Tax, etc.).",
            desc2: "The calculation will consider ONLY the range value (Weight Freight + Value Freight)."
          }
        }
      }
    }
  },
  es: {
    carriers: {
      freightRates: {
        values: {
          title: "Valores de Tarifa",
          sectionValues: "Valores",
          sectionDetails: "Detalles",
          pedagioMinimo: "Peaje mínimo",
          pedagioPorKg: "Peaje por KG",
          pedagioCadaKg: "Peaje cada KG",
          pedagioTipoKg: "Tipo de Peaje KG",
          icmsEmbutido: "ICMS incluido en la tabla",
          aliquotaIcms: "Tasa ICMS",
          fatorM3: "Factor m³",
          fatorM3ApartirKg: "Factor m³ a partir de Kg",
          fatorM3ApartirM3: "Factor m³ a partir de M³",
          fatorM3ApartirValor: "Factor m³ a partir del valor",
          percentualGris: "% GRIS (hasta 5 decimales)",
          grisMinimo: "GRIS mínimo",
          seccat: "SECCAT",
          despacho: "Despacho",
          itr: "ITR",
          taxaAdicional: "Tasa adicional",
          coletaEntrega: "Recolección/Entrega",
          tdeTrt: "TDE/TRT",
          tas: "TAS",
          taxaSuframa: "Tasa SUFRAMA",
          valorOutrosPercent: "Otro valor %",
          valorOutrosMinimo: "Otro valor mínimo",
          taxaOutrosValor: "Otro valor de tasa",
          taxaOutrosTipoValor: "Tipo de valor de otra tasa",
          taxaApartirDe: "Tasa a partir de",
          taxaApartirDeTipo: "Tasa a partir del tipo",
          taxaOutrosACada: "Otra tasa cada",
          taxaOutrosMinima: "Otra tasa mínima",
          fretePesoMinimo: "Flete peso mínimo",
          freteValorMinimo: "Flete valor mínimo",
          freteToneladaMinima: "Flete tonelada mínima",
          fretePercentualMinimo: "Flete porcentual mínimo",
          freteM3Minimo: "Flete m³ mínimo",
          valorTotalMinimo: "Valor total mínimo",
          addDetailRow: "Añadir fila",
          detailsNoData: "No hay detalles registrados",
          cancel: "Cancelar",
          saveValues: "Guardar Valores",
          pesoCalculo: "Peso cálculo",
          pesoReal: "Peso real",
          naoEmbutido: "No incluido en el valor",
          embutido: "Incluido en el valor",
          valor: "Valor",
          percentual: "Porcentaje",
          semApartir: "Sin a partir de",
          comApartir: "Con a partir de",
          valorFaixa: "Valor de rango",
          excedente: "Excedente",
          normal: "Normal",
          expresso: "Expreso",
          comTaxas: "Con tasas",
          semTaxas: "Sin tasas",
          detailsTable: {
            ordem: "Orden",
            pesoAte: "Peso hasta",
            m3Ate: "M³ hasta",
            volumeAte: "Volumen hasta",
            valorAte: "Valor hasta",
            valorFaixaCol: "Valor del rango",
            tipoCalculo: "Tipo de cálculo",
            tipoFrete: "Tipo flete",
            freteValor: "Valor flete",
            freteMinimo: "Flete mínimo",
            tipoTaxa: "Tipo tasa",
            taxaMinima: "Tasa mínima",
            acoes: "Acciones"
          },
          infoExcedente: {
            title: "Tipo de Cálculo: Excedente",
            subtitle: "Cómo funciona:",
            desc1: "En el tipo \"Excedente\", el valor final se calcula sumando el valor del rango anterior con el excedente multiplicado por el valor por KG.",
            exampleTitle: "Ejemplo: ",
            exampleDesc: "Peso de NF = 308 KG",
            li1: "Rango anterior (hasta 200 KG): R$ 192,38",
            li2: "Peso excedente: 308 - 200 = 108 KG",
            li3: "Valor por KG excedente: R$ 0,84150",
            li4: "Cálculo: R$ 192,38 + (108 × R$ 0,84150) = R$ 283,26"
          },
          infoSemTaxas: {
            title: "Tipo Tasa: Sin Tasas",
            subtitle: "Atención:",
            desc1: "Cuando una línea tenga Tipo Tasa = \"Sin tasas\", el sistema IGNORARÁ todas las tasas adicionales configuradas en los campos anteriores (GRIS, Peaje, SECCAT, Despacho, ITR, TAS, Recolección/Entrega, Tasa SUFRAMA, etc.).",
            desc2: "El cálculo considerará SÓLO el valor del rango (Flete Peso + Flete Valor)."
          }
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

    // Ensure the nested path exists
    if (!jsonContent.carriers) jsonContent.carriers = {};
    if (!jsonContent.carriers.freightRates) jsonContent.carriers.freightRates = {};

    // Merge the new translations
    jsonContent.carriers.freightRates.values = translationsToAdd[lang].carriers.freightRates.values;

    fs.writeFileSync(filePath, JSON.stringify(jsonContent, null, 2), 'utf8');
    console.log(`Updated ${lang}/translation.json`);
  } else {
    console.log(`File not found: ${filePath}`);
  }
});
