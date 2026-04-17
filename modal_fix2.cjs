const fs = require('fs');
let c1 = fs.readFileSync('src/components/CTes/ReportDivergenceModal.tsx', 'utf8');

c1 = c1.replace(
  "  establishmentName,\r\n  userId,",
  "  establishmentName,\r\n  establishmentCnpj,\r\n  userId,"
);

c1 = c1.replace(
  "  establishmentName,\n  userId,",
  "  establishmentName,\n  establishmentCnpj,\n  userId,"
);

fs.writeFileSync('src/components/CTes/ReportDivergenceModal.tsx', c1, 'utf8');
