const fs = require('fs');
let content = fs.readFileSync('src/components/CTes/ReportDivergenceModal.tsx', 'utf8');

content = content.replace("  userId,\r\n  onStatusUpdated\r\n}) => {", "  userId,\r\n  onStatusUpdated,\r\n  logoBase64\r\n}) => {");
content = content.replace("  userId,\n  onStatusUpdated\n}) => {", "  userId,\n  onStatusUpdated,\n  logoBase64\n}) => {");

fs.writeFileSync('src/components/CTes/ReportDivergenceModal.tsx', content, 'utf8');
console.log('Fixed ReportDivergenceModal props destructuring');
