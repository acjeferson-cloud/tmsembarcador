import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('mv_control_tower_financial_audit').select('*').limit(1);
  console.log('Result mv_control_tower_financial_audit:', data, 'Error:', error?.message || error?.details || error?.hint || error?.code);
}

test();
