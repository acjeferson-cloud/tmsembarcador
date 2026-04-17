import { loadEnv } from 'vite';
import { createClient } from '@supabase/supabase-js';

const env = loadEnv('development', process.cwd(), '');
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAll() {
  const { data, error } = await supabase.from('establishments').select('*').ilike('fantasia', '%Matriz%');
  if (error) console.log("ERROR 1:", error);
  console.log("Found rows for Matriz:", data?.length);
  data?.forEach(d => {
      console.log(`- ID: ${d.id}, CNPJ: ${d.cnpj}, Logo: ${!!d.metadata?.logo_url || !!d.logo_url || !!d.logo_light_base64 || !!d.metadata?.logo_light_base64}`);
  });
}
checkAll();
