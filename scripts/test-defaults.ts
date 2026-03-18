import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || supabaseKey);

async function check() {
  const { data } = await supabase.rpc('get_table_columns', { table_name: 'invoices_nfe' });
  console.log('We dont have an RPC. Trying regular select');
  
  const { data: d2, error } = await supabase.from('invoices_nfe').select('organization_id, environment_id').limit(1);
  console.log('nfe data:', d2, error);
}
check();
