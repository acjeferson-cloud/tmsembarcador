const fs = require('fs');
const files = ['pt', 'es', 'en'].map(lang => `src/locales/${lang}/translation.json`);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let json = JSON.parse(content);
  
  if (json.implementationCenter && json.implementationCenter.erpIntegration) {
    // translations to update
    json.implementationCenter.erpIntegration.cte.cteModel = "Modelo de CT-e";
    json.implementationCenter.erpIntegration.cte.invoiceModel = "Modelo de Fatura";
    
    json.implementationCenter.erpIntegration.billing.nfeItem = "Item padrão para CT-e";
    json.implementationCenter.erpIntegration.billing.usage = "Código de Utilização de CT-e";
    json.implementationCenter.erpIntegration.billing.controlAccount = "Conta Controle de CT-e";
    
    json.implementationCenter.erpIntegration.invoice.title = "Parâmetros Fiscais (Fatura)";
    json.implementationCenter.erpIntegration.invoice.transitoryAccount = "Código de Utilização Fatura";
    json.implementationCenter.erpIntegration.invoice.defaultItem = "Item padrão para Fatura";
  }
  
  fs.writeFileSync(file, JSON.stringify(json, null, 2));
}
console.log("Translations updated");
