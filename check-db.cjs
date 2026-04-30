require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await s.from('erp_integration_config').select('*').limit(1);
  console.log('Columns:', Object.keys(data[0] || {}));
}
run();
