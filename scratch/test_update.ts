import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function run() {
  const cteId = '133d3d54-f5fe-4f19-a93a-86111f26a570'; // Example ID from logs if possible, or I'll just find one
  
  console.log("Fetching a sample 'Auditado e aprovado' CT-e...");
  const { data: ctes } = await supabase
    .from('ctes')
    .select('id, status')
    .eq('status', 'auditado_aprovado')
    .limit(1);

  if (!ctes || ctes.length === 0) {
    console.log("No 'auditado_aprovado' CT-es found.");
    return;
  }

  const id = ctes[0].id;
  console.log("Testing update for ID:", id);

  const { data, error, status } = await supabase
    .from('ctes')
    .update({ 
      status: 'importado',
      sap_doc_entry: null,
      sap_doc_num: null,
      sap_integration_type: null
    })
    .eq('id', id)
    .select();

  if (error) {
    console.error("Update failed:", error.message);
  } else {
    console.log("Update success! Status code:", status);
    console.log("Data returned:", data);
  }
}

run();
