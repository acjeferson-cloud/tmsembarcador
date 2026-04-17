const fs = require('fs');
let content = fs.readFileSync('src/components/CTes/CTes.tsx', 'utf8');

const regex = /let calculation;\s*try {\s*calculation = await freightCostCalculator\.calculateCTeCost\(fullCTe\);\s*} catch [^{]+\{[\s\S]*?setIsLoading\(false\);\s*return;\s*}/m;

const match = content.match(regex);
if (match) {
    console.log("Matched: " + match[0].substring(0, 50));
    const replacement = `const getPersistCost = (key: string) => {
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
    console.log("Success");
} else {
    console.log("regex not matched");
}
