import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
  const { data, error } = await supabase
    .from('freight_rate_tables')
    .select('id, nome, data_inicio')
    .eq('data_inicio', '2026-01-01T00:00:00.000Z');
  
  console.log("Com T00:00:00.000Z:", data?.length);

  const { data: data2 } = await supabase
    .from('freight_rate_tables')
    .select('id, nome, data_inicio')
    .eq('data_inicio', '2026-01-01');
  
  console.log("Sem Z:", data2?.length);
}

testQuery();
