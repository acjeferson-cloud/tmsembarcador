const fs = require('fs');
let c1 = fs.readFileSync('src/services/cteDivergenceReportService.ts', 'utf8');

c1 = c1.replace(
  "doc.addImage(logoBase64, 'PNG', margin, margin, 40, 15);",
  "doc.addImage(logoBase64, margin, margin, 40, 15);"
);

fs.writeFileSync('src/services/cteDivergenceReportService.ts', c1, 'utf8');
console.log('Removed explicit PNG param from addImage to avoid format crashing');
