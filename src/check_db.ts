
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  const { data, error } = await supabase.from('user_activities').select('id').limit(1);
  
  const { data: data2, error: error2 } = await supabase.from('audit_logs').select('id').limit(1);
}
main();
