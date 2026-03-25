import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: oData, error: oError } = await supabase.from('orders').select('id, establishment_id').limit(5);
  console.log('Orders establishment_id:', oData || oError);
  
  const { data: cData, error: cError } = await supabase.from('ctes').select('id, establishment_id').limit(5);
  console.log('CTEs establishment_id:', cData || cError);
  
  const { data: pData, error: pError } = await supabase.from('pickups').select('id, establishment_id').limit(5);
  console.log('Pickups establishment_id:', pData || pError);
}

main();
