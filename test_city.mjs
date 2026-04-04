import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const cep = '15354999';
  const { data: range, error } = await supabase.from('zip_code_ranges').select('city_id, start_zip, end_zip').lte('start_zip', cep).gte('end_zip', cep);
  console.log('Ranges:', range, 'Error:', error);
}
test();
