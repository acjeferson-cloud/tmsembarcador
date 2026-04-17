const fs = require('fs');
let c1 = fs.readFileSync('src/components/CTes/CTes.tsx', 'utf8');

c1 = c1.replace(
  " establishmentId={currentEstablishment.id}",
  " establishmentId={currentEstablishment.id}\n          establishmentCnpj={currentEstablishment.cnpj}"
);

fs.writeFileSync('src/components/CTes/CTes.tsx', c1, 'utf8');
