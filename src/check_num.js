import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkNum() {
  const { data: nfe } = await supabase.from('invoices_nfe').select('*').eq('numero', '982635');
  console.log('NFe 982635 facts:', nfe);
}

checkNum();
