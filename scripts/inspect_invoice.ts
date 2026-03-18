import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectInvoice() {
  const { data, error } = await supabase
    .from('invoices_nfe')
    .select('*')
    .eq('numero', '962213')
    .single();

  if (error) {
    console.error('Error fetching invoice:', error);
    return;
  }

  console.log('Invoice ID:', data.id);
  console.log('Carrier ID:', data.carrier_id);
  console.log('Valor Frete:', data.valor_frete);
  
  if (data.freight_results) {
    console.log('Freight Results:', JSON.stringify(data.freight_results, null, 2));
  } else {
    console.log('Freight Results is null or empty');
  }
}

inspectInvoice();
