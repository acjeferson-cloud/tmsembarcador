import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import { runCronSync, supabase } from './syncWorker.js';

// Permite conexões com Service Layer que possuam certificados SSL auto-assinados
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';


const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8081;

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'tms-erp-proxy', time: new Date() });
});

// Endpoint 1: Test Connection
app.post('/api/test-connection', async (req, res) => {
  try {
    const { endpointSystem, port, username, password, companyDb, lastSyncTime } = req.body;

    if (!endpointSystem || !username || !companyDb) {
      return res.status(400).json({ success: false, error: 'Parâmetros de conexão ausentes na requisição.' });
    }

    let cleanEndpoint = endpointSystem.trim().replace(/\/$/, '');
    let serviceLayerUrl = cleanEndpoint;
    
    if (port && !cleanEndpoint.includes(`:${port}`)) {
      try {
        const urlParts = new URL(cleanEndpoint);
        urlParts.port = port.toString();
        serviceLayerUrl = urlParts.toString().replace(/\/$/, '');
      } catch (e) {
        serviceLayerUrl = `${cleanEndpoint}:${port}`;
      }
    }
    
    if (!serviceLayerUrl.endsWith('/b1s/v1')) serviceLayerUrl = `${serviceLayerUrl}/b1s/v1`;
    if (!serviceLayerUrl.startsWith('http')) serviceLayerUrl = `https://${serviceLayerUrl}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s cravado

    try {
      console.log(`Testando conexão SAP Service Layer em: ${serviceLayerUrl}/Login`);
      const loginResponse = await fetch(`${serviceLayerUrl}/Login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          CompanyDB: companyDb,
          UserName: username,
          Password: password || ''
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!loginResponse.ok) {
        let errorData = null;
        try { errorData = await loginResponse.json(); } catch (e) {}
        const sapErrorMsg = errorData?.error?.message?.value || '';

        if (loginResponse.status === 401) {
          return res.status(200).json({ success: false, error: 'Falha de Autenticação: O Usuário ou a Password informada estão incorretos.' });
        }
        if (sapErrorMsg.toLowerCase().includes('database') || sapErrorMsg.toLowerCase().includes('company')) {
          return res.status(200).json({ success: false, error: `Banco de Dados não encontrado: A instância "${companyDb}" informada não existe no servidor.` });
        }
        return res.status(200).json({ success: false, error: `Falha na conexão SAP. Código: ${loginResponse.status}. Detalhe: ${sapErrorMsg || loginResponse.statusText}` });
      }

      return res.status(200).json({ success: true, message: 'Conexão estabelecida com sucesso pelo SAP Business One.' });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError' || fetchError.message?.includes('timeout')) {
        return res.status(200).json({ success: false, error: 'Timeout (10s): Não foi possível alcançar o IP/Porta do servidor SAP. Verifique Firewall / DNS.' });
      }
      return res.status(200).json({ success: false, error: `Falha de DNS/Rede ou SSL ao conectar no IP do SAP: ${fetchError.message} | Cause: ${fetchError.cause?.message || fetchError.cause || 'Desconhecido'}` });
    }
  } catch (globalError) {
    return res.status(200).json({ success: false, error: `Erro interno no servidor Node Proxy: ${globalError.message}` });
  }
});


