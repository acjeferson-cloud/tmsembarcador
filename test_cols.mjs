import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('erp_integration_config').select('*').limit(1);
  if (error) {
    console.error(error);
  } else {
    // se estiver vazio, a query não dá erro, mas os nomes das colunas não vêm no data se len == 0
    // vamos pegar as meta-informações
  }
}
test();
