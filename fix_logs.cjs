const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env'});
const sup = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const rpcResult = await sup.rpc('exec_sql', { 
    query: `
      DROP POLICY IF EXISTS "Users can view sync logs of their organization" ON public.erp_sync_logs; 
      CREATE POLICY "Allow authenticated select" ON public.erp_sync_logs FOR SELECT TO authenticated USING (true);
    `
  });
  console.log("RPC RESULT:", rpcResult);
}
run();
