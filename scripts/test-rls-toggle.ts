import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLSToggle() {
  const { data, error } = await supabase.rpc('get_current_setting', { setting_name: 'test' });
}
// wait, I can't read pg_class via PostgREST easily.
// Let's just create an RPC to ask if RLS is enabled.
// Actually I don't need to. I know my migration enabled it.
