import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function check() {
  const res1 = await supabase.from('bills').select('*').limit(1);
  console.log('bills check:', res1);
  
  const res2 = await supabase.from('invoices').select('*').limit(1);
  console.log('invoices check:', res2);
}

check();
