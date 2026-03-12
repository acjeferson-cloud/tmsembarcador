import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Fetching from invoices_nfe with full join WITHOUT fantasia...");
  const { data: invoices, error } = await supabase
    .from('invoices_nfe')
    .select(`
      *,
      customer:invoices_nfe_customers(
        id,
        razao_social,
        cnpj_cpf,
        cidade,
        estado
      ),
      carrier:carriers(
        id,
        codigo,
        razao_social,
        cnpj
      ),
      products:invoices_nfe_products(
        id,
        descricao,
        quantidade,
        valor_total
      )
    `)
    .order('created_at', { ascending: false })
    .limit(2);

  if (error) {
    console.error("DEBUG ERROR:", error);
    return;
  }

  console.log("Success! Fetched rows:", invoices?.length);
}

run();
