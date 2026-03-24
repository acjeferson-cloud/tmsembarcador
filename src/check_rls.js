import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.rpc('get_policies_for_table', { table_name: 'user_innovations' });
  if (error) {
    // Fallback: run a direct raw query if possible (not possible with data client, need postgres client)
    console.error('RPC failed, we might need a direct pg connection:', error.message);
  } else {
    console.log('Policies:', data);
  }
}

main();
