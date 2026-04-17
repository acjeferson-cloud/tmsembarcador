const fs = require('fs');
let content = fs.readFileSync('src/components/CTes/CTes.tsx', 'utf8');

content = content.replace(
  'rate = calculation.tarifaUtilizada?.gris_percentage || 0;',
  'rate = fullCTe.carrier_costs?.find((c: any) => c.cost_type === "gris_percentage")?.cost_value || 0;'
);

content = content.replace(
  'baseValue = calculation.icmsBase || 0;',
  'baseValue = parseFloat(fullCTe.carrier_costs?.find((c: any) => c.cost_type === "icms_base")?.cost_value?.toString() || "0");'
);

content = content.replace(
  'rate = calculation.icmsAliquota || 0;',
  'rate = parseFloat(fullCTe.carrier_costs?.find((c: any) => c.cost_type === "icms_rate")?.cost_value?.toString() || "0");'
);

fs.writeFileSync('src/components/CTes/CTes.tsx', content, 'utf8');
