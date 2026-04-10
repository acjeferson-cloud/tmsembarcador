import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const invoiceIds = ['d191fbf6-a56b-413e-95c7-c75af4e50115']; // We know this invoice id

  // 1. Get keys and numbers for invoices
  const { data: invoices } = await supabase
    .from('invoices_nfe')
    .select('chave_acesso, numero')
    .in('id', invoiceIds);

  const lookupStrings = invoices.flatMap(i => [i.chave_acesso, i.numero]).filter(x => !!x);
  
  console.log('Lookup Strings:', lookupStrings);

  // 2. Find CTEs that have invoices with these numbers
  const { data: cteInvoices } = await supabase
    .from('ctes_invoices')
    .select('cte_id')
    .in('number', lookupStrings);
    
  console.log('CTEs that contain these invoices:', cteInvoices);
}

check();
