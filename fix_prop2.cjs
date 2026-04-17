const fs = require('fs');
let c1 = fs.readFileSync('src/components/CTes/ReportDivergenceModal.tsx', 'utf8');

c1 = c1.replace(
  /  establishmentName,\n  userId,\n  onStatusUpdated\n\}\) => \{/,
  "  establishmentName,\n  userId,\n  onStatusUpdated,\n  logoBase64\n}) => {"
);

fs.writeFileSync('src/components/CTes/ReportDivergenceModal.tsx', c1, 'utf8');
console.log("Fixed missing logoBase64 prop injection!");
