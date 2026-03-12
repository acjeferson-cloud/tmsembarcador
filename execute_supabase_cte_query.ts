import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Fetching from ctes table...");
  const { data: ctes, error } = await supabase
    .from('ctes')
    .select('*')
    .limit(2);

  if (error) {
    console.error("DEBUG ERROR:", error);
    return;
  }

  console.log("Success! Fetched rows:", ctes?.length);
  if (ctes?.length) {
    console.log("Sample:", Object.keys(ctes[0]));
  }
}

run();
