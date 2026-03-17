import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey;

const supabase = createClient(supabaseUrl, supabaseAdminKey);

async function test() {
  const { data, error } = await supabase.from('invoices_nfe').select('id, numero, chave_acesso').eq('chave_acesso', '42250982981721000194550020009456791988463470');
  console.log('Query by exact chave_acesso:', JSON.stringify(data, null, 2));
}
test();
