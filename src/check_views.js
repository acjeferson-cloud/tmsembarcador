import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('invoices_nfe').select('metadata').limit(10);
  console.log('invoices_nfe metadata:', JSON.stringify(data, null, 2));
}

test();
