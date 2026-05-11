const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data } = await supabase.from('erp_integration_config').select('*').limit(1).single();
  const payload = {
    ...data,
    sap_fetch_drafts: true
  };
  
  await supabase.rpc('save_erp_integration_config', { p_payload: payload });
  const res = await supabase.from('erp_integration_config').select('sap_fetch_drafts').limit(1).single();
  console.log('Result:', res.data);
}
run();