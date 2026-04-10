import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data: pinfo } = await supabase.rpc('get_table_columns_info', { table_name: 'pickup_invoices' });
  console.log('Columns:', pinfo);
  
  if (!pinfo) {
     // fallback
     const { data, error } = await supabase.from('pickup_invoices').select('*').limit(1);
     console.log('Data:', data, 'Error:', error);
  }
}

test();
