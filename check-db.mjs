import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1]] = match[2].replace(/\r|"/g, '');
});

const key = env.VITE_SUPABASE_ANON_KEY;
const headers = { 'apikey': key, 'Authorization': `Bearer ${key}` };

async function run() {
  // Find invoices where number contains 945679
  const res = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/ctes_invoices?select=*&number=ilike.*945679*`, { headers });
  const data = await res.json();
  console.log("CTEs Invoices for 945679:");
  console.log(JSON.stringify(data, null, 2));
  
  // Find CT-e 7101267
  const resCte = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/ctes_complete?select=id,access_key,number&number=ilike.*7101267*`, { headers });
  const dataCte = await resCte.json();
  console.log("CT-e 7101267:");
  console.log(JSON.stringify(dataCte, null, 2));

  if (dataCte && dataCte.length > 0) {
     const cteId = dataCte[0].id;
     const resInv = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/ctes_invoices?select=*&cte_id=eq.${cteId}`, { headers });
     const dataInv = await resInv.json();
     console.log("Invoices linked to CT-e:", cteId);
     console.log(JSON.stringify(dataInv, null, 2));
     
     const resCost = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/ctes_carrier_costs?select=*&cte_id=eq.${cteId}`, { headers });
     const dataCost = await resCost.json();
     console.log("Costs for CT-e:", cteId);
     console.log(JSON.stringify(dataCost, null, 2));
  }
}

run().catch(console.error);
