import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabaseAdmin.from('electronic_documents').select('id, organization_id, environment_id, establishment_id').limit(10);
  console.log('Admin Query Result:', data?.length, 'docs found');
  if (data && data.length > 0) {
    console.log(data);
  }
}
check();
