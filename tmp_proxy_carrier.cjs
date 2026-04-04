const fs = require('fs');
let content = fs.readFileSync('tms-erp-proxy/index.js', 'utf8');

const search = "    // Mapeamento minucioso do Item pro TMS";
const replacement = `    // Fetch Carrier (Transportadora) Business Partner using TaxExtension.Carrier or Document.TransportationCode
    let carrierDocumentStr = '';
    const carrierCode = latestOrder.TaxExtension?.Carrier || '';
    if (carrierCode) {
      try {
        const bpEndpoint = \`\${serviceLayerUrl}/BusinessPartners('\${carrierCode}')\`;
        console.log(\`[Proxy] Buscando Transportadora para capturar CNPJ em: \${bpEndpoint}\`);
        
        const bpRes = await fetch(bpEndpoint, {
          method: 'GET',
          headers: { 'Accept': 'application/json', 'Cookie': cookieString }
        });
        
        if (bpRes.ok) {
          const bpData = await bpRes.json();
          carrierDocumentStr = (bpData.LicTradNum || bpData.FederalTaxID || bpData.TaxIdNum || bpData.AdditionalID || '').replace(/\\D/g, '');
          
          if (!carrierDocumentStr && bpData.BPFiscalTaxIDCollection && bpData.BPFiscalTaxIDCollection.length > 0) {
             const taxIdObj = bpData.BPFiscalTaxIDCollection.find(t => t.TaxId0 || t.TaxId1 || t.TaxId4);
             if (taxIdObj) carrierDocumentStr = (taxIdObj.TaxId0 || taxIdObj.TaxId1 || taxIdObj.TaxId4 || '').replace(/\\D/g, '');
          }
        }
      } catch (e) {
        console.error('[Proxy] Failed to fetch Carrier BP details', e);
      }
    }

    // Mapeamento minucioso do Item pro TMS`;

if(content.includes(search)) {
    content = content.replace(search, replacement);
    
    // Also inject carrier_document into mappedOrder
    const orderSearch = "      customer: {";
    const orderReplace = "      carrier_document: carrierDocumentStr,\n      customer: {";
    content = content.replace(orderSearch, orderReplace);
    
    fs.writeFileSync('tms-erp-proxy/index.js', content);
    console.log("Success");
} else {
    console.log("Could not find search string in index.js");
}
