import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data: cols } = await supabase.rpc('get_table_columns_info', { table_name: 'invoices_nfe' });
  console.log('Columns:', cols);
  
  if (!cols) {
     const { data, error } = await supabase.from('invoices_nfe').select('id, numero').limit(1);
     console.log('Data:', data, 'Error:', error);
  }
}

test();
