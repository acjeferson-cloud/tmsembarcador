import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: 'c:\\Users\\usuário\\Desktop\\TmsEmbarcador\\tmsembarcador\\.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
  const { data, error } = await supabase.from('invoices_nfe_carrier_costs').select('*').limit(1);
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Table exists, data:', data);
  }
}

checkTable();
