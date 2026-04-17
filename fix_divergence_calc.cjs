const fs = require('fs');
let content = fs.readFileSync('src/components/CTes/CTes.tsx', 'utf8');

const regex = /let calculation;\s*try {\s*calculation = await freightCostCalculator\.calculateCTeCost\(fullCTe\);\s*} catch \w+[\s\S]*?return;\s*\}/m;

const replacement = `      const getPersistCost = (key: string) => {
          return parseFloat(fullCTe.carrier_costs?.find((c: any) => c.cost_type === key)?.cost_value?.toString() || '0');
      };
      
      const calculation: any = {
          fretePeso: getPersistCost('freight_weight'),
          freteValor: getPersistCost('freight_value'),
          gris: getPersistCost('gris'),
          pedagio: getPersistCost('toll'),
          tas: getPersistCost('tas'),
          seccat: getPersistCost('seccat'),
          despacho: getPersistCost('dispatch'),
          itr: getPersistCost('itr'),
          coletaEntrega: getPersistCost('collection_delivery'),
          icmsValor: getPersistCost('icms_value'),
          outrosValores: getPersistCost('other_value')
      };`;

content = content.replace(regex, replacement);

fs.writeFileSync('src/components/CTes/CTes.tsx', content, 'utf8');
