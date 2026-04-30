import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env vars
dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase URL or Key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
  console.log("Testing validate_user_credentials_only...");
  const { data, error } = await supabase.rpc('validate_user_credentials_only', {
    p_email: 'jeferson.costa@logaxis.com.br',
    p_password: 'test',
  });
  
  if (error) {
    console.error("RPC Error:", error);
  } else {
    console.log("RPC Data:", data);
  }
}

testLogin();
