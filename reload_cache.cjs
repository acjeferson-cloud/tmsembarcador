require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.rpc('tms_admin_query', {
     q: "NOTIFY pgrst, 'reload schema';"
  });
  console.log("Reload result:", data, error);
}
run();
