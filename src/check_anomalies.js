import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.rpc('get_table_columns_info', { table_name: 'mv_control_tower_anomalies' });
  console.log('Columns mv_control_tower_anomalies:', data);
}

test();
