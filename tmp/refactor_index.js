const fs = require('fs');

let content = fs.readFileSync('tms-erp-proxy/index.js', 'utf8');

// ==== refatorar fetch-sap-order ====
// Primeiro alteramos a rota para suportar lastSyncTime e o LOOP
content = content.replace(
  `const { endpointSystem, port, username, password, companyDb } = req.body;`,
  `const { endpointSystem, port, username, password, companyDb, lastSyncTime } = req.body;`
);

// Substituir o trecho do orderController ate o final da funcao
const orderBlockStart = `    // 2. Fetch Order
    const orderController = new AbortController();
    const orderTimeoutId = setTimeout(() => orderController.abort(), 15000);`;
    
const orderBlockRegex = /\/\/ 2\. Fetch Order[\s\S]*?return res\.status\(200\)\.json\(\{ success: true, order: fullOrderPayload \}\);\n/m;

const newOrderBlock = `    // 2. Fetch Order
    const orderController = new AbortController();
    const orderTimeoutId = setTimeout(() => orderController.abort(), 25000);
    
    let orderResponse;
    try {
      let dateFilter = '';
      if (lastSyncTime) {
         const filterDate = new Date(lastSyncTime).toISOString().split('T')[0];
         dateFilter = \`?$filter=CreateDate ge '\${filterDate}' or UpdateDate ge '\${filterDate}'\`;
      } else {
         const pastDate = new Date();
         pastDate.setDate(pastDate.getDate() - 3); // Fallback: ultimos 3 dias
         const filterDate = pastDate.toISOString().split('T')[0];
         dateFilter = \`?$filter=CreateDate ge '\${filterDate}' or UpdateDate ge '\${filterDate}'\`;
      }
      
      const orderEndpoint = \`\${serviceLayerUrl}/Orders\${dateFilter}\`;
      console.log(\`[Proxy] Buscando orders em: \${orderEndpoint}\`);
      
      orderResponse = await fetch(orderEndpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cookie': cookieString,
          'Prefer': 'odata.maxpagesize=50'
        },
        signal: orderController.signal
      });
      clearTimeout(orderTimeoutId);

      if (!orderResponse.ok) {
        let orderErrorData = null;
        try { orderErrorData = await orderResponse.json(); } catch (e) {}
        const orderSapErrorMsg = orderErrorData?.error?.message?.value || orderResponse.statusText;
        return res.status(200).json({ success: false, error: \`Falha ao buscar Pedido (\${orderResponse.status}): \${orderSapErrorMsg}\` });
      }
    } catch (fetchError) {
      clearTimeout(orderTimeoutId);
      return res.status(200).json({ success: false, error: \`Falha de Rede ao buscar Pedido SAP: \${fetchError.message}\` });
    }

    const orderData = await orderResponse.json();
    const ordersList = orderData.value || [];

    if (ordersList.length === 0) {
      return res.status(200).json({ success: true, orders: [] });
    }

    const bpCache = {};
    const carrierBPCache = {};
    const mappedOrdersPayload = [];

    for (const latestOrder of ordersList) {
      let documentStr = (latestOrder.LicTradNum || latestOrder.TaxIdNum || latestOrder.FederalTaxID || '').replace(/\\D/g, '');
      
      if (latestOrder.CardCode && (!documentStr || !latestOrder.AddressExtension?.ShipToCity || !latestOrder.AddressExtension?.ShipToZipCode)) {
        if (!bpCache[latestOrder.CardCode]) {
          try {
            const bpEndpoint = \`\${serviceLayerUrl}/BusinessPartners('\${latestOrder.CardCode}')\`;
            console.log(\`[Proxy] Buscando dados do Parceiro: \${latestOrder.CardCode}\`);
            const bpRes = await fetch(bpEndpoint, { method: 'GET', headers: { 'Accept': 'application/json', 'Cookie': cookieString } });
            if (bpRes.ok) bpCache[latestOrder.CardCode] = await bpRes.json();
          } catch (e) {
            console.error('[Proxy] Failed to fetch BP details', e);
          }
        }
        
        const bpData = bpCache[latestOrder.CardCode];
        if (bpData) {
          if (!documentStr) {
              documentStr = (bpData.LicTradNum || bpData.FederalTaxID || bpData.TaxIdNum || bpData.AdditionalID || '').replace(/\\D/g, '');
              if (!documentStr && bpData.BPFiscalTaxIDCollection && bpData.BPFiscalTaxIDCollection.length > 0) {
                 const taxIdObj = bpData.BPFiscalTaxIDCollection.find(t => t.TaxId0 || t.TaxId1 || t.TaxId4);
                 if (taxIdObj) documentStr = (taxIdObj.TaxId0 || taxIdObj.TaxId1 || taxIdObj.TaxId4 || '').replace(/\\D/g, '');
              }
          }
          if (!latestOrder.AddressExtension?.ShipToCity || !latestOrder.AddressExtension?.ShipToZipCode) {
             let bestAddress = null;
             if (bpData.BPAddresses && bpData.BPAddresses.length > 0) {
                bestAddress = bpData.BPAddresses.find(a => a.AddressType === 'bo_ShipTo') || bpData.BPAddresses.find(a => a.AddressType === 'bo_BillTo') || bpData.BPAddresses[0];
             }
             if (bestAddress || bpData.City || bpData.ZipCode) {
                if (!latestOrder.AddressExtension) latestOrder.AddressExtension = {};
                if (!latestOrder.AddressExtension.ShipToCity) latestOrder.AddressExtension.ShipToCity = (bestAddress?.City) || bpData.City || '';
                if (!latestOrder.AddressExtension.ShipToState) latestOrder.AddressExtension.ShipToState = (bestAddress?.State) || bpData.State1 || bpData.County || '';
                if (!latestOrder.AddressExtension.ShipToZipCode) latestOrder.AddressExtension.ShipToZipCode = (bestAddress?.ZipCode) || bpData.ZipCode || '';
                if (!latestOrder.AddressExtension.ShipToStreet) latestOrder.AddressExtension.ShipToStreet = (bestAddress?.Street) || bpData.Address || '';
             }
          }
        }
      }

      let carrierDocumentStr = '';
      const carrierCode = latestOrder.TaxExtension?.Carrier || '';
      if (carrierCode) {
        if (!carrierBPCache[carrierCode]) {
           try {
             const bpEndpoint = \`\${serviceLayerUrl}/BusinessPartners('\${carrierCode}')\`;
             const bpRes = await fetch(bpEndpoint, { method: 'GET', headers: { 'Accept': 'application/json', 'Cookie': cookieString } });
             if (bpRes.ok) carrierBPCache[carrierCode] = await bpRes.json();
           } catch (e) {}
        }
        
        const bpData = carrierBPCache[carrierCode];
        if (bpData) {
            carrierDocumentStr = (bpData.LicTradNum || bpData.FederalTaxID || bpData.TaxIdNum || bpData.AdditionalID || '').replace(/\\D/g, '');
            if (!carrierDocumentStr && bpData.BPFiscalTaxIDCollection && bpData.BPFiscalTaxIDCollection.length > 0) {
               let taxIdObj = bpData.BPFiscalTaxIDCollection.find(t => !!t.TaxId0) || bpData.BPFiscalTaxIDCollection.find(t => !!t.TaxId4) || bpData.BPFiscalTaxIDCollection.find(t => !!t.TaxId1);
               if (taxIdObj) carrierDocumentStr = (taxIdObj.TaxId0 || taxIdObj.TaxId4 || taxIdObj.TaxId1 || '').replace(/\\D/g, '');
            }
        }
      }

      const mappedOrder = {
        order_number: latestOrder.DocNum?.toString() || '',
        issue_date: latestOrder.DocDate || new Date().toISOString().split('T')[0],
        entry_date: latestOrder.DocDate || new Date().toISOString().split('T')[0],
        expected_delivery: latestOrder.DocDueDate || '',
        order_value: Number(latestOrder.DocTotal || 0),
        observations: latestOrder.Comments || '',
        carrier_document: carrierDocumentStr,
        carrier_code: carrierCode,
        customer: {
          document: documentStr,
          name: latestOrder.CardName || '',
          cardCode: latestOrder.CardCode || ''
        },
        destination: {
          zip_code: String(latestOrder.AddressExtension?.ShipToZipCode || ''),
          street: String(latestOrder.AddressExtension?.ShipToStreet || ''),
          number: String(latestOrder.AddressExtension?.ShipToStreetNo || ''),
          neighborhood: String(latestOrder.AddressExtension?.ShipToBlock || ''),
          city: String(latestOrder.AddressExtension?.ShipToCity || ''),
          state: String(latestOrder.AddressExtension?.ShipToState || ''),
        },
        items: (latestOrder.DocumentLines || []).map((line) => ({
          product_code: String(line.ItemCode || ''),
          product_description: String(line.ItemDescription || ''),
          quantity: Number(line.Quantity || 1),
          unit_price: Number(line.Price || 0),
          total_price: Number(line.LineTotal || 0),
          weight: Number(line.Weight1 || 0), 
          cubic_meters: Number(line.Volume || 0)
        }))
      };

      const totalWeight = mappedOrder.items.reduce((acc, cur) => acc + cur.weight, 0);
      const totalVolumeQty = mappedOrder.items.reduce((acc, cur) => acc + cur.quantity, 0);
      const totalCubicMeters = mappedOrder.items.reduce((acc, cur) => acc + cur.cubic_meters, 0);

      const fullOrderPayload = {
        ...mappedOrder,
        weight: totalWeight,
        volume_qty: totalVolumeQty > 0 ? totalVolumeQty : 1,
        cubic_meters: totalCubicMeters
      };
      
      mappedOrdersPayload.push(fullOrderPayload);
    }

    // Callback logout invisível
    fetch(\`\${serviceLayerUrl}/Logout\`, { 
      method: 'POST', 
      headers: { 'Cookie': cookieString, 'Accept': 'application/json' } 
    }).catch(() => {});

    return res.status(200).json({ success: true, orders: mappedOrdersPayload });
`;

