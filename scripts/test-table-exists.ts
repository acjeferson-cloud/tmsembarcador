import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
  const { data, error } = await supabase.from('invoices_nfe_carrier_costs').select('id').limit(1);
  if (error) {
    console.error('Table Error:', error.message);
  } else {
    console.log('Table EXISTS. Data length:', data.length);
  }
}
checkTable();