// Endpoint 2: Fetch SAP Order
app.post('/api/fetch-sap-order', async (req, res) => {
  try {
    const { endpointSystem, port, username, password, companyDb, lastSyncTime, sap_bpl_id } = req.body;

    if (!endpointSystem || !username || !companyDb) {
      return res.status(400).json({ success: false, error: 'Parâmetros de conexão ausentes na requisição.' });
    }

    let cleanEndpoint = endpointSystem.trim().replace(/\/$/, '');
    let serviceLayerUrl = cleanEndpoint;
    
    if (port && !cleanEndpoint.includes(`:${port}`)) {
      try {
        const urlParts = new URL(cleanEndpoint);
        urlParts.port = port.toString();
        serviceLayerUrl = urlParts.toString().replace(/\/$/, '');
      } catch (e) {
        serviceLayerUrl = `${cleanEndpoint}:${port}`;
      }
    }
    
    if (!serviceLayerUrl.endsWith('/b1s/v1')) serviceLayerUrl = `${serviceLayerUrl}/b1s/v1`;
    if (!serviceLayerUrl.startsWith('http')) serviceLayerUrl = `https://${serviceLayerUrl}`;

    // 1. Login
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); 

    let loginResponse;
    try {
      console.log(`[Proxy] Login no SAP: ${serviceLayerUrl}/Login`);
      loginResponse = await fetch(`${serviceLayerUrl}/Login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          CompanyDB: companyDb,
          UserName: username,
          Password: password || ''
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!loginResponse.ok) {
        let errorData = null;
        try { errorData = await loginResponse.json(); } catch (e) {}
        const sapErrorMsg = errorData?.error?.message?.value || loginResponse.statusText;
        return res.status(200).json({ success: false, error: `Falha na conexão de Login SAP (${loginResponse.status}): ${sapErrorMsg}` });
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      return res.status(200).json({ success: false, error: `Falha de Rede/SSL ao autenticar no IP do SAP: ${fetchError.message}` });
    }

    // Extrair Cookie B1Session
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    if (!setCookieHeader) {
      return res.status(200).json({ success: false, error: `Nenhum Cookie de sessão retornado pelo SAP.` });
    }
    const cookiesMatch = setCookieHeader.match(/(B1SESSION=[^;]+)|(ROUTEID=[^;]+)/g) || [];
    const cookieString = cookiesMatch.join('; ');

    // 2. Fetch Order
    const orderController = new AbortController();
    const orderTimeoutId = setTimeout(() => orderController.abort(), 25000);
    
    let orderResponse;
    try {
      let dateFilter = '';
      if (lastSyncTime) {
         const filterDate = new Date(lastSyncTime).toISOString().split('T')[0];
         dateFilter = `?$filter=(CreationDate ge '${filterDate}' or UpdateDate ge '${filterDate}')`;
      } else {
         const pastDate = new Date();
         pastDate.setDate(pastDate.getDate() - 3);
         const filterDate = pastDate.toISOString().split('T')[0];
         dateFilter = `?$filter=(CreationDate ge '${filterDate}' or UpdateDate ge '${filterDate}')`;
      }
      
      if (sap_bpl_id) {
         dateFilter += ` and BPL_IDAssignedToInvoice eq ${sap_bpl_id}`;
      }
      
      // Order ascending so the oldest changes are processed first
      dateFilter += `&$orderby=DocEntry asc`;
      
      const orderEndpoint = `${serviceLayerUrl}/Orders${dateFilter}`;
      console.log(`[Proxy] Buscando orders em: ${orderEndpoint}`);
      
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
        return res.status(200).json({ success: false, error: `Falha ao buscar Pedido (${orderResponse.status}): ${orderSapErrorMsg}` });
      }
    } catch (fetchError) {
      clearTimeout(orderTimeoutId);
      return res.status(200).json({ success: false, error: `Falha de Rede ao buscar Pedido SAP: ${fetchError.message}` });
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
      let documentStr = (latestOrder.LicTradNum || latestOrder.TaxIdNum || latestOrder.FederalTaxID || '').replace(/\D/g, '');
      
      if (latestOrder.CardCode && (!documentStr || !latestOrder.AddressExtension?.ShipToCity || !latestOrder.AddressExtension?.ShipToZipCode)) {
        if (!bpCache[latestOrder.CardCode]) {
           try {
             const bpEndpoint = `${serviceLayerUrl}/BusinessPartners('${latestOrder.CardCode}')`;
             const bpRes = await fetch(bpEndpoint, { method: 'GET', headers: { 'Accept': 'application/json', 'Cookie': cookieString } });
             if (bpRes.ok) bpCache[latestOrder.CardCode] = await bpRes.json();
           } catch (e) {}
        }
        
        const bpData = bpCache[latestOrder.CardCode];
        if (bpData) {
          if (!documentStr) {
              documentStr = (bpData.LicTradNum || bpData.FederalTaxID || bpData.TaxIdNum || bpData.AdditionalID || '').replace(/\D/g, '');
              if (!documentStr && bpData.BPFiscalTaxIDCollection && bpData.BPFiscalTaxIDCollection.length > 0) {
                 const taxIdObj = bpData.BPFiscalTaxIDCollection.find(t => t.TaxId0 || t.TaxId1 || t.TaxId4);
                 if (taxIdObj) documentStr = (taxIdObj.TaxId0 || taxIdObj.TaxId1 || taxIdObj.TaxId4 || '').replace(/\D/g, '');
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
             const bpEndpoint = `${serviceLayerUrl}/BusinessPartners('${carrierCode}')`;
             const bpRes = await fetch(bpEndpoint, { method: 'GET', headers: { 'Accept': 'application/json', 'Cookie': cookieString } });
             if (bpRes.ok) carrierBPCache[carrierCode] = await bpRes.json();
           } catch (e) {}
        }
        
        const bpData = carrierBPCache[carrierCode];
        if (bpData) {
            carrierDocumentStr = (bpData.LicTradNum || bpData.FederalTaxID || bpData.TaxIdNum || bpData.AdditionalID || '').replace(/\D/g, '');
            if (!carrierDocumentStr && bpData.BPFiscalTaxIDCollection && bpData.BPFiscalTaxIDCollection.length > 0) {
               let taxIdObj = bpData.BPFiscalTaxIDCollection.find(t => !!t.TaxId0) || bpData.BPFiscalTaxIDCollection.find(t => !!t.TaxId4) || bpData.BPFiscalTaxIDCollection.find(t => !!t.TaxId1);
               if (taxIdObj) carrierDocumentStr = (taxIdObj.TaxId0 || taxIdObj.TaxId4 || taxIdObj.TaxId1 || '').replace(/\D/g, '');
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
    fetch(`${serviceLayerUrl}/Logout`, { 
      method: 'POST', 
      headers: { 'Cookie': cookieString, 'Accept': 'application/json' } 
    }).catch(() => {});

    return res.status(200).json({ success: true, orders: mappedOrdersPayload });

  } catch (globalError) {
    return res.status(200).json({ success: false, error: `Erro no servidor Node Proxy: ${globalError.message}` });
  }
});

// Endpoint 3: Fetch SAP Invoice
app.post('/api/fetch-sap-invoice', async (req, res) => {
  try {
    const { endpointSystem, port, username, password, companyDb, lastSyncTime, sap_bpl_id } = req.body;

    if (!endpointSystem || !username || !companyDb) {
      return res.status(400).json({ success: false, error: 'Parâmetros de conexão ausentes na requisição.' });
    }

    let cleanEndpoint = endpointSystem.trim().replace(/\/$/, '');
    let serviceLayerUrl = cleanEndpoint;
    
    if (port && !cleanEndpoint.includes(`:${port}`)) {
      try {
        const urlParts = new URL(cleanEndpoint);
        urlParts.port = port.toString();
        serviceLayerUrl = urlParts.toString().replace(/\/$/, '');
      } catch (e) {
        serviceLayerUrl = `${cleanEndpoint}:${port}`;
      }
    }
    
    if (!serviceLayerUrl.endsWith('/b1s/v1')) serviceLayerUrl = `${serviceLayerUrl}/b1s/v1`;
    if (!serviceLayerUrl.startsWith('http')) serviceLayerUrl = `https://${serviceLayerUrl}`;

    // 1. Login
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); 

    let loginResponse;
    try {
      console.log(`[Proxy] Login no SAP: ${serviceLayerUrl}/Login`);
      loginResponse = await fetch(`${serviceLayerUrl}/Login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          CompanyDB: companyDb,
          UserName: username,
          Password: password || ''
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!loginResponse.ok) {
        let errorData = null;
        try { errorData = await loginResponse.json(); } catch (e) {}
        const sapErrorMsg = errorData?.error?.message?.value || loginResponse.statusText;
        return res.status(200).json({ success: false, error: `Falha na conexão de Login SAP (${loginResponse.status}): ${sapErrorMsg}` });
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      return res.status(200).json({ success: false, error: `Falha de Rede/SSL ao autenticar no IP do SAP: ${fetchError.message}` });
    }

    // Extrair Cookie B1Session
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    if (!setCookieHeader) {
      return res.status(200).json({ success: false, error: `Nenhum Cookie de sessão retornado pelo SAP.` });
    }
    const cookiesMatch = setCookieHeader.match(/(B1SESSION=[^;]+)|(ROUTEID=[^;]+)/g) || [];
    const cookieString = cookiesMatch.join('; ');

    // 2. Fetch Invoice
    const invoiceController = new AbortController();
    const invoiceTimeoutId = setTimeout(() => invoiceController.abort(), 25000);
    
    let invoiceResponse;
    try {
      let dateFilter = '';
      if (lastSyncTime) {
         const filterDate = new Date(lastSyncTime).toISOString().split('T')[0];
         dateFilter = `?$filter=(CreationDate ge '${filterDate}' or UpdateDate ge '${filterDate}')`;
      } else {
         const pastDate = new Date();
         pastDate.setDate(pastDate.getDate() - 3);
         const filterDate = pastDate.toISOString().split('T')[0];
         dateFilter = `?$filter=(CreationDate ge '${filterDate}' or UpdateDate ge '${filterDate}')`;
      }
      
      if (sap_bpl_id) {
         dateFilter += ` and BPL_IDAssignedToInvoice eq ${sap_bpl_id}`;
      }
      
      // Invoice ascending
      dateFilter += `&$orderby=DocEntry asc`;
      
      const invoiceEndpoint = `${serviceLayerUrl}/Invoices${dateFilter}`;
      console.log(`[Proxy] Buscando invoices em: ${invoiceEndpoint}`);
      
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
        return res.status(200).json({ success: false, error: `Falha ao buscar Nota (${invoiceResponse.status}): ${invoiceSapErrorMsg}` });
      }
    } catch (fetchError) {
      clearTimeout(invoiceTimeoutId);
      return res.status(200).json({ success: false, error: `Falha de Rede ao buscar Nota SAP: ${fetchError.message}` });
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
      let documentStr = (latestInvoice.LicTradNum || latestInvoice.TaxIdNum || latestInvoice.FederalTaxID || '').replace(/\D/g, '');
      
      if (latestInvoice.CardCode && (!documentStr || !latestInvoice.AddressExtension?.ShipToCity || !latestInvoice.AddressExtension?.ShipToZipCode)) {
        if (!bpCache[latestInvoice.CardCode]) {
           try {
             const bpEndpoint = `${serviceLayerUrl}/BusinessPartners('${latestInvoice.CardCode}')`;
             const bpRes = await fetch(bpEndpoint, { method: 'GET', headers: { 'Accept': 'application/json', 'Cookie': cookieString } });
             if (bpRes.ok) bpCache[latestInvoice.CardCode] = await bpRes.json();
           } catch (e) {}
        }
        
        const bpData = bpCache[latestInvoice.CardCode];
        if (bpData) {
          if (!documentStr) {
              documentStr = (bpData.LicTradNum || bpData.FederalTaxID || bpData.TaxIdNum || bpData.AdditionalID || '').replace(/\D/g, '');
              if (!documentStr && bpData.BPFiscalTaxIDCollection && bpData.BPFiscalTaxIDCollection.length > 0) {
                 const taxIdObj = bpData.BPFiscalTaxIDCollection.find(t => t.TaxId0 || t.TaxId1 || t.TaxId4);
                 if (taxIdObj) documentStr = (taxIdObj.TaxId0 || taxIdObj.TaxId1 || taxIdObj.TaxId4 || '').replace(/\D/g, '');
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
             const bpEndpoint = `${serviceLayerUrl}/BusinessPartners('${carrierCode}')`;
             const bpRes = await fetch(bpEndpoint, { method: 'GET', headers: { 'Accept': 'application/json', 'Cookie': cookieString } });
             if (bpRes.ok) carrierBPCache[carrierCode] = await bpRes.json();
           } catch (e) {}
        }
        
        const bpData = carrierBPCache[carrierCode];
        if (bpData) {
            carrierDocumentStr = (bpData.LicTradNum || bpData.FederalTaxID || bpData.TaxIdNum || bpData.AdditionalID || '').replace(/\D/g, '');
            if (!carrierDocumentStr && bpData.BPFiscalTaxIDCollection && bpData.BPFiscalTaxIDCollection.length > 0) {
               let taxIdObj = bpData.BPFiscalTaxIDCollection.find(t => !!t.TaxId0) || bpData.BPFiscalTaxIDCollection.find(t => !!t.TaxId4) || bpData.BPFiscalTaxIDCollection.find(t => !!t.TaxId1);
               if (taxIdObj) carrierDocumentStr = (taxIdObj.TaxId0 || taxIdObj.TaxId4 || taxIdObj.TaxId1 || '').replace(/\D/g, '');
            }
        }
      }

      let relatedOrderNum = '';
      if (latestInvoice.DocumentLines && latestInvoice.DocumentLines.length > 0) {
        const firstLine = latestInvoice.DocumentLines[0];
        if (firstLine.BaseType === 17 && firstLine.BaseEntry) {
          if (!baseEntryCache[firstLine.BaseEntry]) {
            try {
              const bpEndpoint = `${serviceLayerUrl}/Orders(${firstLine.BaseEntry})?$select=DocNum`;
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
    fetch(`${serviceLayerUrl}/Logout`, { 
      method: 'POST', 
      headers: { 'Cookie': cookieString, 'Accept': 'application/json' } 
    }).catch(() => {});

    return res.status(200).json({ success: true, invoices: mappedInvoicesPayload });

  } catch (globalError) {
    return res.status(200).json({ success: false, error: `Erro no servidor Node Proxy: ${globalError.message}` });
  }
});

// Endpoint 4: Fetch ERP Sync Logs (bypasses RLS)
app.post('/api/erp-sync-logs', async (req, res) => {
  try {
    const { orgId, envId, estId } = req.body;
    if (!orgId || !envId) {
      return res.status(400).json({ success: false, error: 'orgId e envId sao obrigatorios' });
    }
    if (!supabase) {
      return res.status(500).json({ success: false, error: 'Database desabilitada no Worker' });
    }
    
    let query = supabase.from('erp_sync_logs').select('*')
      .eq('organization_id', orgId)
      .eq('environment_id', envId);
      
    if (estId) {
      query = query.eq('establishment_id', estId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false }).limit(50);
    
    if (error) {
      console.error('[Proxy] Erro fetch logs:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
    
    return res.status(200).json({ success: true, logs: data || [] });
  } catch (error) {
     return res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint 5: Integrate CT-e to SAP (Create A/P Invoice)
app.post('/api/integrate-cte', async (req, res) => {
  try {
    const { 
      endpointSystem, 
      port, 
      username, 
      password, 
      companyDb, 
      cte_data,
      cte_tax_code,
      sap_bpl_id,
      organization_id,
      cte_usage,
      cte_model,
      cte_integration_type,
      fiscal_module 
    } = req.body;

    if (!endpointSystem || !username || !companyDb || !cte_data) {
      return res.status(400).json({ success: false, error: 'Parâmetros de conexão ou dados do CT-e ausentes.' });
    }

    console.log(`[Proxy] Recebido pedido de integração. TaxCode Bruto: "${cte_tax_code}"`);

    let cleanEndpoint = endpointSystem.trim().replace(/\/$/, '');
    let serviceLayerUrl = cleanEndpoint;
    
    if (port && !cleanEndpoint.includes(`:${port}`)) {
      try {
        const urlParts = new URL(cleanEndpoint);
        urlParts.port = port.toString();
        serviceLayerUrl = urlParts.toString().replace(/\/$/, '');
      } catch (e) {
        serviceLayerUrl = `${cleanEndpoint}:${port}`;
      }
    }
    
    if (!serviceLayerUrl.endsWith('/b1s/v1')) serviceLayerUrl = `${serviceLayerUrl}/b1s/v1`;
    if (!serviceLayerUrl.startsWith('http')) serviceLayerUrl = `https://${serviceLayerUrl}`;

    // 1. Login
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); 

    let loginResponse;
    try {
      console.log(`[Proxy] Login no SAP para Integração CT-e: ${serviceLayerUrl}/Login`);
      loginResponse = await fetch(`${serviceLayerUrl}/Login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          CompanyDB: companyDb,
          UserName: username,
          Password: password || ''
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!loginResponse.ok) {
        let errorData = null;
        try { errorData = await loginResponse.json(); } catch (e) {}
        const sapErrorMsg = errorData?.error?.message?.value || loginResponse.statusText;
        return res.status(200).json({ success: false, error: `Falha na conexão de Login SAP (${loginResponse.status}): ${sapErrorMsg}` });
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      return res.status(200).json({ success: false, error: `Falha de Rede/SSL ao autenticar no SAP: ${fetchError.message}` });
    }

    const setCookieHeader = loginResponse.headers.get('set-cookie');
    const cookiesMatch = setCookieHeader?.match(/(B1SESSION=[^;]+)|(ROUTEID=[^;]+)/g) || [];
    const cookieString = cookiesMatch.join('; ');

    // 2. Identify BP (if needed)
    console.log(`[Proxy] Buscando BP pelo CNPJ: ${cte_data.carrier_cnpj}`);
    let cardCode = cte_data.carrier_cardcode;
    const cleanCarrierCnpj = cte_data.carrier_cnpj?.replace(/\D/g, '');

    if (!cardCode && cleanCarrierCnpj) {
      try {
        const bpRes = await fetch(`${serviceLayerUrl}/BusinessPartners?$filter=LicTradNum eq '${cleanCarrierCnpj}'&$select=CardCode`, {
          method: 'GET',
          headers: { 'Cookie': cookieString, 'Accept': 'application/json' }
        });
        if (bpRes.ok) {
          const bpData = await bpRes.json();
          if (bpData && bpData.value && bpData.value.length > 0) {
            cardCode = bpData.value[0].CardCode;
          }
        }
      } catch (e) {
        console.error('[Proxy] Erro ao buscar BP:', e);
      }
    }

    // FETCH FRESH sap_due_days from the carriers table in the database
    let sapDueDays = parseInt(cte_data.carrier_sap_due_days) || 0;
    if (supabase && cleanCarrierCnpj) {
      try {
        let carrierQuery = supabase.from('carriers').select('sap_due_days').eq('cnpj', cleanCarrierCnpj);
        // Ensure same organization context if provided from the frontend
        const orgContext = organization_id || req.body.organization_id;
        if (orgContext) carrierQuery = carrierQuery.eq('organization_id', orgContext);
        
        const { data: carrierData } = await carrierQuery.maybeSingle();
        if (carrierData && carrierData.sap_due_days !== undefined && carrierData.sap_due_days !== null) {
          console.log(`[Proxy] Recuperado sap_due_days (${carrierData.sap_due_days}) da tabela carriers para o transportador CNPJ ${cleanCarrierCnpj}`);
          sapDueDays = carrierData.sap_due_days;
        }
      } catch (e) {
        console.error('[Proxy] Erro ao consultar transportador no banco:', e);
      }
    }

    if (!cardCode) {
      return res.status(200).json({ success: false, error: `Não foi possível localizar o fornecedor no SAP com o CNPJ ${cte_data.carrier_cnpj}. Verifique o cadastro no SAP.` });
    }

    // 3. Create A/P Invoice (OPCH / PurchaseInvoices)
    const isDraft = (cte_integration_type || '').toLowerCase().includes('draft');
    const endpointPath = isDraft ? '/Drafts' : '/PurchaseInvoices';
    
    console.log(`[Proxy] Criando ${isDraft ? 'Esboço' : 'Nota de Entrada'} para CT-e ${cte_data.number || cte_data.numero}`);
    
    // Preparar payload da nota
    const invoicePayload = {
      // Se for Draft, precisa do DocObjectCode
      ...(isDraft ? { DocObjectCode: 'oPurchaseInvoices' } : {}),
      CardCode: cardCode,
      DocDate: cte_data.emissao?.split('T')[0] || new Date().toISOString().split('T')[0],
      DocDueDate: (() => { 
        // Lógica solicitada: Data atual do processamento + sap_due_days
        const d = new Date(); 
        d.setDate(d.getDate() + (parseInt(sapDueDays) || 0)); 
        return d.toISOString().split('T')[0]; 
      })(),
      TaxDate: cte_data.emissao?.split('T')[0] || new Date().toISOString().split('T')[0],
      Comments: `Integrado via Log Axis (TMS Embarcador) - CT-e: ${cte_data.number || cte_data.numero} | Chave: ${cte_data.access_key || cte_data.chave}`,
      BPL_IDAssignedToInvoice: sap_bpl_id || cte_data.sap_bpl_id || undefined,
      
      // Brazilian Localization Fields
      Usage: parseInt(cte_usage) || undefined,
      SequenceModel: String(cte_model || '57'),
      SequenceSerial: parseInt(cte_data.number || cte_data.numero) || undefined,
      Series: cte_data.series || undefined,
      
      // Skill Module Flag (if configured)
      ...(fiscal_module === 'skill' ? { U_SKL25NFE: '1' } : {}),

      DocumentLines: [
        {
          ItemCode: cte_data.item_service_code || 'SERV001',
          Quantity: 1,
          Price: cte_data.valor || cte_data.value || 0,
          Usage: parseInt(cte_usage) || undefined,
          TaxCode: (() => {
            const tc = String(cte_tax_code || '').trim();
            // Mantém hífens e pontos que são comuns em códigos de imposto brasileiros (ex: 1101-001)
            const cleanTc = tc.replace(/[^a-zA-Z0-9.\-_]/g, '');
            return cleanTc || 'C020';
          })(),
          LineTotal: cte_data.valor || cte_data.value || 0,
          AccountCode: cte_data.account_code || undefined
        }
      ]
    };

    console.log(`[Proxy] Enviando Payload para SAP (${endpointPath}):`, JSON.stringify(invoicePayload, null, 2));

    const createRes = await fetch(`${serviceLayerUrl}${endpointPath}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Accept': 'application/json',
        'Cookie': cookieString
      },
      body: JSON.stringify(invoicePayload)
    });

    if (!createRes.ok) {
      let createErr = null;
      try { createErr = await createRes.json(); } catch (e) {}
      const sapMsg = createErr?.error?.message?.value || createRes.statusText;
      return res.status(200).json({ success: false, error: `Erro no SAP Service Layer: ${sapMsg}` });
    }

    const result = await createRes.json();
    console.log(`[Proxy] Documento criado com SUCESSO. DocEntry: ${result.DocEntry}, DocNum: ${result.DocNum}`);
    
    // Logout
    fetch(`${serviceLayerUrl}/Logout`, { method: 'POST', headers: { 'Cookie': cookieString } }).catch(() => {});

    return res.status(200).json({ 
      success: true, 
      docEntry: result.DocEntry, 
      docNum: result.DocNum,
      sap_doc_entry: result.DocEntry, 
      sap_doc_num: result.DocNum,
      message: `Integrado via Log Axis (TMS Embarcador) - CT-e: ${cte_data.number || cte_data.numero} | Chave: ${cte_data.access_key || cte_data.chave}`
    });

  } catch (error) {
    return res.status(200).json({ success: false, error: `Erro interno no Proxy: ${error.message}` });
  }
});

