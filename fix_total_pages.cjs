const fs = require('fs');
let c1 = fs.readFileSync('src/services/cteDivergenceReportService.ts', 'utf8');

c1 = c1.replace(
  "let yPos = drawHeader();",
  "let yPos = drawHeader();\n      let totalPages = 1;"
);

fs.writeFileSync('src/services/cteDivergenceReportService.ts', c1, 'utf8');
