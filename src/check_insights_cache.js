import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabaseAdmin.from('ai_insights_cache').select('*').limit(1);
  console.log('Fields:', data ? Object.keys(data[0] || {}) : 'No data');
  if (error) console.error(error);
}
check();
