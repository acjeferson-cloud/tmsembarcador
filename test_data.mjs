import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
// Use service role to bypass RLS, OR use it to see existing data
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
  const { data, error } = await supabase.from('erp_integration_config').select('*').limit(3);
  console.log("Existing data:", data);
  console.log("Select Error:", error);
  
  if (data && data.length > 0) {
     console.log("Types:", {
       org: typeof data[0].organization_id,
       env: typeof data[0].environment_id,
       est: typeof data[0].establishment_id
     });
  }
}
test();
