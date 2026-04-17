const fs = require('fs');
let c1 = fs.readFileSync('src/services/cteDivergenceReportService.ts', 'utf8');

c1 = c1.replace(
  "let cnpj = '';",
  "let cnpj = context?.establishmentCnpj || '';"
);

c1 = c1.replace(
  "if (estId && !logoBase64) {",
  "if (estId) { // FOrcing DB query always to guarantee metadata"
);

fs.writeFileSync('src/services/cteDivergenceReportService.ts', c1, 'utf8');
