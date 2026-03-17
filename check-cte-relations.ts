import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey;

const supabase = createClient(supabaseUrl, supabaseAdminKey);

async function test() {
  console.log('Fetching recent ctes_invoices...');
  const { data, error } = await supabase.from('ctes_invoices').select('*').order('created_at', { ascending: false }).limit(3);
  console.log(JSON.stringify(data, null, 2));

  console.log('Fetching recent ctes_complete...');
  const { data: cteData, error: cteError } = await supabase.from('ctes_complete').select('id, number, access_key').order('created_at', { ascending: false }).limit(3);
  console.log(JSON.stringify(cteData, null, 2));
}
test();
