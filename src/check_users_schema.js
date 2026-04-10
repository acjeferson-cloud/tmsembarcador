import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabaseAdmin.from('users').select('*').limit(1);
  if (data && data.length > 0) {
    console.log('Columns users:', Object.keys(data[0]));
  } else {
    console.log('No data or error:', error);
  }
}
check();
