const fs = require('fs');

let content = fs.readFileSync('src/components/ImplementationCenter/ImplementationCenter.tsx', 'utf8');

// handleTestConnection and handleSaveErpConfig
content = content.replace(
  /cte_model: erpConfig\.cteModel,\s+invoice_model: erpConfig\.invoiceModel,\s+billing_nfe_item: erpConfig\.billingNFeItem,/g,
  "cte_model: erpConfig.cteModel,\n        invoice_model: erpConfig.invoiceModel,\n        invoice_default_item: erpConfig.invoiceDefaultItem,\n        billing_nfe_item: erpConfig.billingNFeItem,"
);

// handleERPFileUpload
content = content.replace(
  "cteModel: firstRecord.cte_model || '',\n          invoiceModel: firstRecord.invoice_model || '',\n          billingNFeItem: firstRecord.billing_nfe_item || '',",
  "cteModel: firstRecord.cte_model || '',\n          invoiceModel: firstRecord.invoice_model || '',\n          invoiceDefaultItem: '',\n          billingNFeItem: firstRecord.billing_nfe_item || '',"
);


fs.writeFileSync('src/components/ImplementationCenter/ImplementationCenter.tsx', content);
console.log("Done");
