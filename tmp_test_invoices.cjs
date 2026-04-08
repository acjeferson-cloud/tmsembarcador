require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('establishments').select('id, cnpj, metadata, logo_light_base64, logoUrl:logo_url, fantasia').ilike('cnpj', '%82.981.721/0001-94%');
  console.log(JSON.stringify(data, null, 2));
}
run();
