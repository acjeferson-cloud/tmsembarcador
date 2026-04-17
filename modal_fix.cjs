const fs = require('fs');
let c1 = fs.readFileSync('src/components/CTes/ReportDivergenceModal.tsx', 'utf8');

c1 = c1.replace(
  "establishmentName: string;",
  "establishmentName: string;\n  establishmentCnpj?: string;"
);

c1 = c1.replace(
  "establishmentName,\n  userId,\n  onStatusUpdated,\n  logoBase64\n}) => {",
  "establishmentName,\n  establishmentCnpj,\n  userId,\n  onStatusUpdated,\n  logoBase64\n}) => {"
);

c1 = c1.replace(
  "const pdfBlob = await cteDivergenceReportService.generatePDF(cteData, { establishmentId, establishmentName, user: { id: userId }, logoBase64 });",
  "const pdfBlob = await cteDivergenceReportService.generatePDF(cteData, { establishmentId, establishmentName, establishmentCnpj, user: { id: userId }, logoBase64 });"
);

fs.writeFileSync('src/components/CTes/ReportDivergenceModal.tsx', c1, 'utf8');