// Endpoint: Cancelar/Estornar CT-e no SAP
app.post('/api/cancel-cte', async (req, res) => {
  try {
    const { 
      endpointSystem, 
      username, 
      password, 
      companyDb, 
      docEntry,
      isDraft,
      port = 34154
    } = req.body;

    if (!endpointSystem || !username || !docEntry) {
      return res.status(400).json({ success: false, error: 'Parâmetros de conexão ou DocEntry ausentes.' });
    }

    console.log(`[Proxy] Recebido pedido de ESTORNO/CANCELAMENTO. DocEntry: ${docEntry}, Tipo: ${isDraft ? 'Esboço' : 'Firme'}`);

    let cleanEndpoint = endpointSystem.trim().replace(/\/$/, '');
    let serviceLayerUrl = cleanEndpoint;
    
    if (port && !cleanEndpoint.includes(`:${port}`)) {
      serviceLayerUrl = `${cleanEndpoint}:${port}/b1s/v1`;
    } else if (!cleanEndpoint.endsWith('/b1s/v1')) {
      serviceLayerUrl = `${cleanEndpoint}/b1s/v1`;
    }

    // 1. Login
    const loginRes = await fetch(`${serviceLayerUrl}/Login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ CompanyDB: companyDb, UserName: username, Password: password })
    });

    if (!loginRes.ok) {
      const err = await loginRes.json();
      return res.status(200).json({ success: false, error: `Falha no login SAP: ${err.error?.message?.value || loginRes.statusText}` });
    }

    const cookieString = loginRes.headers.get('set-cookie');

    // 2. Cancelar/Deletar
    let cancelUrl = "";
    let cancelMethod = "POST";

    if (isDraft) {
      // Esboços são deletados no Service Layer
      cancelUrl = `${serviceLayerUrl}/Drafts(${docEntry})`;
      cancelMethod = "DELETE";
    } else {
      // Notas Fiscais são canceladas via endpoint /Cancel
      cancelUrl = `${serviceLayerUrl}/PurchaseInvoices(${docEntry})/Cancel`;
      cancelMethod = "POST";
    }

    console.log(`[Proxy] Executando ${cancelMethod} em ${cancelUrl}`);

    const cancelRes = await fetch(cancelUrl, {
      method: cancelMethod,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieString
      }
    });

    if (!cancelRes.ok && cancelRes.status !== 204) {
      let cancelErr = {};
      try { cancelErr = await cancelRes.json(); } catch (e) {}
      const sapMsg = cancelErr?.error?.message?.value || cancelRes.statusText;
      
      // Logout
      fetch(`${serviceLayerUrl}/Logout`, { method: 'POST', headers: { 'Cookie': cookieString } }).catch(() => {});
      
      return res.status(200).json({ success: false, error: `Erro ao cancelar no SAP: ${sapMsg}` });
    }

    console.log(`[Proxy] Documento ${docEntry} cancelado/removido com SUCESSO.`);
    
    // Logout
    fetch(`${serviceLayerUrl}/Logout`, { method: 'POST', headers: { 'Cookie': cookieString } }).catch(() => {});

    return res.status(200).json({ 
      success: true, 
      message: `Documento ${docEntry} estornado com sucesso no SAP.`
    });

  } catch (error) {
    return res.status(200).json({ success: false, error: `Erro interno no Proxy: ${error.message}` });
  }
});

// Endpoint: Cron Sync Scheduler (Call this from GCP Scheduler)
app.post('/api/cron-sync', async (req, res) => {
  try {
    const result = await runCronSync(PORT);
    if (!result.success) {
      return res.status(500).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    console.error('Fatal Cron Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

﻿
// Endpoint 6: Integrate Fatura (Bill) to SAP as Vendor Payment
app.post('/api/integrate-bill', async (req, res) => {
  console.log('\n[INTEGRATE-BILL] =======================================');
  console.log('[INTEGRATE-BILL] Nova requisição recebida em /api/integrate-bill');
  try {
    const {
      endpointSystem,
      port,
      username,
      password,
      companyDb,
      billId
    } = req.body;

    console.log('[INTEGRATE-BILL] Payload Body Recebido:', JSON.stringify({
       endpointSystem, port, username, companyDb, billId
    }, null, 2));

    if (!endpointSystem || !username || !companyDb || !billId) {
      console.log('[INTEGRATE-BILL] ERRO: Parâmetros ausentes na requisição.');
      return res.status(400).json({ success: false, error: 'Parâmetros ausentes na requisição.' });
    }

    // 1. Authenticate with SAP
    let cleanEndpoint = endpointSystem.trim().replace(/\/$/, '');
    let serviceLayerUrl = cleanEndpoint;
    if (port && !cleanEndpoint.includes(`:${port}`)) {
      try {
        const urlParts = new URL(cleanEndpoint);
        urlParts.port = port.toString();
        serviceLayerUrl = urlParts.toString().replace(/\/$/, '');
      } catch (e) {
        serviceLayerUrl = `${cleanEndpoint}:${port}`;
      }
    }
    if (!serviceLayerUrl.endsWith('/b1s/v1')) serviceLayerUrl = `${serviceLayerUrl}/b1s/v1`;
    if (!serviceLayerUrl.startsWith('http')) serviceLayerUrl = `https://${serviceLayerUrl}`;

    console.log(`[INTEGRATE-BILL] Autenticando com SAP B1 Service Layer em: ${serviceLayerUrl}/Login`);

    const loginRes = await fetch(`${serviceLayerUrl}/Login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ CompanyDB: companyDb, UserName: username, Password: password || '' })
    });

    if (!loginRes.ok) {
      let errTxt = await loginRes.text();
      console.error('[INTEGRATE-BILL] ERRO na Autenticação SAP:', loginRes.status, errTxt);
      return res.status(loginRes.status).json({ success: false, error: `Falha na autênticação SAP (${loginRes.status})` });
    }

    const loginData = await loginRes.json();
    const sessionId = loginData.SessionId;
    const cookieHeader = `B1SESSION=${sessionId}; ROUTEID=.node1`;
    console.log('[INTEGRATE-BILL] Autenticação SAP bem sucedida. SessionId:', sessionId);

    // 2. Fetch Bill Data and CTEs from Supabase
    console.log(`[INTEGRATE-BILL] Buscando dados da Fatura ${billId} no banco Supabase...`);
    const { data: billData, error: billError } = await supabase
      .from('bills')
      .select(`
        *,
        bill_ctes (
          ctes_complete (
            id,
            status,
            sap_doc_entry,
            number,
            total_value
          )
        )
      `)
      .eq('id', billId)
      .single();

    if (billError || !billData) {
      console.error('[INTEGRATE-BILL] ERRO: Fatura não encontrada no banco do TMS.', billError);
      return res.status(404).json({ success: false, error: 'Fatura não encontrada no banco do TMS.' });
    }
    
    console.log(`[INTEGRATE-BILL] Fatura encontrada: Número ${billData.bill_number}, Valor Total: ${billData.total_value}`);
    console.log(`[INTEGRATE-BILL] CT-es Associados encontrados na Fatura: ${billData.bill_ctes?.length || 0} CT-es vinculados`);

    // 3. Validações de pré-requisitos (Pre-flight Checks)
    console.log('[INTEGRATE-BILL] Iniciando Validações de Pré-requisitos...');
    if (billData.status === 'aprovada' || billData.status === 'auditada_aprovada') {
      console.log('[INTEGRATE-BILL] REJEITADO: Fatura já consta como aprovada e integrada.');
      return res.status(409).json({ success: false, error: 'Falha: Fatura já consta como aprovada e integrada.' });
    }

    console.log(`[INTEGRATE-BILL] Buscando CardCode do Fornecedor/Transportador: ${billData.customer_document}`);
    const { data: carrierData } = await supabase
      .from('carriers')
      .select('sap_cardcode')
      .eq('cnpj', billData.customer_document || '')
      .not('sap_cardcode', 'is', null)
      .limit(1);

    const cardCode = carrierData && carrierData.length > 0 ? carrierData[0].sap_cardcode : null;
    const finalCardCode = cardCode || billData.metadata?.sap_card_code;
    
    if (!finalCardCode) {
      console.error(`[INTEGRATE-BILL] REJEITADO: Transportador (Doc: ${billData.customer_document}) não possui CardCode mapeado no banco.`);
      return res.status(400).json({ success: false, error: `Falha: Transportador (Doc: ${billData.customer_document}) não possui CardCode mapeado. Sincronize primeiramente.` });
    }
    
    console.log(`[INTEGRATE-BILL] Fornecedor Validado. CardCode associado: ${finalCardCode}`);

    console.log(`[INTEGRATE-BILL] Validando Status e DocEntry de cada CT-e atrelado à fatura...`);
    let sumAppliedCalculated = 0;
    const paymentInvoices = [];
    let ctesArray = billData.bill_ctes || [];
    let cteNumbersList = [];

    if (ctesArray.length === 0) {
      console.error('[INTEGRATE-BILL] REJEITADO: Fatura não possui CT-es associados na estrutura relacional (bill_ctes).');
      return res.status(400).json({ success: false, error: 'Falha: Fatura não possui nenhum CT-e associado.' });
    }

    for (let i = 0; i < ctesArray.length; i++) {
        const cte = ctesArray[i].ctes_complete;
        if (!cte) {
           console.log(`[INTEGRATE-BILL] Aviso: Relação ${i} não encontrou ctes_complete aninhado. Ignorando linha.`);
           continue;
        }

        if (!cte.sap_doc_entry) {
            console.error(`[INTEGRATE-BILL] REJEITADO: CT-e número ${cte.number} (ID: ${cte.id}) NÃO possui sap_doc_entry gravado.`);
            return res.status(400).json({ 
                success: false, 
                error: `Falha: O CT-e número ${cte.number} ainda não foi aprovado no SAP. Não é possível gerar a integração da Fatura.` 
            });
        }
        
        const cValue = parseFloat(cte.total_value || 0);
        sumAppliedCalculated += cValue;
        if (cte.number) cteNumbersList.push(cte.number);
        
        paymentInvoices.push({
            LineNum: paymentInvoices.length,
            DocEntry: parseInt(cte.sap_doc_entry, 10),
            SumApplied: cValue,
            InvoiceType: "it_PurchaseInvoice"
        });
        console.log(`[INTEGRATE-BILL] CT-e ${cte.number} | DocEntry: ${cte.sap_doc_entry} | Validado. Valor do documento no C/P: ${cValue}`);
    }

    
    console.log('[INTEGRATE-BILL] Buscando uma conta contábil (CashAccount) padrão no SAP para a transferência...');
    let defaultTransferAccount = '';
    try {
      const accRes = await fetch(`${serviceLayerUrl}/ChartOfAccounts?$filter=CashAccount eq 'tYES'&$top=1`, {
        method: 'GET',
        headers: {
          'Cookie': cookieHeader,
          'Accept': 'application/json'
        }
      });
      if (accRes.ok) {
        const accData = await accRes.json();
        if (accData && accData.value && accData.value.length > 0) {
          defaultTransferAccount = accData.value[0].Code;
          console.log(`[INTEGRATE-BILL] Conta contábil padrão encontrada: ${defaultTransferAccount}`);
        }
      }
    } catch (e) {
      console.log('[INTEGRATE-BILL] Aviso: Não foi possível buscar CashAccount no SAP:', e.message);
    }

    console.log(`[INTEGRATE-BILL] Somatório Total Calculado (SumApplied Geral): ${sumAppliedCalculated}`);
    // 4. Montar Payload JSON Dynamic
    const todayStr = new Date().toISOString().split('T')[0];
    const ctesJoined = cteNumbersList.join(', ');
    const carrierName = billData.customer_name || billData.metadata?.carrier_name || '';
    // Formato: "CT-e(s) 1234, 5678 0001-ALFA Transportes LTDA"
    const journalRemarksStr = `CT-e(s) ${ctesJoined} ${carrierName}`.trim().substring(0, 250);

    const payloadVendor = {
        CardCode: finalCardCode,
        DocType: "rSupplier",
        DocDate: todayStr,
        JournalRemarks: journalRemarksStr,
        Remarks: `Integrado via Log Axis (TMS Embarcador) - Fatura: ${billData.bill_number || billId.slice(0, 8)}`,
        PaymentInvoices: paymentInvoices,
        TransferSum: sumAppliedCalculated,
        TransferDate: todayStr
    };

    if (defaultTransferAccount) {
        payloadVendor.TransferAccount = defaultTransferAccount;
    }


    console.log('[INTEGRATE-BILL] Payload preparado para /VendorPayments:');
    console.log(JSON.stringify(payloadVendor, null, 2));

    // 5. Postar na Service Layer
    console.log(`[INTEGRATE-BILL] Disparando requisição POST para ${serviceLayerUrl}/VendorPayments ...`);
    const paymentRes = await fetch(`${serviceLayerUrl}/VendorPayments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader
      },
      body: JSON.stringify(payloadVendor)
    });

    if (!paymentRes.ok) {
        let errJSON = null;
        let sapErrorMsg = paymentRes.statusText;
        try { 
           errJSON = await paymentRes.json(); 
           sapErrorMsg = errJSON?.error?.message?.value || sapErrorMsg;
        } catch(e) {
           const errRaw = await paymentRes.text();
           sapErrorMsg = errRaw;
        }
        
        console.error('[INTEGRATE-BILL] SAP Service Layer REJEITOU VendorPayments!');
        console.error('[INTEGRATE-BILL] Erro SAP:', sapErrorMsg);
        if (errJSON) console.error(JSON.stringify(errJSON, null, 2));
        
        return res.status(400).json({ success: false, error: sapErrorMsg, payload: payloadVendor });
    }

    const sapPayment = await paymentRes.json();
    const paymentEntry = sapPayment.DocEntry;
    console.log(`[INTEGRATE-BILL] SUCESSO! VendorPayments criado no SAP. DocEntry Financeiro: ${paymentEntry}`);

    // 6. Tratar Retorno (Atualizar Fatura)
    console.log(`[INTEGRATE-BILL] Atualizando status da Fatura ${billId} no TMS para 'aprovada'...`);
    const { error: updateError } = await supabase
        .from('bills')
        .update({
            status: 'aprovada',
            metadata: {
                ...(billData.metadata || {}),
                sap_payment_entry: paymentEntry,
                sap_payment_sync_at: new Date().toISOString()
            }
        })
        .eq('id', billId);

    if (updateError) {
        console.error('[INTEGRATE-BILL] AVISO: Fatura aprovada no SAP, porém falhou ao atualizar tabela no TMS:', updateError);
        return res.status(500).json({
            success: true,
            warning: 'Integrado ao SAP, mas falhou ao atualizar TMS',
            paymentEntry
        });
    }

    console.log('[INTEGRATE-BILL] Fluxo Concluído com Sucesso Total.');
    console.log('[INTEGRATE-BILL] =======================================\n');
    return res.status(200).json({
        success: true,
        sap_payment_entry: paymentEntry,
        message: 'Fatura aprovada e integrada com sucesso no SAP.'
    });

  } catch (error) {
    console.error('[INTEGRATE-BILL] Exceção Interna Grave:', error);
    return res.status(500).json({ success: false, error: `Erro Interno: ${error.message}` });
  }
});


