const fs = require('fs');
let c = fs.readFileSync('src/services/cteDivergenceReportService.ts', 'utf8');

c = c.replace(/RELAT[^\"]+CT-E/g, 'RELAT\u00D3RIO DE DIVERG\u00CANCIA - CT-E');
c = c.replace(/INFORMA[^\"]+INICIAIS/g, 'INFORMA\u00C7\u00D5ES INICIAIS');
c = c.replace(/Emiss[^\"]+o CT-e/g, 'Emiss\u00E3o CT-e');
c = c.replace(/AN[^\"]+LISE DE DIVERG[^\"]+DETALHADA/g, 'AN\u00C1LISE DE DIVERG\u00CANCIAS DETALHADA');
c = c.replace(/Descri[^\"]+Taxa/g, 'Descri\u00E7\u00E3o da Taxa');
c = c.replace(/Diferen[^\"]+Absoluta/g, 'Diferen\u00E7a Absoluta');
c = c.replace(/Diferen[^\"]+%/g, 'Diferen\u00E7a %');
c = c.replace(/Situa[^\"]+o/g, 'Situa\u00E7\u00E3o');
c = c.replace(/Gestor de Log[^\"]+Auditoria/g, 'Gestor de Log\u00EDstica / Auditoria');
c = c.replace(/Um [^\"]+nico sistema/g, 'Um \u00FAnico sistema');
c = c.replace(/P[^\"]+gina \${i}/g, 'P\u00E1gina ${i}');
c = c.replace(/P[^\"]+gina \${pageNumber}/g, 'P\u00E1gina ${pageNumber}');

fs.writeFileSync('src/services/cteDivergenceReportService.ts', c, 'utf8');
console.log("Strings fixed successfully!");
