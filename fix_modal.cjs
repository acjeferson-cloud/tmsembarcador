const fs = require('fs');
let codal = fs.readFileSync('src/components/CTes/ReportDivergenceModal.tsx', 'utf8');

codal = codal.replace('establishmentName: string;', "establishmentName: string;\n    logoBase64?: string;");
codal = codal.replace(
  /\{ establishmentId,\s*establishmentName,\s*user:\s*\{\s*id:\s*userId\s*\}\s*\}/g,
  "{ establishmentId, establishmentName, user: { id: userId }, logoBase64 }"
);

fs.writeFileSync('src/components/CTes/ReportDivergenceModal.tsx', codal, 'utf8');
console.log("Updated ReportDivergenceModal.tsx interface and usage!");
