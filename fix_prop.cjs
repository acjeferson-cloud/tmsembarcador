const fs = require('fs');
let c1 = fs.readFileSync('src/components/CTes/CTes.tsx', 'utf8');

c1 = c1.replace(
  "establishmentName={currentEstablishment.name}",
  "establishmentName={(currentEstablishment as any).razao_social || (currentEstablishment as any).razaoSocial || (currentEstablishment as any).name || ''}"
);

fs.writeFileSync('src/components/CTes/CTes.tsx', c1, 'utf8');
