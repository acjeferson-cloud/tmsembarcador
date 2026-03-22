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
  const res1 = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/ctes_complete?access_key=eq.42250982110818000121570000071012671063166168&select=id`, { headers });
  const data1 = await res1.json();
  if (!data1 || !data1.length) return console.log("Not found CTE");
  
  const cteId = data1[0].id;
  const res2 = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/ctes_carrier_costs?cte_id=eq.${cteId}&select=cost_type,cost_value`, { headers });
  const data2 = await res2.json();
  console.log("COSTS:", data2);
}
run();
