import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: nfe } = await supabase.from('invoices_nfe').select('numero, environment_id, organization_id').eq('numero', '945679').limit(1);
  const { data: bp } = await supabase.from('business_partners').select('cpf_cnpj, environment_id, organization_id').eq('id', 'c8df141e-442b-48d0-9049-6a8611a7bfb9').limit(1);
  
  console.log('NFe Org:', nfe[0].organization_id);
  console.log('BP Org:', bp[0].organization_id);
  console.log('Are they the same Organization?', nfe[0].organization_id === bp[0].organization_id);
}
run();
