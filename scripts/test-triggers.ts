import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: cols } = await supabase.rpc('get_table_columns_by_name', { table_name: 'invoices_nfe' });
  console.log('invoices_nfe cols:', cols);
  
  // Can't reliably query triggers without pg_trigger or a special function. Let's just try to insert a fake record to invoices_nfe_carrier_costs and see WHY it fails.
}
check();
