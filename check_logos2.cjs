const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

async function checkLogos() {
  const { data } = await supabase.from('establishments').select('id, razao_social, logo_url, metadata').limit(5);
  console.log(JSON.stringify(data, null, 2));
}
checkLogos();
