import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: cte } = await supabase.from('ctes_complete').select('id, number, access_key').eq('number', '7101267').order('created_at', { ascending: false }).limit(1).single();
  if (!cte) {
    console.log('CTE 7101267 not found.');
    return;
  }
  console.log('CTE ID:', cte.id);
  
  const { data: invs } = await supabase.from('ctes_invoices').select('*').eq('cte_id', cte.id);
  console.log('Invoices:', invs);
}
check();
