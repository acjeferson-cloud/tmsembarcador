import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: ctes, error } = await supabase.from('ctes_complete').select('id, number, access_key, created_at').order('created_at', { ascending: false }).limit(5);
  console.log('Last 5 CTEs:', ctes, error);
  
  if (ctes && ctes.length > 0) {
    const { data: invs } = await supabase.from('ctes_invoices').select('*').eq('cte_id', ctes[0].id);
    console.log('Invoices for', ctes[0].number, ':', invs);
  }

  const { data: logs } = await supabase.from('xml_auto_import_logs').select('id, details, error_message, created_at').order('execution_time', { ascending: false }).limit(2);
  console.log('Logs:', JSON.stringify(logs, null, 2));
}
check();
