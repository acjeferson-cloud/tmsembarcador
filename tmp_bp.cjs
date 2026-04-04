require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const { data } = await supabase.rpc('get_erp_config_secure');
  if(!data) return console.log('no config');
  
  const config = data;
  let url = config.service_layer_address;
  if (!url.startsWith('http')) url = 'https://' + url;
  url += '/b1s/v1';
  
  const loginRes = await fetch(url + '/Login', {
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({CompanyDB: config.database, UserName: config.username, Password: config.password})
  });
  const loginData = await loginRes.json();
  const cookie = 'B1SESSION=' + loginData.SessionId;
  
  const bpRes = await fetch(url + '/BusinessPartners(%27V00010%27)', {
    headers: { Cookie: cookie }
  });
  const bp = await bpRes.json();
  
  console.log('LicTradNum', bp.LicTradNum, 'FederalTaxID', bp.FederalTaxID, 'TaxIdNum', bp.TaxIdNum, 'BPFiscalTaxIDCollection', JSON.stringify(bp.BPFiscalTaxIDCollection));
}
run();
