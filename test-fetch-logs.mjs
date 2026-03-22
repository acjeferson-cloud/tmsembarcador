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
  const res = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/xml_auto_import_logs?select=status,created_at,details&order=created_at.desc&limit=3`, { headers });
  const data = await res.json();
  console.log("LAST LOGS:", JSON.stringify(data, null, 2));
}

run().catch(console.error);
