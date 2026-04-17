const fs = require('fs');
let c1 = fs.readFileSync('src/services/cteDivergenceReportService.ts', 'utf8');

c1 = c1.replace(/'EMPRESA Nǟ'O INFORMADA'/, "'EMPRESA NÃO INFORMADA'");

fs.writeFileSync('src/services/cteDivergenceReportService.ts', c1, 'utf8');
