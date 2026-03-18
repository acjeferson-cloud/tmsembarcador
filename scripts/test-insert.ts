import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  const { data: nfe } = await supabase.from('invoices_nfe').select('id').limit(1).single();
  const { data: carrier } = await supabase.from('carriers').select('id').limit(1).single();

  if (!nfe || !carrier) return;

  const cost = {
    invoice_id: nfe.id,
    carrier_id: carrier.id,
    carrier_name: 'Test',
    carrier_document: '000',
    freight_type: 'CIF',
    freight_weight_value: 0,
    freight_value_value: 0,
    total_value: 0
  };

  const { error } = await supabase.from('invoices_nfe_carrier_costs').insert(cost);
  if (error) {
    console.error('Insert Error:', error.message, error.details);
  } else {
    console.log('Insert succeeded.');
  }
}
testInsert();
