import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function check() {
  const { data, error } = await supabaseAdmin.from('invoices_nfe').select('id, numero, number, carrier_id').or('numero.eq.945679,number.eq.945679,numero.ilike.%945679%,number.ilike.%945679%');
  console.log('Result:', JSON.stringify(data, null, 2));
  console.log('Error:', error);
}

check();
