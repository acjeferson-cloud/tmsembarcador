import pkg from 'pg';
const { Client } = pkg;
import * as dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

async function run() {
  const connectionString = process.env.VITE_SUPABASE_URL 
    ? process.env.VITE_SUPABASE_URL.replace('https://', 'postgres://postgres:').replace('.supabase.co', '.supabase.co:5432/postgres')
    : '';

  const dbUrl = process.env.DATABASE_URL || connectionString;
  
  if (!dbUrl) {
     console.error("No DB URL found in env.");
     process.exit(1);
  }
  
  console.log("Connecting to Database...");
  const client = new Client({ connectionString: dbUrl });
  
  try {
    await client.connect();
    const sql = fs.readFileSync('insert_vacaria.sql', 'utf8');
    
    console.log("Executing Cadastramento de Cidade...");
    await client.query(sql);
    
    console.log("Success! Cidade e Faixas de CEP de Vacaria cadastradas.");
  } catch(e) {
    console.error("Error executing SQL:", e);
  } finally {
    await client.end();
  }
}

run();
