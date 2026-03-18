import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''; // Must be anon
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAnonCosts() {
  const { data, error } = await supabase.from('invoices_nfe_carrier_costs').select('id, organization_id').limit(1);
  console.log('costs select error with anon:', error, data);
}
checkAnonCosts();
