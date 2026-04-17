import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log("Searching for CT-e '7632158' in 'ctes_complete'...");
  
  const { data, error } = await supabase
    .from('ctes_complete')
    .select('id, number, status, sap_doc_entry, sap_doc_num')
    .eq('number', '7632158');

  if (error) {
    console.error("Error:", error.message);
    return;
  }

  console.log("Search results:", data);
}

run();
