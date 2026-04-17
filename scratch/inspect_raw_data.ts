import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function run() {
  console.log("Fetching a sample of ALL CT-es (including those without matching context if any)...");
  // We try to bypass RLS by querying something that might be public or checking if we get anything
  const { data, error } = await supabase
    .from('ctes')
    .select('id, status, cte_number, sap_doc_entry')
    .limit(10);

  if (error) {
    console.error("Error fetching ctes:", error.message);
    return;
  }

  console.log("Raw rows found:", data);
}

run();
