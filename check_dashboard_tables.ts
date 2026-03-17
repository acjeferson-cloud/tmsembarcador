import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''; // Em Dev, pode ser o service role key pra ver tudo
// Vou usar a env normal

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("--- CTES COMPLETE ---");
  let { data: ctes, error: e1 } = await supabase.from('ctes_complete').select('id, issue_date, status, total_value').limit(15);
  console.log(e1 ? e1 : ctes);

  console.log("--- ORDERS ---");
  let { data: ords, error: e2 } = await supabase.from('orders').select('id, data_pedido, status, data_entrega_realizada, data_prevista_entrega, organization_id, environment_id').limit(15);
  console.log(e2 ? e2 : ords);

  console.log("--- INVOICES NFE ---");
  let { data: nfes, error: e3 } = await supabase.from('invoices_nfe').select('id, data_emissao, situacao').limit(15);
  console.log(e3 ? e3 : nfes);
}
run();
