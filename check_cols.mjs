import { loadEnv } from 'vite';
import { createClient } from '@supabase/supabase-js';

const env = loadEnv('development', process.cwd(), '');
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function checkCols() {
  const { data, error } = await supabase.from('establishments').select('*').limit(1);
  if (data && data.length > 0) {
      console.log(Object.keys(data[0]));
      console.log("Logo keys:", Object.keys(data[0]).filter(k => k.includes('logo')));
      console.log(data[0].metadata);
  }
}
checkCols();
