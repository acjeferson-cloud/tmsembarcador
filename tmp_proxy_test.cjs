require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
  const { data } = await supabase.from('erp_integration_config').select('*').not('service_layer_address', 'is', null);
  if (!data || data.length === 0) return console.log('no config data found');
  const config = data[0];
  
  const payload = {
    endpointSystem: config.service_layer_address,
    port: config.port,
    username: config.username,
    password: config.password,
    companyDb: config.database
  };
  
  try {
    const res = await fetch('https://tms-erp-proxy-303812479794.us-east1.run.app/api/fetch-sap-order', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });
    const d = await res.json();
    console.log('Proxy Order Result:', JSON.stringify(d, null, 2));
  } catch (e) {
    console.error('Fetch error:', e);
  }
}
run();
