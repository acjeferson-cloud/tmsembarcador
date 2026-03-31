import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function check() {
  const { data, error } = await supabaseAdmin
    .from('invoices_nfe')
    .select('id, numero, carrier_id')
    .or('numero.ilike.%945679%');
    
  console.log('Result:', JSON.stringify(data, null, 2));
  console.log('Error:', error);
}

check();
