import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
  // Execute a query using the anon key to see if any data is returned WITHOUT rpc
  const { data, error } = await supabase.from('orders').select('id').limit(1);
  console.log('Direct query with anon key:', data, error);
}

checkRLS();
