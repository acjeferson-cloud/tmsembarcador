const fs = require('fs');
let content = fs.readFileSync('src/components/CTes/ReportDivergenceModal.tsx', 'utf8');

// Update Interface
content = content.replace(
  "establishmentName: string;\r\n  userId: string;",
  "establishmentName: string;\n  establishmentCnpj?: string;\n  logoBase64?: string;\n  userId: string;"
);

content = content.replace(
  "establishmentName: string;\n  userId: string;",
  "establishmentName: string;\n  establishmentCnpj?: string;\n  logoBase64?: string;\n  userId: string;"
);

// Update props extraction
content = content.replace(
  "establishmentId,\r\n  establishmentName,\r\n  userId\r\n}) => {",
  "establishmentId,\n  establishmentName,\n  establishmentCnpj,\n  logoBase64,\n  userId\n}) => {"
);

content = content.replace(
  "establishmentId,\n  establishmentName,\n  userId\n}) => {",
  "establishmentId,\n  establishmentName,\n  establishmentCnpj,\n  logoBase64,\n  userId\n}) => {"
);

// Update generatePDF in handleDownloadPDF
content = content.replace(
  "const pdfBlob = await cteDivergenceReportService.generatePDF(cteData, establishmentName);",
  "const pdfBlob = await cteDivergenceReportService.generatePDF(cteData, { establishmentId, establishmentName, establishmentCnpj, user: { id: userId }, logoBase64 });"
);

// Update generatePDF in handleSendByEmail
// Wait, in handleSendByEmail I already replaced it! Let's check handleSendByEmail
// Actually let's just do a global replace for any bad generatePDF call
content = content.replace(
  /const pdfBlob = await cteDivergenceReportService\.generatePDF\(cteData, establishmentName\);/g,
  "const pdfBlob = await cteDivergenceReportService.generatePDF(cteData, { establishmentId, establishmentName, establishmentCnpj, user: { id: userId }, logoBase64 });"
);

fs.writeFileSync('src/components/CTes/ReportDivergenceModal.tsx', content, 'utf8');
