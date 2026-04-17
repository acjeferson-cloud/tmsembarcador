import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function run() {
  console.log("Fetching distinct statuses from 'ctes'...");
  const { data, error } = await supabase
    .from('ctes')
    .select('status');

  if (error) {
    console.error("Error:", error.message);
    return;
  }

  const statuses = [...new Set(data.map(r => r.status))];
  console.log("Available statuses in DB:", statuses);

  const { data: firstRows } = await supabase
    .from('ctes')
    .select('id, status, sap_doc_entry')
    .limit(5);
  console.log("Sample rows:", firstRows);
}

run();
