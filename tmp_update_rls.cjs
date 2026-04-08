require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const sql = `
DO $$
BEGIN
    DROP POLICY IF EXISTS "Enable insert for authenticated users within same organization" ON pickup_requests;
    DROP POLICY IF EXISTS "Enable all for authenticated users on pickup_requests" ON pickup_requests;
    DROP POLICY IF EXISTS "Enable ALL for authenticated users within same organization" ON pickup_requests;
    
    CREATE POLICY "Enable all for authenticated users on pickup_requests" ON pickup_requests
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);
END
$$;
`;
  const { data, error } = await supabase.rpc('execute_sql', {
     query: sql
  });
  
  if (error) {
     console.error("Error executing SQL:", error);
  } else {
     console.log("Success! RLS updated.");
  }
}
run();
