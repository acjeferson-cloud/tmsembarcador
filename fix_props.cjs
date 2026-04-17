const fs = require('fs');
let cTest = fs.readFileSync('src/components/CTes/CTes.tsx', 'utf8');

cTest = cTest.replace(
  /establishmentId=\{currentEstablishment\.id\}\n\s*establishmentName=\{currentEstablishment\.name\}/g,
  "establishmentId={currentEstablishment.id}\n          establishmentName={currentEstablishment.name}\n          logoBase64={(currentEstablishment as any).metadata?.logo_light_base64 || (currentEstablishment as any).logo_light_base64 || (currentEstablishment as any).logo_url || (currentEstablishment as any).metadata?.logo_url}"
);
fs.writeFileSync('src/components/CTes/CTes.tsx', cTest, 'utf8');
console.log("Updated CTes.tsx properties passed to modal!");
