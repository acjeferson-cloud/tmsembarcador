import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCols() {
  const { data, error } = await supabase.from('invoices_nfe_carrier_costs').select('organization_id, environment_id').limit(1);
  if (error) {
    console.error('Error fetching cols, table might be missing them:', error.message);
  } else {
    console.log('Columns exist! Data length:', data.length);
  }
}
checkCols();
