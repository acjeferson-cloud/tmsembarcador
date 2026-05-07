import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  const { data, error } = await supabase
    .from('freight_rate_tables')
    .select('id, nome, data_inicio, data_fim, created_at')
    .like('nome', '%gelo%');
  
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}

checkTables();
