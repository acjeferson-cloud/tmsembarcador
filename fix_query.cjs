const fs = require('fs');
let c = fs.readFileSync('src/services/cteDivergenceReportService.ts', 'utf8');

c = c.replace(/query = query\.eq\('codigo', estId\)\.or\(`establishment_id\.eq\.\$\{estId\}`\);/g, "query = query.eq('codigo', parseInt(estId) || 0);");

fs.writeFileSync('src/services/cteDivergenceReportService.ts', c, 'utf8');
console.log('Fixed query eq');
