const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env'});
const sup = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const query = `
    CREATE OR REPLACE FUNCTION public.get_erp_sync_logs(
        p_organization_id uuid DEFAULT NULL,
        p_environment_id uuid DEFAULT NULL,
        p_establishment_id uuid DEFAULT NULL,
        p_limit integer DEFAULT 50
    )
    RETURNS SETOF public.erp_sync_logs
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
        RETURN QUERY
        SELECT *
        FROM public.erp_sync_logs
        WHERE (p_organization_id IS NULL OR organization_id = p_organization_id)
          AND (p_environment_id IS NULL OR environment_id = p_environment_id)
          AND (p_establishment_id IS NULL OR establishment_id = p_establishment_id)
        ORDER BY created_at DESC
        LIMIT p_limit;
    END;
    $$;
    
    DROP POLICY IF EXISTS "Allow anon select logs" ON public.erp_sync_logs;
    CREATE POLICY "Allow anon select logs" ON public.erp_sync_logs FOR SELECT TO anon USING (true);
  `;
  
  // Try using exec_sql if it exists
  const rpcResult = await sup.rpc('exec_sql', { query });
  console.log("RPC RESULT:", rpcResult);
}
run();
