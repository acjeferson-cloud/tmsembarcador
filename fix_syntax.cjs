const fs = require('fs');
let c1 = fs.readFileSync('src/services/cteDivergenceReportService.ts', 'utf8');

c1 = c1.replace(
  /let logoBase64: string \| undefined = context\?.logoBase64;/,
  "const drawHeader = () => {\n        let currentX = margin;\n        let logoBase64: string | undefined = context?.logoBase64;"
);

fs.writeFileSync('src/services/cteDivergenceReportService.ts', c1, 'utf8');
console.log('Restored const drawHeader = () => { syntax');
