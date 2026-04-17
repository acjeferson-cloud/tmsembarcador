import { loadEnv } from 'vite';
import { createClient } from '@supabase/supabase-js';

const env = loadEnv('development', process.cwd(), '');
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function checkCols() {
  const { data, error } = await supabase.from('email_outgoing_configs').select('*');
  console.log(data);
}
checkCols();
