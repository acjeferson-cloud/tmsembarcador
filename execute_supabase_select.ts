import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Fetching from invoices_nfe...");
  const { data, error } = await supabase
    .from('invoices_nfe')
    .select('id, organization_id, environment_id, establishment_id, numero, chave_acesso, situacao, data_emissao, valor_total, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error fetching data:", error);
    return;
  }

  console.log("Invoices matching query:", JSON.stringify(data, null, 2));
}

run();
