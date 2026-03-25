import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function check() {
  const { data, error } = await supabaseAdmin.rpc('get_function_definition', { function_name: 'saas_admin_login' });
  if (error) {
    // try direct query if rpc doesn't exist
    const res = await supabaseAdmin.from('pg_proc').select('prosrc').eq('proname', 'saas_admin_login');
    console.log(res.data);
  } else {
    console.log(data);
  }
}
check();
