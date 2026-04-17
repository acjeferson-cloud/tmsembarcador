import { loadEnv } from 'vite';
import { createClient } from '@supabase/supabase-js';

const env = loadEnv('development', process.cwd(), '');
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function checkAlfa() {
  const { data } = await supabase.from('carriers').select('id, razao_social, email, telefone').ilike('razao_social', '%ALFA%');
  console.log("ALFA carriers:");
  console.log(data);
}
checkAlfa();
