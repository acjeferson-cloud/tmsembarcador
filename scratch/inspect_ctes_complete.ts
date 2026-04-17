import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log("Inspecting 'ctes_complete' table using Service Role Key...");
  
  const { data, error } = await supabase
    .from('ctes_complete')
    .select('id, status, sap_doc_entry')
    .limit(10);

  if (error) {
    console.error("Error fetching data:", error.message);
    return;
  }

  console.log("Found rows in 'ctes_complete':", data.length);
  if (data.length > 0) {
     console.log("Sample status:", data[0].status);
     console.log("Sample SAP ID:", data[0].sap_doc_entry);
  }
}

run();
