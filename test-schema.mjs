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
  const res = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/ctes_complete?select=*&limit=1`, { headers });
  const data = await res.json();
  if (data && data.length > 0) {
    console.log("COLUMNS:", Object.keys(data[0]).join(', '));
  } else {
    console.log("NO DATA FOUND");
  }
}

run().catch(console.error);
