import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // USE SERVICE ROLE TO BYPASS RLS
);

async function run() {
  console.log("Inspecting 'ctes' table using Service Role Key...");
  
  const { data, error } = await supabase
    .from('ctes')
    .select('id, status, sap_doc_entry, sap_doc_num')
    .limit(10);

  if (error) {
    console.error("Error fetching data:", error.message);
    return;
  }

  console.log("Found rows:", data);
  
  const auditadoCount = data.filter(r => r.status === 'auditado_aprovado').length;
  const auditadoEspacoCount = data.filter(r => r.status === 'Auditado e aprovado').length;
  
  console.log("Count with 'auditado_aprovado':", auditadoCount);
  console.log("Count with 'Auditado e aprovado':", auditadoEspacoCount);
}

run();
