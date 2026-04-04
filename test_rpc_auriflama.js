import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data: city } = await supabase.from('cities').select('*').ilike('nome', 'auriflama').single();
  const args = { p_destination_city_id: city.id, p_selected_modals: ['rodoviario', 'aereo', 'aquaviario', 'ferroviario'] };
  console.log('Testing RPC calculate_freight_quotes with args:', args);
  const { data, error } = await supabase.rpc('calculate_freight_quotes', args);
  console.log('Result:', JSON.stringify(data, null, 2));
  if (error) console.log('Error:', error);
}
test();
