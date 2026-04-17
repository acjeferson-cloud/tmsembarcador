const fs = require('fs'); let c = fs.readFileSync('src/services/cteDivergenceReportService.ts', 'utf8'); c = c.replace(/ï»¿/g, ''); fs.writeFileSync('src/services/cteDivergenceReportService.ts', c);
