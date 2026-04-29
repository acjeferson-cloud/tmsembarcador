import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.rpc('execute_sql', { 
    sql_query: "SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'save_erp_config';" 
  });
  console.log(JSON.stringify(data || error, null, 2));
}

run();
