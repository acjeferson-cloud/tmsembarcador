import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function inspectDb() {
  const { data: negs } = await supabase
    .from('freight_spot_negotiations')
    .select('code, status, id, updated_at')
    .order('created_at', { ascending: false })
    .limit(5);
    
  console.log('Latest 5 Spot Negotiations in DB:', negs);
}

inspectDb();
