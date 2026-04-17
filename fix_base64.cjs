const fs = require('fs');
let content = fs.readFileSync('src/components/CTes/CTes.tsx', 'utf8');

content = content.replace(
  /logoBase64=\{.*?logo_url\}/,
  "logoBase64={(authEstablishment as any)?.metadata?.logo_light_base64 || (authEstablishment as any)?.logo_light_base64 || (authEstablishment as any)?.logo_url || (authEstablishment as any)?.metadata?.logo_url}"
);

fs.writeFileSync('src/components/CTes/CTes.tsx', content, 'utf8');
console.log('Fixed ReportDivergenceModal authEstablishment logo parsing');