// Endpoint 7: Cancel/Revert Bill in SAP (VendorPayment)
app.post('/api/cancel-bill', async (req, res) => {
  console.log('\n[CANCEL-BILL] =======================================');
  console.log('[CANCEL-BILL] Nova requisição recebida em /api/cancel-bill');
  try {
    const { endpointSystem, port, username, password, companyDb, billId } = req.body;

    if (!endpointSystem || !username || !companyDb || !billId) {
      return res.status(400).json({ success: false, error: 'Parâmetros ausentes na requisição.' });
    }

    // 1. Authenticate with SAP
    let cleanEndpoint = endpointSystem.trim().replace(/\/$/, '');
    let serviceLayerUrl = cleanEndpoint;
    if (port && !cleanEndpoint.includes(`:${port}`)) {
      try {
        const urlParts = new URL(cleanEndpoint);
        urlParts.port = port.toString();
        serviceLayerUrl = urlParts.toString().replace(/\/$/, '');
      } catch (e) {
        serviceLayerUrl = `${cleanEndpoint}:${port}`;
      }
    }
    if (!serviceLayerUrl.endsWith('/b1s/v1')) serviceLayerUrl = `${serviceLayerUrl}/b1s/v1`;
    if (!serviceLayerUrl.startsWith('http')) serviceLayerUrl = `https://${serviceLayerUrl}`;

    const loginRes = await fetch(`${serviceLayerUrl}/Login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ CompanyDB: companyDb, UserName: username, Password: password || '' })
    });

    if (!loginRes.ok) {
      return res.status(loginRes.status).json({ success: false, error: `Falha na autenticação SAP (${loginRes.status})` });
    }

    const { SessionId } = await loginRes.json();
    const cookieHeader = `B1SESSION=${SessionId}; ROUTEID=.node1`;

    // 2. Fetch Bill to find SAP Payment DocEntry
    const { data: billData, error: billError } = await supabase
      .from('bills')
      .select('id, metadata, status')
      .eq('id', billId)
      .single();

    if (billError || !billData) {
      return res.status(404).json({ success: false, error: 'Fatura não encontrada.' });
    }

    const docEntry = billData.metadata?.sap_payment_entry;
    if (!docEntry) {
      return res.status(400).json({ success: false, error: 'Fatura não possui Documento de Pagamento (VendorPayment) vinculado no SAP.' });
    }

    console.log(`[CANCEL-BILL] Solicitando cancelamento do VendorPayment DocEntry: ${docEntry}`);
    
    // Pegar o CardCode do VendorPayment original
    let cardCode = '';
    try {
      const origRes = await fetch(`${serviceLayerUrl}/VendorPayments(${docEntry})?$select=CardCode`, {
        headers: { 'Cookie': cookieHeader }
      });
      if (origRes.ok) {
        const origData = await origRes.json();
        cardCode = origData.CardCode;
      }
    } catch(e) {}

    // 3. Cancel VendorPayment in SAP
    const cancelRes = await fetch(`${serviceLayerUrl}/VendorPayments(${docEntry})/Cancel`, {
      method: 'POST',
      headers: { 
        'Cookie': cookieHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ JournalRemarks: "Cancelado via Log Axis (TMS)" })
    });
    
    // Tentar atualizar a observação do diário do estorno
    if (cardCode && (cancelRes.ok || cancelRes.status === 204)) {
       try {
         // esperar 1 segundo para o B1 commitar
         await new Promise(r => setTimeout(r, 1000));
         const cDocsRes = await fetch(`${serviceLayerUrl}/VendorPayments?$filter=CardCode eq '${cardCode}' and CancelStatus eq 'csCancellation'&$orderby=DocEntry desc&$top=1`, {
            headers: { 'Cookie': cookieHeader }
         });
         const cDocs = await cDocsRes.json();
         if (cDocs.value && cDocs.value.length > 0) {
            const cancelDocEntry = cDocs.value[0].DocEntry;
            console.log(`[CANCEL-BILL] CANCELLATION DOC ENTRY ENCONTRADO: ${cancelDocEntry}. Aplicando PATCH de JournalRemarks...`);
            await fetch(`${serviceLayerUrl}/VendorPayments(${cancelDocEntry})`, {
               method: 'PATCH',
               headers: { 'Cookie': cookieHeader, 'Content-Type': 'application/json' },
               body: JSON.stringify({ JournalRemarks: "Cancelado via Log Axis (TMS)" })
            });
         }
       } catch (ex) {
         console.error('[CANCEL-BILL] Não foi possível atualizar JournalRemarks do documento de estorno.', ex);
       }
    }

    if (!cancelRes.ok && cancelRes.status !== 204) {
      let errJSON;
      try { errJSON = await cancelRes.json(); } catch(e){}
      const sapMsg = errJSON?.error?.message?.value || cancelRes.statusText || '';
      console.error('[CANCEL-BILL] Resposta SAP:', errJSON || cancelRes.statusText);
      
      // Se a resposta indicar que já está cancelado, podemos prosseguir com a limpeza local
      if (sapMsg.toLowerCase().includes('cancel') || sapMsg.toLowerCase().includes('closed')) {
        console.log('[CANCEL-BILL] SAP indica que o documento já foi cancelado/fechado. Limpando vínculo local de qualquer forma...');
      } else {
        return res.status(400).json({ success: false, error: sapMsg || 'Falha ao estornar pagamento no SAP.' });
      }
    }

    // 4. Update TMS Bill Status back to "importada"
    console.log(`[CANCEL-BILL] Sucesso no SAP. Estornando status no TMS...`);
    const newMetadata = { ...billData.metadata };
    delete newMetadata.sap_payment_entry;

    await supabase.from('bills').update({
       status: 'importada',
       metadata: newMetadata
    }).eq('id', billId);

    console.log('[CANCEL-BILL] Operação Finalizada com Sucesso.');
    return res.status(200).json({ success: true, message: 'Fatura estornada com sucesso.' });

  } catch (error) {
    console.error('[CANCEL-BILL] Grave:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 TMS ERP Proxy Server running on port ${PORT}`);
  
  // Auto Cron Loop Interno
  console.log('⏰ Iniciando Cron Loop Interno a cada 60s...');
  setInterval(() => {
    runCronSync(PORT).catch(err => console.error('Erro no cron automÃ¡tico:', err));
  }, 60000);
});
