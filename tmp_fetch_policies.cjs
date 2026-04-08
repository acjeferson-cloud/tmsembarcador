require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.rpc('execute_sql', {
     query: "SELECT policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE tablename = 'pickup_requests';"
  });
  if (error) {
     const { data: d2, error: e2 } = await supabase.rpc('tms_admin_query', {
         q: "SELECT policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE tablename = 'pickup_requests';"
     });
     console.log("Policies:", JSON.stringify(d2, null, 2));
  } else {
     console.log("Policies:", JSON.stringify(data, null, 2));
  }
}
run();
