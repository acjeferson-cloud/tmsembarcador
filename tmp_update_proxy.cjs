const fs = require('fs');
let content = fs.readFileSync('tms-erp-proxy/index.js', 'utf8');

const search = `    // Mapeamento minucioso do Item pro TMS
    const mappedOrder = {
      order_number: latestOrder.DocNum?.toString() || '',
      issue_date: latestOrder.DocDate || new Date().toISOString().split('T')[0],
      entry_date: latestOrder.DocDate || new Date().toISOString().split('T')[0],
      expected_delivery: latestOrder.DocDueDate || '',
      order_value: Number(latestOrder.DocTotal || 0),
      observations: latestOrder.Comments || '',
      customer: {
        document: (latestOrder.LicTradNum || latestOrder.TaxIdNum || '').replace(/\\D/g, ''),
        name: latestOrder.CardName || '',
        cardCode: latestOrder.CardCode || ''
      },`;

const replacement = `    // Fetch Business Partner to get CNPJ/Document if not present in the Order payload
    let documentStr = (latestOrder.LicTradNum || latestOrder.TaxIdNum || latestOrder.FederalTaxID || '').replace(/\\D/g, '');
    
    if (!documentStr && latestOrder.CardCode) {
      try {
        const bpEndpoint = \`\${serviceLayerUrl}/BusinessPartners('\${latestOrder.CardCode}')?$select=LicTradNum,FederalTaxID,TaxIdNum,AdditionalID,BPFiscalTaxIDCollection\`;
        console.log(\`[Proxy] Buscando dados do Parceiro para capturar CNPJ em: \${bpEndpoint}\`);
        
        const bpRes = await fetch(bpEndpoint, {
          method: 'GET',
          headers: { 'Accept': 'application/json', 'Cookie': cookieString }
        });
        
        if (bpRes.ok) {
          const bpData = await bpRes.json();
          documentStr = (bpData.LicTradNum || bpData.FederalTaxID || bpData.TaxIdNum || bpData.AdditionalID || '').replace(/\\D/g, '');
          
          if (!documentStr && bpData.BPFiscalTaxIDCollection && bpData.BPFiscalTaxIDCollection.length > 0) {
             const taxIdObj = bpData.BPFiscalTaxIDCollection.find(t => t.TaxId0 || t.TaxId1 || t.TaxId4);
             if (taxIdObj) documentStr = (taxIdObj.TaxId0 || taxIdObj.TaxId1 || taxIdObj.TaxId4 || '').replace(/\\D/g, '');
          }
        } else {
          console.log(\`[Proxy] Falha ao buscar BP: \${bpRes.status}\`);
        }
      } catch (e) {
        console.error('[Proxy] Failed to fetch BP details', e);
      }
    }

    // Mapeamento minucioso do Item pro TMS
    const mappedOrder = {
      order_number: latestOrder.DocNum?.toString() || '',
      issue_date: latestOrder.DocDate || new Date().toISOString().split('T')[0],
      entry_date: latestOrder.DocDate || new Date().toISOString().split('T')[0],
      expected_delivery: latestOrder.DocDueDate || '',
      order_value: Number(latestOrder.DocTotal || 0),
      observations: latestOrder.Comments || '',
      customer: {
        document: documentStr,
        name: latestOrder.CardName || '',
        cardCode: latestOrder.CardCode || ''
      },`;

if(content.includes(search)) {
    content = content.replace(search, replacement);
    fs.writeFileSync('tms-erp-proxy/index.js', content);
    console.log("Success");
} else {
    console.log("Could not find search string in index.js");
}
