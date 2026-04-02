import express from 'express';
import cors from 'cors';

// Permite conexões com Service Layer que possuam certificados SSL auto-assinados
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';


const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'tms-erp-proxy', time: new Date() });
});

// Endpoint 1: Test Connection
app.post('/api/test-connection', async (req, res) => {
  try {
    const { endpointSystem, port, username, password, companyDb } = req.body;

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
    const { endpointSystem, port, username, password, companyDb } = req.body;

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
    const orderTimeoutId = setTimeout(() => orderController.abort(), 15000);
    
    let orderResponse;
    try {
      const orderEndpoint = `${serviceLayerUrl}/Orders?$orderby=DocEntry desc&$top=1`;
      console.log(`[Proxy] Buscando orders em: ${orderEndpoint}`);
      
      orderResponse = await fetch(orderEndpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cookie': cookieString,
          'Prefer': 'odata.maxpagesize=1'
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
    const latestOrder = orderData.value && orderData.value.length > 0 ? orderData.value[0] : null;

    if (!latestOrder) {
      return res.status(200).json({ success: false, error: 'Nenhum Pedido de Venda foi encontrado no banco de dados SAP.' });
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
        document: (latestOrder.LicTradNum || latestOrder.TaxIdNum || '').replace(/\D/g, ''),
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

    // Callback logout invisível
    fetch(`${serviceLayerUrl}/Logout`, { 
      method: 'POST', 
      headers: { 'Cookie': cookieString, 'Accept': 'application/json' } 
    }).catch(() => {});

    return res.status(200).json({ success: true, order: fullOrderPayload });

  } catch (globalError) {
    return res.status(200).json({ success: false, error: `Erro no servidor Node Proxy: ${globalError.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 TMS ERP Proxy Server running on port ${PORT}`);
});
