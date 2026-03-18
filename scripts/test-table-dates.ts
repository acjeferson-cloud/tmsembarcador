import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: carrier } = await supabase.from('carriers').select('*').ilike('codigo', '%0001%').single();
  const { data: table } = await supabase.from('freight_rate_tables').select('id, nome, data_inicio, data_fim').eq('transportador_id', carrier.id).eq('status', 'ativo');
  console.log(table);
}
run();
