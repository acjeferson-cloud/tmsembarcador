import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: tables } = await supabase.from('freight_rate_tables').select('id, name');
  console.log('Tables:', tables?.map(t => t.name) || 'None');
  
  const { data: tariffs } = await supabase.from('freight_rate_tariffs').select('id, name, route_name').limit(20);
  console.log('Tariffs:', tariffs || 'None');
}
run();
