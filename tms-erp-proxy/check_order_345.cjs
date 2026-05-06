require('dotenv').config({ path: '../.env' });
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function checkOrder345() {
  console.log("Inicializando cliente Supabase...");
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  console.log("Buscando configurações do ERP...");
  const { data: configs, error } = await supabase.from('erp_integration_config').select('*').limit(1);
  
  if (error || !configs || configs.length === 0) {
    console.error("Erro ao buscar configuração do ERP ou configuração não encontrada:", error);
    return;
  }

  const c = configs[0];
  console.log(`Configuração encontrada. Conectando em: ${c.service_layer_address} (Database: ${c.database})`);

  let serviceLayerUrl = c.service_layer_address.trim().replace(/\/$/, '');
  if (c.port && !serviceLayerUrl.includes(`:${c.port}`)) {
    serviceLayerUrl = `${serviceLayerUrl}:${c.port}`;
  }
  if (!serviceLayerUrl.endsWith('/b1s/v1')) serviceLayerUrl = `${serviceLayerUrl}/b1s/v1`;
  if (!serviceLayerUrl.startsWith('http')) serviceLayerUrl = `https://${serviceLayerUrl}`;

  try {
    console.log("Fazendo login no SAP Service Layer...");
    const loginResponse = await fetch(`${serviceLayerUrl}/Login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        CompanyDB: c.database,
        UserName: c.username,
        Password: c.password || ''
      })
    });

    if (!loginResponse.ok) {
      console.error(`Falha no login do SAP: ${loginResponse.status} ${loginResponse.statusText}`);
      const errBody = await loginResponse.text();
      console.error(errBody);
      return;
    }

    const setCookieHeader = loginResponse.headers.get('set-cookie');
    const cookiesMatch = setCookieHeader?.match(/(B1SESSION=[^;]+)|(ROUTEID=[^;]+)/g) || [];
    const cookieString = cookiesMatch.join('; ');

    console.log("Consultando o pedido com DocNum = 345...");
    const ordersReq = await fetch(`${serviceLayerUrl}/Orders?$filter=DocNum eq 345`, {
      headers: { 
        'Cookie': cookieString, 
        'Accept': 'application/json',
        'Prefer': 'odata.maxpagesize=5'
      }
    });

    if (!ordersReq.ok) {
      console.error(`Falha ao buscar Pedido 345: ${ordersReq.status} ${ordersReq.statusText}`);
      const errBody = await ordersReq.text();
      console.error(errBody);
      return;
    }

    const data = await ordersReq.json();
    const orders = data.value || [];

    console.log("\n================ RESULTADO DA BUSCA ================");
    if (orders.length === 0) {
      console.log("Nenhum pedido de venda com número 345 foi encontrado na rota /Orders.");
      console.log("Possíveis motivos:");
      console.log("- Ele é um Pedido de Compra (PurchaseOrders)");
      console.log("- Ele é um Esboço (Drafts)");
      console.log("- O número 345 não é o DocNum, mas sim outro campo.");
    } else {
      orders.forEach(o => {
        console.log(`- DocNum: ${o.DocNum}`);
        console.log(`- Data de Criação: ${o.CreationDate}`);
        console.log(`- Filial Atribuída (BPL_IDAssignedToInvoice): ${o.BPL_IDAssignedToInvoice}`);
        console.log(`- Status: ${o.DocumentStatus}`);
        
        console.log("\nPor que ele não está sendo integrado pelo Proxy?");
        let motivos = [];
        const hj = new Date();
        hj.setDate(hj.getDate() - 3);
        const limitDateStr = hj.toISOString().split('T')[0];
        
        if (o.CreationDate < limitDateStr && o.UpdateDate < limitDateStr) {
          motivos.push(`1. Data fora do limite de 3 dias (${limitDateStr}). CreationDate: ${o.CreationDate}, UpdateDate: ${o.UpdateDate}`);
        }
        
        if (c.sap_bpl_id && o.BPL_IDAssignedToInvoice != c.sap_bpl_id) {
          motivos.push(`2. A Filial configurada no TMS é ${c.sap_bpl_id}, mas o pedido no SAP é da filial ${o.BPL_IDAssignedToInvoice}`);
        }
        
        if (motivos.length > 0) {
          console.log(motivos.join('\n'));
        } else {
          console.log("Ele deveria estar sendo integrado! Aparentemente não há nada impedindo no lado do SAP.");
        }
      });
    }
    console.log("====================================================");

    // Logout
    await fetch(`${serviceLayerUrl}/Logout`, { 
      method: 'POST', 
      headers: { 'Cookie': cookieString, 'Accept': 'application/json' } 
    });

  } catch (err) {
    console.error("Erro na comunicação direta com SAP:", err);
  }
}

checkOrder345();
