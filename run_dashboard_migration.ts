import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

async function run() {
  const connectionString = process.env.VITE_SUPABASE_URL 
    ? process.env.VITE_SUPABASE_URL.replace('https://', 'postgres://postgres:').replace('.supabase.co', '.supabase.co:5432/postgres')
    : '';

  const dbUrl = process.env.DATABASE_URL || connectionString;
  
  if (!dbUrl) {
     console.error("No DB URL");
     return;
  }
  
  console.log("Connecting to Database...");
  const client = new Client({ connectionString: dbUrl });
  
  try {
    await client.connect();
    console.log("Connected. Reading migration file...");
    
    const sqlPath = path.join(__dirname, 'supabase', 'migrations', '20260318000003_create_dashboard_functions.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log("Executing SQL...");
    await client.query(sql);
    
    console.log("Reloading PostgREST Schema...");
    await client.query(`NOTIFY pgrst, 'reload schema';`);
    
    console.log("✅ Dashboard RPC functions created successfully!");
  } catch(e) {
    console.error("❌ Error executing migration:", e);
  } finally {
    await client.end();
  }
}

run();
