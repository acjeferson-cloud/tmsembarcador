const fs = require('fs');

// Patch 1: freightCostCalculator.ts
const calcFile = 'c:/desenvolvimento/tmsembarcador/src/services/freightCostCalculator.ts';
let calcContent = fs.readFileSync(calcFile, 'utf8');

// adding taxaAdicional definition and sum
calcContent = calcContent.replace(
  "    const coletaEntrega = this.roundValue(semTaxas ? 0 : (tariff.coleta_entrega || 0));",
  "    const coletaEntrega = this.roundValue(semTaxas ? 0 : (tariff.coleta_entrega || 0));\n\n    // 9.1 TAXA ADICIONAL (da tabela)\n    const taxaAdicional = this.roundValue(semTaxas ? 0 : (tariff.taxa_adicional || 0));"
);

calcContent = calcContent.replace(
  "const baseCalculo = this.roundValue(fretePeso + freteValor + gris + pedagio + tas + seccat +\n                        despacho + itr + coletaEntrega + tda + tde + trt + tec);",
  "const baseCalculo = this.roundValue(fretePeso + freteValor + gris + pedagio + tas + seccat +\n                        despacho + itr + coletaEntrega + tda + tde + trt + tec + taxaAdicional);"
);

calcContent = calcContent.replace(
  "      tec,\n      outrosValores,\n      icmsBase,",
  "      tec,\n      taxaAdicional,\n      outrosValores,\n      icmsBase,"
);

fs.writeFileSync(calcFile, calcContent);
console.log("Patched freightCostCalculator.ts");

// Patch 2: QuoteResultsTable.tsx
const quoteFile = 'c:/desenvolvimento/tmsembarcador/src/components/FreightQuote/QuoteResultsTable.tsx';
let quoteContent = fs.readFileSync(quoteFile, 'utf8');

const additionalTaxHtml = `
                          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="text-xs text-gray-500 dark:text-gray-400">Taxa Adicional</div>
                            <div className="font-medium text-gray-900 dark:text-white mt-1">{formatCurrency(result.calculationDetails.taxaAdicional || 0)}</div>
                          </div>`;

quoteContent = quoteContent.replace(
  /<div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">\s*<div className="text-xs text-gray-500 dark:text-gray-400">TEC<\/div>/g,
  additionalTaxHtml + '\n                          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">\n                            <div className="text-xs text-gray-500 dark:text-gray-400">TEC</div>'
);

fs.writeFileSync(quoteFile, quoteContent);
console.log("Patched QuoteResultsTable.tsx");
