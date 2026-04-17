const fs = require('fs');
let c1 = fs.readFileSync('src/services/ctesCompleteService.ts', 'utf8');

// The safest way is to find carrier:carriers(...) and replace its content with all desired fields.
c1 = c1.replace(
  /carrier:carriers\([^)]+\)/g,
  "carrier:carriers(id, codigo, razao_social, cnpj, metadata, email, telefone, sap_cardcode, sap_bpl_id, sap_due_days)"
);

fs.writeFileSync('src/services/ctesCompleteService.ts', c1, 'utf8');
