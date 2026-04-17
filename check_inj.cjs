const fs = require('fs');
let c1 = fs.readFileSync('src/services/ctesCompleteService.ts', 'utf8');

c1 = c1.replace(
  /carrier:carriers\(id,\s*codigo,\s*razao_social,\s*metadata,\s*sap_cardcode,\s*sap_bpl_id,\s*sap_due_days\)/g,
  "carrier:carriers(id, codigo, razao_social, metadata, email, telefone, sap_cardcode, sap_bpl_id, sap_due_days)"
);

c1 = c1.replace(
  /carrier:carriers\(id,\s*codigo,\s*razao_social,\s*sap_cardcode,\s*sap_bpl_id,\s*sap_due_days\)/g,
  "carrier:carriers(id, codigo, razao_social, email, telefone, sap_cardcode, sap_bpl_id, sap_due_days)"
);

fs.writeFileSync('src/services/ctesCompleteService.ts', c1, 'utf8');
