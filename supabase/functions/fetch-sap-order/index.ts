import { corsHeaders } from '../_shared/cors.ts';

interface ERPConnectionPayload {
  endpointSystem: string;
  port: number | string;
  username: string;
  password?: string;
  companyDb: string;
}

Deno.serve(async (req) => {
  // Configuração CORS (Preflight request)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: ERPConnectionPayload = await req.json();
    const { endpointSystem, port, username, password, companyDb } = payload;

    if (!endpointSystem || !username || !companyDb) {
      return new Response(
        JSON.stringify({ success: false, error: 'Parâmetros de conexão ausentes na requisição.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Sanitização e Construção da Base URL do SAP Service Layer
    let cleanEndpoint = endpointSystem.trim().replace(/\/$/, '');
    let serviceLayerUrl = cleanEndpoint;
    
    // Injeta porta se o usuário não enviou formatado "https://ip:50000"
    if (port && !cleanEndpoint.includes(`:${port}`)) {
      try {
        const urlParts = new URL(cleanEndpoint);
        urlParts.port = port.toString();
        serviceLayerUrl = urlParts.toString().replace(/\/$/, '');
      } catch (e) {
        // Se a url for inválida ou IP puro, monta manualmente
        serviceLayerUrl = `${cleanEndpoint}:${port}`;
      }
    }
    
    // Garante o sufixo obrigatório da API
    if (!serviceLayerUrl.endsWith('/b1s/v1')) {
      serviceLayerUrl = `${serviceLayerUrl}/b1s/v1`;
    }

    // Garante protocolo https (SAP exige por padrão)
    if (!serviceLayerUrl.startsWith('http')) {
      serviceLayerUrl = `https://${serviceLayerUrl}`;
    }

    // 2. Autenticação Inicial para pegar Cookie RouteId B1SESSION
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s per request

    let loginResponse;
    try {
      console.log(`Loging in SAP via Service Layer em: ${serviceLayerUrl}/Login`);
      
      loginResponse = await fetch(`${serviceLayerUrl}/Login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          CompanyDB: companyDb,
          UserName: username,
          Password: password || ''
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!loginResponse.ok) {
        let errorData;
        try { errorData = await loginResponse.json(); } catch (e) { errorData = null; }
        const sapErrorMsg = errorData?.error?.message?.value || loginResponse.statusText;
        return new Response(
          JSON.stringify({ success: false, error: `Falha na conexão de Login SAP (${loginResponse.status}): ${sapErrorMsg}` }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      return new Response(
        JSON.stringify({ success: false, error: `Falha de Rede ou SSL ao autenticar no IP do SAP: ${fetchError.message}` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extrair Cookies da Sessão
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    if (!setCookieHeader) {
      return new Response(
        JSON.stringify({ success: false, error: `Nenhum Cookie de sessão retornado pelo SAP.` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Construir cabeçalho Cookie para requisição subsequente
    // Deno fetch handles multiple Set-Cookie headers joined by comma or just strings.
    // However, it's safer to just extract B1SESSION and ROUTEID manually to be exact
    const cookiesMatch = setCookieHeader.match(/(B1SESSION=[^;]+)|(ROUTEID=[^;]+)/g) || [];
    const cookieString = cookiesMatch.join('; ');

    // 3. Fazer request do último Order
    const orderController = new AbortController();
    const orderTimeoutId = setTimeout(() => orderController.abort(), 15000);
    
    let orderResponse;
    try {
      const orderEndpoint = `${serviceLayerUrl}/Orders?$orderby=DocEntry desc&$top=1`;
      console.log(`Buscando orders em: ${orderEndpoint}`);
      
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
        let orderErrorData;
        try { orderErrorData = await orderResponse.json(); } catch (e) { orderErrorData = null; }
        const orderSapErrorMsg = orderErrorData?.error?.message?.value || orderResponse.statusText;
        return new Response(
          JSON.stringify({ success: false, error: `Falha ao buscar Pedido (${orderResponse.status}): ${orderSapErrorMsg}` }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (fetchError: any) {
      clearTimeout(orderTimeoutId);
      return new Response(
        JSON.stringify({ success: false, error: `Falha de Rede ao buscar Pedido SAP: ${fetchError.message}` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const orderData = await orderResponse.json();
    const latestOrder = orderData.value && orderData.value.length > 0 ? orderData.value[0] : null;

    if (!latestOrder) {
      return new Response(
        JSON.stringify({ success: false, error: 'Nenhum Pedido de Venda foi encontrado no banco de dados SAP.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Mapear o retorno do SAP para o modelo TMS Embarcador (com nível de item preciso)
    const mappedOrder = {
      order_number: latestOrder.DocNum?.toString() || '',
      issue_date: latestOrder.DocDate || new Date().toISOString().split('T')[0], // yyyy-MM-dd
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
        zip_code: latestOrder.AddressExtension?.ShipToZipCode || '',
        street: latestOrder.AddressExtension?.ShipToStreet || '',
        number: latestOrder.AddressExtension?.ShipToStreetNo || '',
        neighborhood: latestOrder.AddressExtension?.ShipToBlock || '',
        city: latestOrder.AddressExtension?.ShipToCity || '',
        state: latestOrder.AddressExtension?.ShipToState || '',
      },
      // Iterando pelas linhas com acúmulos totais de peso e cubagem
      items: (latestOrder.DocumentLines || []).map((line: any) => ({
        product_code: line.ItemCode || '',
        product_description: line.ItemDescription || '',
        quantity: Number(line.Quantity || 1), // Traz qty limpo
        unit_price: Number(line.Price || 0),
        total_price: Number(line.LineTotal || 0),
        weight: Number(line.Weight1 || 0), 
        cubic_meters: Number(line.Volume || 0)
      }))
    };

    // Calcular os totais agregados para o Cabeçalho (Header) do Pedido
    const totalWeight = mappedOrder.items.reduce((acc: number, cur: any) => acc + cur.weight, 0);
    const totalVolumeQty = mappedOrder.items.reduce((acc: number, cur: any) => acc + cur.quantity, 0);
    const totalCubicMeters = mappedOrder.items.reduce((acc: number, cur: any) => acc + cur.cubic_meters, 0);

    const fullOrderPayload = {
      ...mappedOrder,
      weight: totalWeight,
      volume_qty: totalVolumeQty > 0 ? totalVolumeQty : 1, // volume_qty como soma das qtdes em caixas/volumes
      cubic_meters: totalCubicMeters
    };

    // Fazer Logout (Dignidade com o servidor do cliente)
    fetch(`${serviceLayerUrl}/Logout`, { 
      method: 'POST', 
      headers: { 'Cookie': cookieString, 'Accept': 'application/json' } 
    }).catch(() => {});

    return new Response(
      JSON.stringify({ success: true, order: fullOrderPayload }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (globalError: any) {
    return new Response(
      JSON.stringify({ success: false, error: `Erro na Edge Function: ${globalError.message}` }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
