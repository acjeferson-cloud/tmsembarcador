import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("ERRO: VITE_SUPABASE_URL ou variáveis de chave faltando no .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function reloadSchema() {
  console.log('Reloading Postgres Schema Cache on PostgREST...');
  const { data, error } = await supabase.rpc('exec_sql', {
    sql_query: "NOTIFY pgrst, 'reload schema';"
  });

  if (error) {
    console.error('Failed to notify schema reload via exec_sql:', error.message);
    
    // Fallback: try to hit a random non-existent endpoint or do something else if exec_sql fails
    // But honestly exec_sql should work if it was installed.
  } else {
    console.log('Schema reload triggered successfully! Response:', data);
  }
}

reloadSchema();
