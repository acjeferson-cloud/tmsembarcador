import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey;

const supabase = createClient(supabaseUrl, supabaseAdminKey);

async function test() {
  const { data, error } = await supabase.from('invoices_nfe').select('id, numero, chave_nfe').eq('chave_nfe', '42250982981721000194550020009456791988463470');
  console.log('Query by exact key:', JSON.stringify(data, null, 2));

  const { data: data2, error: err2 } = await supabase.from('invoices_nfe').select('id, numero, chave_nfe').like('chave_nfe', '%945679%').limit(5);
  console.log('Query by like 945679:', JSON.stringify(data2, null, 2));
}
test();