content = content.replace(orderBlockRegex, newOrderBlock);



// ==== refatorar fetch-sap-invoice ====
content = content.replace(
  \`const { endpointSystem, port, username, password, companyDb } = req.body;\n\n    if (!endpointSystem || !username || !companyDb) {\`,
  \`const { endpointSystem, port, username, password, companyDb, lastSyncTime } = req.body;\n\n    if (!endpointSystem || !username || !companyDb) {\`
);

const invoiceBlockRegex = /\/\/ 2\. Fetch Invoice[\s\S]*?return res\.status\(200\)\.json\(\{ success: true, invoice: fullInvoicePayload \}\);\n/m;

const newInvoiceBlock = `    // 2. Fetch Invoice
    const invoiceController = new AbortController();
    const invoiceTimeoutId = setTimeout(() => invoiceController.abort(), 25000);
    
    let invoiceResponse;
    try {
      let dateFilter = '';
      if (lastSyncTime) {
         const filterDate = new Date(lastSyncTime).toISOString().split('T')[0];
         dateFilter = \`?$filter=CreateDate ge '\${filterDate}' or UpdateDate ge '\${filterDate}'\`;
      } else {
         const pastDate = new Date();
         pastDate.setDate(pastDate.getDate() - 3);
         const filterDate = pastDate.toISOString().split('T')[0];
         dateFilter = \`?$filter=CreateDate ge '\${filterDate}' or UpdateDate ge '\${filterDate}'\`;
      }
      
      const invoiceEndpoint = \`\${serviceLayerUrl}/Invoices\${dateFilter}\`;
      console.log(\`[Proxy] Buscando invoices em: \${invoiceEndpoint}\`);
      
      invoiceResponse = await fetch(invoiceEndpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cookie': cookieString,
          'Prefer': 'odata.maxpagesize=50'
        },
        signal: invoiceController.signal
      });
      clearTimeout(invoiceTimeoutId);

      if (!invoiceResponse.ok) {
        let invoiceErrorData = null;
        try { invoiceErrorData = await invoiceResponse.json(); } catch (e) {}
        const invoiceSapErrorMsg = invoiceErrorData?.error?.message?.value || invoiceResponse.statusText;
        return res.status(200).json({ success: false, error: \`Falha ao buscar Nota (\${invoiceResponse.status}): \${invoiceSapErrorMsg}\` });
      }
    } catch (fetchError) {
      clearTimeout(invoiceTimeoutId);
      return res.status(200).json({ success: false, error: \`Falha de Rede ao buscar Nota SAP: \${fetchError.message}\` });
    }

    const invoiceData = await invoiceResponse.json();
    const invoicesList = invoiceData.value || [];

    if (invoicesList.length === 0) {
      return res.status(200).json({ success: true, invoices: [] });
    }

    const bpCache = {};
    const carrierBPCache = {};
    const baseEntryCache = {};
    const mappedInvoicesPayload = [];

    for (const latestInvoice of invoicesList) {
      let documentStr = (latestInvoice.LicTradNum || latestInvoice.TaxIdNum || latestInvoice.FederalTaxID || '').replace(/\\D/g, '');
      
      if (latestInvoice.CardCode && (!documentStr || !latestInvoice.AddressExtension?.ShipToCity || !latestInvoice.AddressExtension?.ShipToZipCode)) {
        if (!bpCache[latestInvoice.CardCode]) {
           try {
             const bpEndpoint = \`\${serviceLayerUrl}/BusinessPartners('\${latestInvoice.CardCode}')\`;
             const bpRes = await fetch(bpEndpoint, { method: 'GET', headers: { 'Accept': 'application/json', 'Cookie': cookieString } });
             if (bpRes.ok) bpCache[latestInvoice.CardCode] = await bpRes.json();
           } catch (e) {}
        }
        
        const bpData = bpCache[latestInvoice.CardCode];
        if (bpData) {
          if (!documentStr) {
              documentStr = (bpData.LicTradNum || bpData.FederalTaxID || bpData.TaxIdNum || bpData.AdditionalID || '').replace(/\\D/g, '');
              if (!documentStr && bpData.BPFiscalTaxIDCollection && bpData.BPFiscalTaxIDCollection.length > 0) {
                 const taxIdObj = bpData.BPFiscalTaxIDCollection.find(t => t.TaxId0 || t.TaxId1 || t.TaxId4);
                 if (taxIdObj) documentStr = (taxIdObj.TaxId0 || taxIdObj.TaxId1 || taxIdObj.TaxId4 || '').replace(/\\D/g, '');
              }
          }
          if (!latestInvoice.AddressExtension?.ShipToCity || !latestInvoice.AddressExtension?.ShipToZipCode) {
             let bestAddress = null;
             if (bpData.BPAddresses && bpData.BPAddresses.length > 0) {
                bestAddress = bpData.BPAddresses.find(a => a.AddressType === 'bo_ShipTo') || bpData.BPAddresses.find(a => a.AddressType === 'bo_BillTo') || bpData.BPAddresses[0];
             }
             if (bestAddress || bpData.City || bpData.ZipCode) {
                if (!latestInvoice.AddressExtension) latestInvoice.AddressExtension = {};
                if (!latestInvoice.AddressExtension.ShipToCity) latestInvoice.AddressExtension.ShipToCity = (bestAddress?.City) || bpData.City || '';
                if (!latestInvoice.AddressExtension.ShipToState) latestInvoice.AddressExtension.ShipToState = (bestAddress?.State) || bpData.State1 || bpData.County || '';
                if (!latestInvoice.AddressExtension.ShipToZipCode) latestInvoice.AddressExtension.ShipToZipCode = (bestAddress?.ZipCode) || bpData.ZipCode || '';
                if (!latestInvoice.AddressExtension.ShipToStreet) latestInvoice.AddressExtension.ShipToStreet = (bestAddress?.Street) || bpData.Address || '';
             }
          }
        }
      }

      let carrierDocumentStr = '';
      const carrierCode = latestInvoice.TaxExtension?.Carrier || '';
      if (carrierCode) {
        if (!carrierBPCache[carrierCode]) {
           try {
             const bpEndpoint = \`\${serviceLayerUrl}/BusinessPartners('\${carrierCode}')\`;
             const bpRes = await fetch(bpEndpoint, { method: 'GET', headers: { 'Accept': 'application/json', 'Cookie': cookieString } });
             if (bpRes.ok) carrierBPCache[carrierCode] = await bpRes.json();
           } catch (e) {}
        }
        
        const bpData = carrierBPCache[carrierCode];
        if (bpData) {
            carrierDocumentStr = (bpData.LicTradNum || bpData.FederalTaxID || bpData.TaxIdNum || bpData.AdditionalID || '').replace(/\\D/g, '');
            if (!carrierDocumentStr && bpData.BPFiscalTaxIDCollection && bpData.BPFiscalTaxIDCollection.length > 0) {
               let taxIdObj = bpData.BPFiscalTaxIDCollection.find(t => !!t.TaxId0) || bpData.BPFiscalTaxIDCollection.find(t => !!t.TaxId4) || bpData.BPFiscalTaxIDCollection.find(t => !!t.TaxId1);
               if (taxIdObj) carrierDocumentStr = (taxIdObj.TaxId0 || taxIdObj.TaxId4 || taxIdObj.TaxId1 || '').replace(/\\D/g, '');
            }
        }
      }

      let relatedOrderNum = '';
      if (latestInvoice.DocumentLines && latestInvoice.DocumentLines.length > 0) {
        const firstLine = latestInvoice.DocumentLines[0];
        if (firstLine.BaseType === 17 && firstLine.BaseEntry) {
          if (!baseEntryCache[firstLine.BaseEntry]) {
            try {
              const bpEndpoint = \`\${serviceLayerUrl}/Orders(\${firstLine.BaseEntry})?$select=DocNum\`;
              const bpRes = await fetch(bpEndpoint, { method: 'GET', headers: { 'Accept': 'application/json', 'Cookie': cookieString } });
              if (bpRes.ok) {
                const orderData = await bpRes.json();
                if (orderData && orderData.DocNum) {
                  baseEntryCache[firstLine.BaseEntry] = orderData.DocNum.toString();
                } else {
                  baseEntryCache[firstLine.BaseEntry] = firstLine.BaseEntry.toString();
                }
              } else {
                baseEntryCache[firstLine.BaseEntry] = firstLine.BaseEntry.toString();
              }
            } catch(e) { 
              baseEntryCache[firstLine.BaseEntry] = firstLine.BaseEntry.toString();
            }
          }
          relatedOrderNum = baseEntryCache[firstLine.BaseEntry];
        }
      }

      const mappedInvoice = {
        order_number: relatedOrderNum,
        invoice_number: latestInvoice.U_SKL25NFE?.toString() || latestInvoice.SequenceSerial?.toString() || latestInvoice.Serial?.toString() || latestInvoice.FolioNumber?.toString() || latestInvoice.DocNum?.toString() || '',
        issue_date: latestInvoice.DocDate || new Date().toISOString().split('T')[0],
        entry_date: latestInvoice.DocDate || new Date().toISOString().split('T')[0],
        expected_delivery: latestInvoice.DocDueDate || '',
        invoice_value: Number(latestInvoice.DocTotal || 0),
        observations: latestInvoice.Comments || '',
        _debug_nfe_fields: {
           Serial: latestInvoice.Serial,
           SequenceSerial: latestInvoice.SequenceSerial,
           FolioNumber: latestInvoice.FolioNumber,
           FolioNum: latestInvoice.FolioNum,
           U_SKL25NFE: latestInvoice.U_SKL25NFE,
           U_NumNfe: latestInvoice.U_NumNfe,
           DocNum: latestInvoice.DocNum,
           DocEntry: latestInvoice.DocEntry,
           SeriesString: latestInvoice.SeriesString,
           SequenceCode: latestInvoice.SequenceCode
        },
        carrier_document: carrierDocumentStr,
        carrier_code: carrierCode,
        customer: {
          document: documentStr,
          name: latestInvoice.CardName || '',
          cardCode: latestInvoice.CardCode || ''
        },
        destination: {
          zip_code: String(latestInvoice.AddressExtension?.ShipToZipCode || ''),
          street: String(latestInvoice.AddressExtension?.ShipToStreet || ''),
          number: String(latestInvoice.AddressExtension?.ShipToStreetNo || ''),
          neighborhood: String(latestInvoice.AddressExtension?.ShipToBlock || ''),
          city: String(latestInvoice.AddressExtension?.ShipToCity || ''),
          state: String(latestInvoice.AddressExtension?.ShipToState || ''),
        },
        items: (latestInvoice.DocumentLines || []).map((line) => ({
          product_code: String(line.ItemCode || ''),
          product_description: String(line.ItemDescription || ''),
          quantity: Number(line.Quantity || 1),
          unit_price: Number(line.Price || 0),
          total_price: Number(line.LineTotal || 0),
          weight: Number(line.Weight1 || 0), 
          cubic_meters: Number(line.Volume || 0)
        }))
      };

      const totalWeight = mappedInvoice.items.reduce((acc, cur) => acc + cur.weight, 0);
      const totalVolumeQty = mappedInvoice.items.reduce((acc, cur) => acc + cur.quantity, 0);
      const totalCubicMeters = mappedInvoice.items.reduce((acc, cur) => acc + cur.cubic_meters, 0);

      const fullInvoicePayload = {
        ...mappedInvoice,
        weight: totalWeight,
        volume_qty: totalVolumeQty > 0 ? totalVolumeQty : 1,
        cubic_meters: totalCubicMeters
      };
      
      mappedInvoicesPayload.push(fullInvoicePayload);
    }

    // Callback logout invisível
    fetch(\`\${serviceLayerUrl}/Logout\`, { 
      method: 'POST', 
      headers: { 'Cookie': cookieString, 'Accept': 'application/json' } 
    }).catch(() => {});

    return res.status(200).json({ success: true, invoices: mappedInvoicesPayload });
`;

content = content.replace(invoiceBlockRegex, newInvoiceBlock);

fs.writeFileSync('tms-erp-proxy/index.js', content, 'utf8');
console.log('Script index.js successfully refactored for array streams.');
