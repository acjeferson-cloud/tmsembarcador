import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function run() {
  console.log("Checking what PostgREST sees for 'ctes'...");
  const { data, error } = await supabase
    .from('ctes')
    .select('sap_doc_entry')
    .limit(1);

  if (error) {
    console.error("Error detected:", error.message);
  } else {
    console.log("Success! Column 'sap_doc_entry' is visible.");
  }
}

run();
