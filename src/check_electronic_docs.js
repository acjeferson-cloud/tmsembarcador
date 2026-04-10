import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('electronic_documents').select('id, organization_id, environment_id, establishment_id').limit(10);
  console.log('Result electronic_documents:', data, 'Error:', error?.message || error?.details || error?.hint || error?.code);
}

test();
