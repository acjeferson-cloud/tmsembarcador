const fs = require('fs');
const files = ['pt', 'es', 'en'].map(lang => `src/locales/${lang}/translation.json`);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let json = JSON.parse(content);
  
  if (json.implementationCenter && json.implementationCenter.erpIntegration) {
    json.implementationCenter.erpIntegration.invoice.inboundControlAccount = "Conta Controle de Fatura";
  }
  
  fs.writeFileSync(file, JSON.stringify(json, null, 2));
}
console.log("Translations updated");
