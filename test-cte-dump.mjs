import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function dump() {
  const { data: cte } = await supabase
    .from('ctes_complete')
    .select('id, access_key, total_value, cargo_weight, cargo_value, total_weight, cargo_weight_for_calculation')
    .eq('access_key', '42250982110818000121570000071012671063166168')
    .single();
    
  console.log('CTE DATA:', JSON.stringify(cte, null, 2));
  
  const { data: costs } = await supabase
    .from('ctes_carrier_costs')
    .select('cost_type, cost_value')
    .eq('cte_id', cte.id);
    
  console.log('COSTS:', JSON.stringify(costs, null, 2));
}
dump();
