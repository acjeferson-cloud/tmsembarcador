import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkJWT() {
  // We can't easily get the user's JWT from here unless we log in. 
  // Let's just create an RPC to print all current_settings that start with request.jwt
  const { data, error } = await supabase.rpc('get_current_setting', { setting_name: 'request.jwt.claims' });
  console.log('claims:', data, error);
}
checkJWT();
