import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import http from 'http';

dotenv.config({ path: '../.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("Buscando config do ERP...");
  const { data, error } = await supabase.from('erp_integration_config').select('*').limit(1);
  if (error || !data || data.length === 0) {
    console.error("Config não encontrada");
    return;
  }
  
  const c = data[0];
  const payload = JSON.stringify({
    endpointSystem: c.service_layer_address,
    port: c.port,
    username: c.username,
    password: c.password,
    companyDb: c.database,
    sap_bpl_id: c.sap_bpl_id,
    lastSyncTime: null
  });

  console.log("Disparando requisição para http://localhost:8081/api/fetch-sap-order...");
  
  const req = http.request({
    hostname: 'localhost',
    port: 8081,
    path: '/api/fetch-sap-order',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log(`\n=== RESPOSTA DO PROXY (HTTP ${res.statusCode}) ===`);
      console.log(body);
      console.log("==================================================");
    });
  });

  req.on('error', (e) => {
    console.error(`Erro ao disparar requisição: ${e.message}`);
  });

  req.write(payload);
  req.end();
}

run();
