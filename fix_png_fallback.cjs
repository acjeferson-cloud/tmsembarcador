const fs = require('fs');
let cFallback = fs.readFileSync('src/services/cteDivergenceReportService.ts', 'utf8');

cFallback = cFallback.replace(
  /if \(logoBase64\) \{\s*try \{\s*doc\.addImage\(logoBase64, margin, margin, 40, 15\);/g,
  `if (logoBase64) {\n          try {\n            if (!logoBase64.startsWith('http') && !logoBase64.startsWith('data:')) {\n              logoBase64 = \`data:image/png;base64,\${logoBase64}\`;\n            }\n            doc.addImage(logoBase64, 'PNG', margin, margin, 40, 15);`
);

fs.writeFileSync('src/services/cteDivergenceReportService.ts', cFallback, 'utf8');
console.log("Added base64 prefix enforcement for logo rendering!");
