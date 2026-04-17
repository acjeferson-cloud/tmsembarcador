const fs = require('fs');
let cServ = fs.readFileSync('src/services/cteDivergenceReportService.ts', 'utf8');

cServ = cServ.replace(
  "async generatePDF(data: DivergenceReportData, context?: { establishmentId?: string; establishmentName?: string; user?: any }): Promise<Blob> {",
  "async generatePDF(data: DivergenceReportData, context?: { establishmentId?: string; establishmentName?: string; user?: any; logoBase64?: string }): Promise<Blob> {"
);

cServ = cServ.replace(
  "let logoBase64: string | undefined = undefined;",
  "let logoBase64: string | undefined = context?.logoBase64;"
);

cServ = cServ.replace(
  /if \(estId\) \{/g,
  "if (estId && !logoBase64) {"
);

fs.writeFileSync('src/services/cteDivergenceReportService.ts', cServ, 'utf8');
console.log("Updated cteDivergenceReportService.ts to use passed logoBase64!");
