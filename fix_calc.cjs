const fs = require('fs');
let c = fs.readFileSync('src/components/CTes/CTes.tsx', 'utf8');

const oldMappingStart = c.indexOf('const costMapping = [');
const mapEnd = c.indexOf('});', oldMappingStart);

if (oldMappingStart > -1 && mapEnd > -1) {
    const newStr = `const costMapping = [
        { key: 'fretePeso', xmlField: 'freight_weight_value', name: 'Frete Peso' },
        { key: 'freteValor', xmlField: 'freight_value_value', name: 'Frete Valor' },
        { key: 'gris', xmlField: 'ademe_gris_value', name: 'GRIS' },
        { key: 'pedagio', xmlField: 'toll_value', name: 'Pedágio' },
        { key: 'tas', xmlField: 'tas_value', name: 'TAS' },
        { key: 'seccat', xmlField: 'seccat_value', name: 'SECCAT' },
        { key: 'despacho', xmlField: 'dispatch_value', name: 'Despacho' },
        { key: 'itr', xmlField: 'itr_value', name: 'ITR' },
        { key: 'coletaEntrega', xmlField: 'collection_delivery_value', name: 'Coleta/Entrega' },
        { key: 'icmsValor', xmlField: 'icms_value', name: 'ICMS' },
        { key: 'outrosValores', xmlField: 'other_value', name: 'Outros Valores' }
      ];
      
      const comparisonData = costMapping.map(cost => {
        const tmsValue = calculation[cost.key] || 0;
        const cteValueRaw = fullCTe[cost.xmlField];
        const cteValue = cteValueRaw ? parseFloat(cteValueRaw.toString()) : 0;
        
        const difference = cteValue - tmsValue;
        const percentDifference = tmsValue !== 0 ? (difference / tmsValue) * 100 : 0;
        
        let formula = 'Cálculo padrão';
        let baseValue = 0;
        let rate = 0;
        
        if (cost.key === 'gris') {
          const totalMercadoria = fullCTe.invoices?.reduce((sum, inv) => 
            sum + parseFloat(inv.valor_nota?.toString() || '0'), 0
          ) || 0;
          formula = 'Valor da Mercadoria x % GRIS';
          baseValue = totalMercadoria;
          rate = calculation.tarifaUtilizada?.gris_percentage || 0;
        } else if (cost.key === 'icmsValor') {
          formula = 'Base ICMS x Alíquota';
          baseValue = calculation.icmsBase || 0;
          rate = calculation.icmsAliquota || 0;
        }

        return {
          taxName: cost.name,
          tmsValue,
          cteValue,
          difference,
          percentDifference,
          status: Math.abs(difference) < 0.01 ? 'correct' : 'divergent',
          calculation: {
            formula,
            baseValue,
            rate,
            result: tmsValue
          }
        };
      }).filter(item => item.tmsValue > 0 || item.cteValue > 0);`;

     // Find the exact boundaries: from `const costMapping = [` to `}).filter(item => item.tmsValue > 0 || item.cteValue > 0);`
     const endFilter = c.indexOf('item.cteValue > 0);', oldMappingStart);
     if(endFilter > -1) {
         c = c.substring(0, oldMappingStart) + newStr + c.substring(endFilter + 19);
         fs.writeFileSync('src/components/CTes/CTes.tsx', c, 'utf8');
         console.log('Fixed calculation differences!');
     } else {
         console.log('Filter end not found');
     }
}
