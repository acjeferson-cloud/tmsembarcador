import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRole || supabaseKey);

async function check() {
  const { data, error } = await supabase.rpc('query_sql', {
    sql: "SELECT polname, roles, cmd, qual, with_check FROM pg_policies WHERE tablename = 'establishments';"
  });
  
  if (error) {
     // fallback if rpc doesn't exist
     console.log("RPC query_sql might not exist. Error:", error.message);
  } else {
     console.log(data);
  }
}
check();
