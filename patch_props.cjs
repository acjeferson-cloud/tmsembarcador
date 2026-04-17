const fs = require('fs');
let c1 = fs.readFileSync('src/components/CTes/CTes.tsx', 'utf8');

c1 = c1.replace(
  "logoBase64={(currentEstablishment as any).metadata?.logo_light_base64 || (currentEstablishment as any).logo_light_base64 || (currentEstablishment as any).logo_url || (currentEstablishment as any).metadata?.logo_light_url || (currentEstablishment as any).metadata?.logo_url}",
  "logoBase64={(currentEstablishment as any).metadata?.logo_light_base64 || (currentEstablishment as any).logo_light_base64 || (currentEstablishment as any).logo_url || (currentEstablishment as any).metadata?.logo_light_url || (currentEstablishment as any).metadata?.logo_url}\n            logoUrl={(currentEstablishment as any).metadata?.logo_light_url || (currentEstablishment as any).metadata?.logo_url || (currentEstablishment as any).logo_url || ''}"
);

fs.writeFileSync('src/components/CTes/CTes.tsx', c1, 'utf8');
