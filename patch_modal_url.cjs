const fs = require('fs');
let content = fs.readFileSync('src/components/CTes/ReportDivergenceModal.tsx', 'utf8');

// Update Interface
content = content.replace(
  "logoBase64?: string;\n  userId: string;",
  "logoBase64?: string;\n  logoUrl?: string;\n  userId: string;"
);

// Update props extraction
content = content.replace(
  "logoBase64,\n  userId\n}) => {",
  "logoBase64,\n  logoUrl,\n  userId\n}) => {"
);

// Update email body generation
content = content.replace(
  "          let logoSrc = logoBase64 || '';\n          if (logoSrc && !logoSrc.startsWith('http') && !logoSrc.startsWith('data:')) {\n            logoSrc = `data:image/png;base64,${logoSrc}`;\n          }",
  "          let logoSrc = logoUrl || (logoBase64?.startsWith('http') ? logoBase64 : '');\n          // Avoid using base64 for images in email as Gmail strips data:image/png;base64 URIs"
);

fs.writeFileSync('src/components/CTes/ReportDivergenceModal.tsx', content, 'utf8');
