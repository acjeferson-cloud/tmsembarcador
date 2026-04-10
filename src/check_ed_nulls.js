import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabaseAdmin.from('electronic_documents').select('access_key, document_number, issuer_name, issuer_document, status').limit(10);
  console.log('Admin Query Data:', data);
  if (error) console.log('Error', error);
}
check();
