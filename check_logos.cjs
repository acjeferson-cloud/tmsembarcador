const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkLogos() {
  const { data } = await supabase.from('establishments').select('id, razao_social, logo_url, metadata');
  console.log(JSON.stringify(data.slice(0, 3), null, 2));
}
checkLogos();
