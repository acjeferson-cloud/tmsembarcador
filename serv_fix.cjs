const fs = require('fs');
let c1 = fs.readFileSync('src/services/cteDivergenceReportService.ts', 'utf8');

c1 = c1.replace(
  "context?: { establishmentId?: string; establishmentName?: string; user?: any; logoBase64?: string }",
  "context?: { establishmentId?: string; establishmentName?: string; establishmentCnpj?: string; user?: any; logoBase64?: string }"
);

// ALSO update the database query to use CNPJ fallback if UUID fails, identically to orderPdfService
const fallbackQueryStr = `if (isUuid) {
                 query = query.eq('id', estId);
             } else {
                 query = query.eq('codigo', parseInt(estId) || 0);
             }`;

const newFallbackQueryStr = `if (isUuid) {
                 query = query.eq('id', estId);
             } else if (context?.establishmentCnpj) {
                 const cleanCnpj = context.establishmentCnpj.replace(/\\D/g, '');
                 query = query.eq('cnpj', cleanCnpj);
             } else {
                 query = query.eq('codigo', parseInt(estId) || 0);
             }`;

c1 = c1.replace(fallbackQueryStr, newFallbackQueryStr);

fs.writeFileSync('src/services/cteDivergenceReportService.ts', c1, 'utf8');
