import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: city, error } = await supabase.from('cities').select('id, nome, codigo_ibge').ilike('nome', 'auriflama').single();
  console.log('City:', city, 'Error:', error);
  
  if (city) {
    const { data: ranges } = await supabase.from('zip_code_ranges').select('*').eq('city_id', city.id);
    console.log('Ranges:', ranges);
  }
}
check();
