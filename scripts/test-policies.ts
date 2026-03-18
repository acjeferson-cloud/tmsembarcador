import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPoliciesRaw() {
  const { data, error } = await supabase.from('pg_policies').select('*').eq('tablename', 'invoices_nfe');
  console.log('policies raw:', data, error);
}
checkPoliciesRaw();
