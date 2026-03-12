import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const connectionString = process.env.VITE_SUPABASE_URL 
    ? process.env.VITE_SUPABASE_URL.replace('https://', 'postgres://postgres:').replace('.supabase.co', '.supabase.co:5432/postgres')
    : '';

  const dbUrl = process.env.DATABASE_URL || connectionString;
  const client = new Client({ connectionString: dbUrl });
  
  try {
    await client.connect();
    const res = await client.query('SELECT id, organization_id, environment_id, numero, chave_acesso, situacao, destinatario_nome FROM invoices_nfe ORDER BY created_at DESC LIMIT 5;');
    console.log("Invoices_NFE rows:", JSON.stringify(res.rows, null, 2));
    
    // Check if there's any RLS dropping stuff or general issue with the data that might break the mapper
  } catch(e) {
    console.error("Error", e);
  } finally {
    await client.end();
  }
}

run();
