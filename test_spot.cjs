const { createClient } = require('@supabase/supabase-js');
const rawEnv = require('fs').readFileSync('.env', 'utf8');
const supabaseUrl = rawEnv.match(/VITE_SUPABASE_URL=(.*)/)[1];
const supabaseKey = rawEnv.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1];
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('freight_spot_negotiations').select(`
     id,
     freight_spot_invoices (
        invoices_nfe (
           ctes_invoices ( id )
        )
     )
  `).limit(1);
  console.log(error || JSON.stringify(data, null, 2));
}
check();
