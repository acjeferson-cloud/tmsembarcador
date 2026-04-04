const fs = require('fs');
let content = fs.readFileSync('tms-erp-proxy/index.js', 'utf8');

const carrierSearch = `          if (!carrierDocumentStr && bpData.BPFiscalTaxIDCollection && bpData.BPFiscalTaxIDCollection.length > 0) {
             const taxIdObj = bpData.BPFiscalTaxIDCollection.find(t => t.TaxId0 || t.TaxId1 || t.TaxId4);
             if (taxIdObj) carrierDocumentStr = (taxIdObj.TaxId0 || taxIdObj.TaxId1 || taxIdObj.TaxId4 || '').replace(/\\D/g, '');
          }`;

const carrierReplace = `          if (!carrierDocumentStr && bpData.BPFiscalTaxIDCollection && bpData.BPFiscalTaxIDCollection.length > 0) {
             let taxIdObj = bpData.BPFiscalTaxIDCollection.find(t => !!t.TaxId0); // CNPJ is priority
             if (!taxIdObj) taxIdObj = bpData.BPFiscalTaxIDCollection.find(t => !!t.TaxId4); // CPF secondary
             if (!taxIdObj) taxIdObj = bpData.BPFiscalTaxIDCollection.find(t => !!t.TaxId1); // Insc Estadual fallback
             
             if (taxIdObj) {
               carrierDocumentStr = (taxIdObj.TaxId0 || taxIdObj.TaxId4 || taxIdObj.TaxId1 || '').replace(/\\D/g, '');
             }
          }`;

const jsonSearch = `      carrier_document: carrierDocumentStr,`;
const jsonReplace = `      carrier_document: carrierDocumentStr,
      carrier_code: carrierCode,`;

if(content.includes(carrierSearch)) {
    content = content.replace(carrierSearch, carrierReplace);
    content = content.replace(jsonSearch, jsonReplace);
    fs.writeFileSync('tms-erp-proxy/index.js', content);
    console.log("Success replacing proxy index.js");
} else {
    console.log("Failed to find Search block in proxy index.js");
}
