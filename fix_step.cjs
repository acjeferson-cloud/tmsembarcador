const fs = require('fs');
const file = 'c:/desenvolvimento/tmsembarcador/src/components/FreightRates/FreightRateValuesForm.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/step="0\.01"/g, 'step="any"');
fs.writeFileSync(file, content);
