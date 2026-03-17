import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey;

const supabase = createClient(supabaseUrl, supabaseAdminKey);

async function test() {
  const { data, error } = await supabase.from('ctes_invoices').select('*').limit(3);
  console.log(JSON.stringify(data, null, 2));
  if(error) console.error(error);
}
test();
